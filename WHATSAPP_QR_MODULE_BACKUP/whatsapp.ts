import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket,
  proto,
  delay,
  downloadMediaMessage
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

// Deduplication: Track recently processed message IDs (with 30 second TTL)
const recentlyProcessedMessages = new Map<string, number>();
const DEDUP_TIMEOUT = 30000; // 30 seconds

export async function createWhatsAppConnection(accountId: string): Promise<string> {
  try {
    // Use file-based auth state for persistent session storage
    const { state, saveCreds } = await useMultiFileAuthState(`./wa_sessions/${accountId}`);
    
    let socket: WASocket;
    try {
      socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
      });
    } catch (error) {
      // If there's an error creating the socket (e.g., corrupted session), delete the session
      console.error(`Error creating WhatsApp socket for ${accountId}, deleting corrupted session:`, error);
      try {
        const fs = require('fs').promises;
        await fs.rm(`./wa_sessions/${accountId}`, { recursive: true, force: true });
      } catch (fsError) {
        console.error(`Error deleting session directory: ${fsError}`);
      }
      await storage.updateWhatsappAccount(accountId, {
        status: 'disconnected',
        qrCode: null,
      });
      throw new Error(`Failed to create WhatsApp connection: ${error instanceof Error ? error.message : String(error)}`);
    }

    let qrCodeData = '';

    // Handle connection errors
    socket.ev.on('connection.error', async (error: any) => {
      console.error(`WhatsApp connection error for ${accountId}:`, error);
      try {
        const fs = require('fs').promises;
        await fs.rm(`./wa_sessions/${accountId}`, { recursive: true, force: true });
      } catch (fsError) {
        console.error(`Error deleting session directory: ${fsError}`);
      }
      await storage.updateWhatsappAccount(accountId, {
        status: 'disconnected',
        qrCode: null,
      });
      activeSessions.delete(accountId);
    });

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

        console.log('WhatsApp account ready for receiving messages:', accountId);
      }
    });

    // Save credentials when updated
    socket.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      console.log(`Received ${messages.length} messages for account ${accountId}, type: ${type}`);
      for (const msg of messages) {
        if (!msg.message) continue;
        
        // Deduplication: Skip if message was recently processed
        const messageKey = `${accountId}:${msg.key.id}`;
        if (recentlyProcessedMessages.has(messageKey)) {
          console.log(`Skipping duplicate message: ${msg.key.id}`);
          continue;
        }
        recentlyProcessedMessages.set(messageKey, Date.now());
        
        // Clean up old entries
        const now = Date.now();
        for (const [key, timestamp] of recentlyProcessedMessages.entries()) {
          if (now - timestamp > DEDUP_TIMEOUT) {
            recentlyProcessedMessages.delete(key);
          }
        }
        
        const remoteJid = msg.key.remoteJid;
        const isFromMe = msg.key.fromMe;
        
        if (!remoteJid) continue;

        // Clean the JID to extract just the phone number
        const cleanNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

        // Skip special WhatsApp numbers and broadcasts
        if (!cleanNumber || !/^\d+$/.test(cleanNumber) || cleanNumber === 'status' || cleanNumber === 'broadcast') {
          console.log(`Skipping special WhatsApp number: ${cleanNumber}`);
          continue;
        }

        // Extract message content
        let messageContent = '';
        let mediaType = 'text';
        
        try {
          if (msg.message.conversation) {
            messageContent = msg.message.conversation;
            mediaType = 'text';
          } else if (msg.message.extendedTextMessage?.text) {
            messageContent = msg.message.extendedTextMessage.text;
            mediaType = 'text';
          } else if (msg.message.imageMessage) {
            messageContent = msg.message.imageMessage?.caption || 'Imagen compartida';
            mediaType = 'image';
          } else if (msg.message.videoMessage) {
            messageContent = msg.message.videoMessage?.caption || 'Video compartido';
            mediaType = 'video';
          } else if (msg.message.documentMessage) {
            messageContent = msg.message.documentMessage?.fileName || 'Documento compartido';
            mediaType = 'document';
          } else if (msg.message.audioMessage) {
            messageContent = 'Audio compartido';
            mediaType = 'audio';
          } else {
            messageContent = '[Mensaje multimedia]';
            mediaType = 'text';
          }
        } catch (error) {
          console.error('Error extracting message content:', error);
          messageContent = '[Mensaje multimedia]';
          mediaType = 'text';
        }

        // Skip empty messages
        if (!messageContent.trim()) {
          console.log('Skipping empty message from:', cleanNumber);
          continue;
        }

        // Save message to database
        try {
          const account = await storage.getWhatsappAccount(accountId);
          if (!account) {
            console.log('Account not found:', accountId);
            continue;
          }

          const conversations = await storage.getConversationsByAccountId(accountId);
          let conversation = conversations.find(c => c.contactNumber === cleanNumber);

          if (!conversation) {
            console.log('Creating new conversation for:', cleanNumber);
            conversation = await storage.createConversation({
              whatsappAccountId: accountId,
              contactNumber: cleanNumber,
              contactName: msg.pushName || null,
              lastMessageText: messageContent,
              lastMessageTime: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000),
            });
          } else {
            console.log('Updating conversation for:', cleanNumber);
            await storage.updateConversation(conversation.id, {
              lastMessageText: messageContent,
              lastMessageTime: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000),
              unreadCount: isFromMe ? 0 : Math.max(0, (conversation.unreadCount || 0) + 1),
            });
          }

          // Check if message already exists
          const existingMessages = await storage.getMessagesByConversationId(conversation.id);
          const messageAlreadyExists = !!existingMessages.find(m => m.messageId === msg.key.id);
          
          if (!messageAlreadyExists) {
            // Save message
            await storage.createMessage({
              conversationId: conversation.id,
              messageId: msg.key.id!,
              direction: isFromMe ? 'outgoing' : 'incoming',
              content: messageContent,
              mediaType: mediaType,
              timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000),
            });
          }
        } catch (error) {
          console.error('Error saving message:', error);
        }
      }
    });

    return qrCodeData;
  } catch (error) {
    console.error('Error creating WhatsApp connection:', error);
    throw error;
  }
}

