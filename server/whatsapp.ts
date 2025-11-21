import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket,
  proto,
  delay
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { storage } from './storage';
import type { WhatsappAccount } from '@shared/schema';

interface BaileysSession {
  socket: WASocket;
  qrCode?: string;
  isConnected: boolean;
}

// Store active Baileys sessions
const activeSessions = new Map<string, BaileysSession>();

export async function createWhatsAppConnection(accountId: string): Promise<string> {
  try {
    // Use in-memory auth state for now (in production, store in database)
    const { state, saveCreds } = await useMultiFileAuthState(`./wa_sessions/${accountId}`);
    
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    let qrCodeData = '';

    // Handle QR code generation
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        // Generate QR code as data URL
        qrCodeData = await QRCode.toDataURL(qr);
        
        // Update account with QR code
        await storage.updateWhatsappAccount(accountId, {
          qrCode: qrCodeData,
          status: 'pending',
        });
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          console.log('Reconnecting WhatsApp for account:', accountId);
          await delay(3000);
          createWhatsAppConnection(accountId);
        } else {
          // Logged out
          await storage.updateWhatsappAccount(accountId, {
            status: 'disconnected',
            qrCode: null,
          });
          activeSessions.delete(accountId);
        }
      } else if (connection === 'open') {
        console.log('WhatsApp connected for account:', accountId);
        
        // Get phone number
        const phoneNumber = socket.user?.id.split(':')[0];
        
        await storage.updateWhatsappAccount(accountId, {
          status: 'connected',
          phoneNumber: phoneNumber || null,
          qrCode: null,
          lastActive: new Date(),
        });

        activeSessions.set(accountId, {
          socket,
          isConnected: true,
        });

        // Load existing chats/conversations from WhatsApp
        try {
          console.log('Loading chat history for account:', accountId);
          const chats = await socket.fetchAllSingleChats();
          
          for (const chat of chats) {
            if (!chat.jid) continue;
            
            const contactNumber = chat.jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
            const conversations = await storage.getConversationsByAccountId(accountId);
            
            // Skip if conversation already exists
            if (conversations.find(c => c.contactNumber === chat.jid)) {
              continue;
            }

            // Create conversation entry
            await storage.createConversation({
              whatsappAccountId: accountId,
              contactNumber: chat.jid,
              contactName: chat.name || null,
              lastMessageText: chat.lastMessage?.text || null,
              lastMessageTime: chat.lastMessage?.messageTimestamp 
                ? new Date(chat.lastMessage.messageTimestamp * 1000)
                : new Date(),
            });

            console.log('Created conversation for:', contactNumber);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    });

    // Save credentials when updated
    socket.ev.on('creds.update', saveCreds);

    // Handle incoming messages and message updates
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      for (const msg of messages) {
        if (!msg.message) continue;
        
        const remoteJid = msg.key.remoteJid;
        const isFromMe = msg.key.fromMe;
        
        if (!remoteJid) continue;

        // Extract message content - handle all message types
        let messageContent = '';
        if (msg.message.conversation) {
          messageContent = msg.message.conversation;
        } else if (msg.message.extendedTextMessage?.text) {
          messageContent = msg.message.extendedTextMessage.text;
        } else if (msg.message.imageMessage?.caption) {
          messageContent = `[Imagen] ${msg.message.imageMessage.caption}`;
        } else if (msg.message.videoMessage?.caption) {
          messageContent = `[Video] ${msg.message.videoMessage.caption}`;
        } else if (msg.message.documentMessage?.fileName) {
          messageContent = `[Documento] ${msg.message.documentMessage.fileName}`;
        } else if (msg.message.audioMessage) {
          messageContent = '[Audio]';
        } else if (msg.message.contactMessage) {
          messageContent = `[Contacto] ${msg.message.contactMessage.displayName}`;
        } else {
          messageContent = '[Mensaje multimedia]';
        }

        // Skip empty messages
        if (!messageContent.trim()) continue;

        // Save message to database
        try {
          // Find or create conversation
          const account = await storage.getWhatsappAccount(accountId);
          if (!account) continue;

          const conversations = await storage.getConversationsByAccountId(accountId);
          let conversation = conversations.find(c => c.contactNumber === remoteJid);

          if (!conversation) {
            console.log('Creating new conversation for:', remoteJid);
            conversation = await storage.createConversation({
              whatsappAccountId: accountId,
              contactNumber: remoteJid,
              contactName: msg.pushName || null,
              lastMessageText: messageContent,
              lastMessageTime: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000),
            });
          } else {
            await storage.updateConversation(conversation.id, {
              lastMessageText: messageContent,
              lastMessageTime: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000),
              unreadCount: isFromMe ? 0 : Math.max(0, (conversation.unreadCount || 0) + 1),
            });
          }

          // Check if message already exists
          const existingMessages = await storage.getMessagesByConversationId(conversation.id);
          if (!existingMessages.find(m => m.messageId === msg.key.id)) {
            // Save message
            await storage.createMessage({
              conversationId: conversation.id,
              messageId: msg.key.id!,
              direction: isFromMe ? 'outgoing' : 'incoming',
              content: messageContent,
              mediaType: 'text',
              timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000),
            });
          }

          // Check for chatbot rules (only for incoming messages)
          if (!isFromMe && type === 'notify') {
            const chatbots = await storage.getChatbotsByAccountId(accountId);
            const activeChatbot = chatbots.find(bot => bot.isActive && bot.whatsappAccountId === accountId);
            
            if (activeChatbot) {
              const rules = await storage.getChatbotRulesByChatbotId(activeChatbot.id);
              const activeRules = rules.filter(r => r.isActive);
              
              // Check if message matches any rule
              const matchedRule = activeRules.find(rule => 
                messageContent.toLowerCase().includes(rule.trigger.toLowerCase())
              );

              if (matchedRule) {
                // Send automated response
                await delay(1000); // Small delay to seem more natural
                await socket.sendMessage(remoteJid, { text: matchedRule.response });
              }
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      }
    });

    // Handle chat updates for real-time sync
    socket.ev.on('chats.upsert', async (chats) => {
      try {
        for (const chat of chats) {
          if (!chat.id) continue;
          
          const conversations = await storage.getConversationsByAccountId(accountId);
          let conversation = conversations.find(c => c.contactNumber === chat.id);
          
          if (!conversation) {
            // Create new conversation from chat update
            await storage.createConversation({
              whatsappAccountId: accountId,
              contactNumber: chat.id,
              contactName: chat.name || null,
              lastMessageText: null,
              lastMessageTime: new Date(),
            });
          }
        }
      } catch (error) {
        console.error('Error processing chat updates:', error);
      }
    });

    // Wait a bit for QR generation
    await delay(2000);
    
    return qrCodeData;
  } catch (error) {
    console.error('Error creating WhatsApp connection:', error);
    throw error;
  }
}

export async function disconnectWhatsApp(accountId: string): Promise<void> {
  const session = activeSessions.get(accountId);
  if (session?.socket) {
    await session.socket.logout();
    activeSessions.delete(accountId);
  }
  
  await storage.updateWhatsappAccount(accountId, {
    status: 'disconnected',
    qrCode: null,
  });
}

export async function sendWhatsAppMessage(
  accountId: string,
  toNumber: string,
  message: string
): Promise<void> {
  const session = activeSessions.get(accountId);
  
  if (!session?.socket || !session.isConnected) {
    throw new Error('WhatsApp not connected for this account');
  }

  await session.socket.sendMessage(toNumber, { text: message });
}

export function getActiveSession(accountId: string): BaileysSession | undefined {
  return activeSessions.get(accountId);
}