export async function sendWhatsAppMessage(accountId: string, toNumber: string, content: string): Promise<void> {
  const session = activeSessions.get(accountId);
  if (!session || !session.isConnected) {
    throw new Error(`WhatsApp account ${accountId} is not connected`);
  }

  try {
    const jid = `${toNumber}@s.whatsapp.net`;
    await session.socket.sendMessage(jid, { text: content });
    console.log(`Message sent to ${toNumber} from account ${accountId}`);
  } catch (error) {
    console.error(`Error sending message from ${accountId} to ${toNumber}:`, error);
    throw error;
  }
}

export async function disconnectWhatsApp(accountId: string): Promise<void> {
  const session = activeSessions.get(accountId);
  if (session) {
    try {
      await session.socket.logout();
    } catch (error) {
      console.error(`Error logging out WhatsApp account ${accountId}:`, error);
    }
    activeSessions.delete(accountId);
  }
}

export async function reconnectAllAccounts(): Promise<void> {
  try {
    const allAccounts = await storage.getAllWhatsappAccounts?.() || [];
    const connectedAccounts = allAccounts.filter(a => a.status === 'connected');
    
    console.log(`Reconnecting ${connectedAccounts.length} previously connected WhatsApp accounts`);
    
    for (const account of connectedAccounts) {
      try {
        await createWhatsAppConnection(account.id);
        console.log(`Reconnected account: ${account.deviceName}`);
      } catch (error) {
        console.error(`Failed to reconnect account ${account.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error reconnecting all accounts:', error);
  }
}
