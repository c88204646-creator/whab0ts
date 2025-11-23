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

// Deduplication: Track recently processed message IDs (with 5 second TTL)
const recentlyProcessedMessages = new Map<string, number>();
const DEDUP_TIMEOUT = 5000; // 5 seconds

// Helper function to add natural introduction to chatbot responses
function addNaturalIntroduction(userMessage: string, response: string, type: 'rule' | 'knowledge' | 'ai'): string {
  const introductions = [
    '¡Perfecto! ',
    'Claro, ',
    'Entendido. ',
    '¡Claro que sí! ',
    'Listo, ',
    'Excelente pregunta. ',
    'Te cuento: '
  ];
  
  // Only add if response doesn't already start with common intro words
  const hasIntro = /^(Claro|Perfecto|Excelente|Listo|Te|Si|No|Entendido|Gratis)/.test(response);
  
  if (!hasIntro && (type === 'knowledge' || type === 'ai')) {
    const intro = introductions[Math.floor(Math.random() * introductions.length)];
    return intro + response.charAt(0).toLowerCase() + response.slice(1);
  }
  
  return response;
}

// Generate response using Gemini API
async function generateGeminiResponse(message: string, apiKey: string, model: 'gemini-flash' | 'gemini-pro'): Promise<string> {
  try {
    const modelName = model === 'gemini-flash' ? 'gemini-2.0-flash-exp' : 'gemini-2.0-pro-exp';
    console.log(`[GEMINI] Calling model: ${modelName}`);
    console.log(`[GEMINI] API Key present: ${apiKey ? 'yes' : 'no'}`);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    console.log(`[GEMINI] URL: ${url.substring(0, 80)}...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Eres un chatbot de atención al cliente útil y amable. Responde brevemente y de forma natural en español a este mensaje: "${message}". Mantén tu respuesta corta (1-2 oraciones máximo).`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.7,
        }
      })
    });

    console.log(`[GEMINI] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GEMINI] Error response:`, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[GEMINI] Response data:`, JSON.stringify(data).substring(0, 200));
    
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textContent) {
      console.log(`[GEMINI] Got text response: ${textContent.substring(0, 100)}`);
      return addNaturalIntroduction(message, textContent, 'ai');
    }
    
    throw new Error(`No text content in response: ${JSON.stringify(data)}`);
  } catch (error) {
    console.error('[GEMINI] Error:', error);
    throw error;
  }
}

// Generate response using OpenAI API
async function generateOpenAIResponse(message: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are a helpful customer service chatbot. Respond briefly and naturally in Spanish. Keep responses short (1-2 sentences max).'
        }, {
          role: 'user',
          content: message
        }],
        max_tokens: 150,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;
    
    if (textContent) {
      return addNaturalIntroduction(message, textContent, 'ai');
    }
    
    throw new Error('No text content in response');
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

export async function createWhatsAppConnection(accountId: string): Promise<string> {
  try {
    // Use in-memory auth state for now (in production, store in database)
    const { state, saveCreds } = await useMultiFileAuthState(`./wa_sessions/${accountId}`);
    
    let socket: WASocket;
    try {
      socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
      });
    } catch (error) {
      // If there's an error creating the socket (e.g., corrupted session), delete the session and update status
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

    // Handle incoming messages and message updates
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

        // Extract message content and media type - handle all message types
        let messageContent = '';
        let mediaType = 'text';
        let mediaUrl: string | undefined;
        
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
            // Download image and convert to base64
            try {
              console.log('Downloading image for message:', msg.key.id);
              const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
                logger: console as any,
                reuploadRequest: socket.updateMediaMessage
              });
              if (buffer && buffer.length > 0) {
                // Detect MIME type - default to jpeg
                let mimeType = 'image/jpeg';
                if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
                  mimeType = 'image/png';
                } else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
                  mimeType = 'image/jpeg';
                } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
                  mimeType = 'image/webp';
                }
                mediaUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
                console.log('Image downloaded successfully, size:', buffer.length, 'bytes, mime:', mimeType);
              } else {
                console.log('Empty or null buffer for image');
              }
            } catch (e) {
              console.error('Error downloading image:', (e as Error).message || e);
            }
          } else if (msg.message.videoMessage) {
            messageContent = msg.message.videoMessage?.caption || 'Video compartido';
            mediaType = 'video';
          } else if (msg.message.documentMessage) {
            messageContent = msg.message.documentMessage?.fileName || 'Documento compartido';
            mediaType = 'document';
          } else if (msg.message.audioMessage) {
            messageContent = 'Audio compartido';
            mediaType = 'audio';
          } else if (msg.message.contactMessage) {
            messageContent = `Contacto: ${msg.message.contactMessage.displayName}`;
            mediaType = 'contact';
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
          // Find or create conversation
          const account = await storage.getWhatsappAccount(accountId);
          if (!account) {
            console.log('Account not found:', accountId);
            continue;
          }

          const conversations = await storage.getConversationsByAccountId(accountId);
          let conversation = conversations.find(c => c.contactNumber === cleanNumber);

          if (!conversation) {
            console.log('Creating new conversation for:', cleanNumber, 'on account:', accountId);
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
            // Save message with correct media type and URL if available
            const newMessage = await storage.createMessage({
              conversationId: conversation.id,
              messageId: msg.key.id!,
              direction: isFromMe ? 'outgoing' : 'incoming',
              content: messageContent,
              mediaType: mediaType,
              mediaUrl: mediaUrl,
              timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000),
            });
            
            // Emit WebSocket event for real-time updates
            try {
              const { broadcastNewMessage } = await import('./websocket-broadcast');
              broadcastNewMessage(conversation.id, newMessage);
            } catch (error) {
              console.error('Error broadcasting message:', error);
            }
          }

          // Check for chatbot rules and knowledge base (only for incoming messages and not already processed)
          if (!isFromMe && !messageAlreadyExists) {
            try {
              console.log(`[CHATBOT] Checking for active chatbot on account ${accountId}`);
              const chatbots = await storage.getChatbotsByAccountId(accountId);
              console.log(`[CHATBOT] Found ${chatbots.length} chatbots for account ${accountId}`);
              
              const activeChatbot = chatbots.find(bot => {
                console.log(`[CHATBOT] Checking bot ${bot.id}: isActive=${bot.isActive}, whatsappAccountId=${bot.whatsappAccountId}`);
                return bot.isActive === true && bot.whatsappAccountId === accountId;
              });
              
              if (!activeChatbot) {
                console.log(`[CHATBOT] No active chatbot found for account ${accountId}`);
              } else {
                console.log(`[CHATBOT] Active chatbot found: ${activeChatbot.id} (${activeChatbot.name})`);
                // Increment total messages count
                await storage.incrementChatbotStats(activeChatbot.id, 'totalMessages');
                let responseMessage = '';
                
                // First, try to match chatbot rules
                const rules = await storage.getChatbotRulesByChatbotId(activeChatbot.id);
                console.log(`[CHATBOT] Found ${rules.length} rules for chatbot ${activeChatbot.id}`);
                const activeRules = rules.filter(r => r.isActive);
                
                const matchedRule = activeRules.find(rule => 
                  messageContent.toLowerCase().includes(rule.trigger.toLowerCase())
                );

                if (matchedRule) {
                  console.log(`[CHATBOT] Matched rule: ${matchedRule.trigger}`);
                  responseMessage = matchedRule.response;
                  // Make response more natural
                  responseMessage = addNaturalIntroduction(messageContent, responseMessage, 'rule');
                  // Log activity asynchronously (don't wait for it)
                  storage.createChatbotActivity({
                    chatbotId: activeChatbot.id,
                    type: 'rule_matched',
                    contactNumber: cleanNumber,
                    messageContent: messageContent,
                    responseContent: responseMessage,
                    matchedRule: matchedRule.trigger,
                  }).catch(err => console.error('[CHATBOT] Error logging activity:', err));
                } else {
                  console.log(`[CHATBOT] No rules matched, searching knowledge base...`);
                  // If no rule matches, search in knowledge base
                  const knowledgeItems = await storage.getKnowledgeBaseItemsByChatbotId(activeChatbot.id);
                  console.log(`[CHATBOT] Found ${knowledgeItems.length} knowledge items`);
                  
                  // Get all categories to check if they're active
                  const allCategories = await storage.getKnowledgeBaseCategoriesByChatbotId(activeChatbot.id);
                  const activeCategoryIds = new Set(allCategories.filter(cat => cat.isActive).map(cat => cat.id));
                  
                  // Filter items: must be active AND in an active category
                  const activeItems = knowledgeItems.filter(item => 
                    item.isActive && (!item.categoryId || activeCategoryIds.has(item.categoryId))
                  );
                  console.log(`[CHATBOT] Found ${activeItems.length} active knowledge items`);
                  
                  if (activeItems.length > 0) {
                    const messageLower = messageContent.toLowerCase();
                    const messageWords = messageLower.split(/\s+/).filter(w => w.length > 2);
                    let bestMatch = null;
                    let bestScore = 0;
                    
                    for (const item of activeItems) {
                      let score = 0;
                      const itemTitleLower = item.title.toLowerCase();
                      const itemContentLower = item.content.toLowerCase();
                      
                      // Check title match - high weight
                      if (itemTitleLower.includes(messageLower)) {
                        score += 20;
                      }
                      // Check word-by-word in title
                      for (const word of messageWords) {
                        if (itemTitleLower.includes(word)) score += 3;
                      }
                      
                      // Check keywords - medium weight
                      for (const keyword of item.keywords) {
                        const keywordLower = keyword.toLowerCase();
                        if (messageLower.includes(keywordLower)) score += 10;
                        if (keywordLower.includes(messageLower)) score += 8;
                        // Word-by-word keyword match
                        for (const word of messageWords) {
                          if (keywordLower.includes(word)) score += 2;
                        }
                      }
                      
                      // Check content match - low weight but allow partial matches
                      if (itemContentLower.includes(messageLower)) score += 5;
                      for (const word of messageWords) {
                        if (itemContentLower.includes(word)) score += 1;
                      }
                      
                      if (score > bestScore) {
                        bestScore = score;
                        bestMatch = item;
                      }
                    }
                    
                    if (bestMatch && bestScore > 0) {
                      console.log(`[CHATBOT] Found match: "${bestMatch.title}" (score: ${bestScore})`);
                      responseMessage = bestMatch.content;
                      // Make response more natural
                      responseMessage = addNaturalIntroduction(messageContent, responseMessage, 'knowledge');
                      // Log activity asynchronously (don't wait for it)
                      storage.createChatbotActivity({
                        chatbotId: activeChatbot.id,
                        type: 'knowledge_matched',
                        contactNumber: cleanNumber,
                        messageContent: messageContent,
                        responseContent: responseMessage,
                        matchedKnowledge: bestMatch.title,
                      }).catch(err => console.error('[CHATBOT] Error logging activity:', err));
                    } else {
                      console.log(`[CHATBOT] No knowledge base matches found`);
                      // Try AI response if enabled
                      console.log(`[CHATBOT] useAIResponses=${activeChatbot.useAIResponses}`);
                      if (activeChatbot.useAIResponses) {
                        console.log(`[CHATBOT] AI responses enabled, attempting to generate response...`);
                        try {
                          const aiProviders = await storage.getChatbotAIProviders(activeChatbot.id);
                          console.log(`[CHATBOT] Found ${aiProviders.length} AI providers:`, aiProviders.map(p => ({ provider: p.provider, isActive: p.isActive })));
                          const activeAIProviders = aiProviders.filter(p => p.isActive);
                          console.log(`[CHATBOT] Found ${activeAIProviders.length} active AI providers`);
                          
                          if (activeAIProviders.length > 0) {
                            // Try each AI provider until one works
                            for (const provider of activeAIProviders) {
                              try {
                                console.log(`[CHATBOT] Trying provider: ${provider.provider}`);
                                if (provider.provider === 'openai') {
                                  responseMessage = await generateOpenAIResponse(messageContent, provider.apiKey);
                                } else if (provider.provider === 'gemini-flash' || provider.provider === 'gemini-pro') {
                                  responseMessage = await generateGeminiResponse(messageContent, provider.apiKey, provider.provider);
                                }
                                
                                if (responseMessage) {
                                  console.log(`[CHATBOT] Generated AI response using ${provider.provider}`);
                                  // Log activity for AI response
                                  storage.createChatbotActivity({
                                    chatbotId: activeChatbot.id,
                                    type: 'ai_response',
                                    contactNumber: cleanNumber,
                                    messageContent: messageContent,
                                    responseContent: responseMessage,
                                  }).catch(err => console.error('[CHATBOT] Error logging activity:', err));
                                  break;
                                }
                              } catch (providerError) {
                                console.error(`[CHATBOT] Provider ${provider.provider} failed:`, (providerError as Error).message);
                                // Continue to next provider
                              }
                            }
                          } else {
                            console.log(`[CHATBOT] AI responses enabled but no active AI providers found`);
                          }
                        } catch (aiError) {
                          console.error(`[CHATBOT] Error trying AI response:`, aiError);
                        }
                      }
                    }
                  }
                }

                if (responseMessage) {
                  console.log(`[CHATBOT] Sending response to ${cleanNumber}`);
                  
                  const maxLength = 4096;
                  if (responseMessage.length > maxLength) {
                    const parts = responseMessage.match(/[\s\S]{1,4000}/g) || [responseMessage];
                    for (const part of parts) {
                      await socket.sendMessage(remoteJid, { text: part });
                      await delay(100);
                    }
                  } else {
                    await socket.sendMessage(remoteJid, { text: responseMessage });
                  }
                  
                  // Increment stats asynchronously (don't wait for it)
                  storage.incrementChatbotStats(activeChatbot.id, 'automatedResponses')
                    .catch(err => console.error('[CHATBOT] Error updating stats:', err));
                  console.log(`[CHATBOT] Automated response sent to ${cleanNumber}`);
                } else {
                  console.log(`[CHATBOT] No response message generated`);
                }
              }
            } catch (chatbotError) {
              console.error(`[CHATBOT] Error processing chatbot response:`, chatbotError);
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
          
          // Clean the chat ID to extract just the phone number
          const cleanNumber = chat.id.replace('@s.whatsapp.net', '').replace('@g.us', '');
          
          const conversations = await storage.getConversationsByAccountId(accountId);
          let conversation = conversations.find(c => c.contactNumber === cleanNumber);
          
          if (!conversation) {
            // Create new conversation from chat update
            console.log('Creating conversation from chat update:', cleanNumber);
            await storage.createConversation({
              whatsappAccountId: accountId,
              contactNumber: cleanNumber,
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

  console.log(`\n[WhatsApp SEND] ========================================`);
  console.log(`[WhatsApp SEND] Received raw number: "${toNumber}"`);

  // Clean the phone number: remove ALL spaces, dashes, parentheses, and special characters
  let cleanNumber = toNumber
    .trim()                   // Remove leading/trailing whitespace
    .replace(/\s+/g, '')      // Remove ALL whitespace (very aggressive)
    .replace(/[-()]/g, '')    // Remove dashes and parentheses
    .replace(/[^\d]/g, '');   // Remove ALL non-digit characters (includes +, @, etc)

  console.log(`[WhatsApp SEND] After cleaning: "${cleanNumber}" (${cleanNumber.length} digits)`);

  // Validate number is only digits
  if (!/^\d+$/.test(cleanNumber)) {
    console.error(`[WhatsApp SEND] INVALID: Contains non-digit characters`);
    throw new Error(`Invalid phone number format: ${toNumber}`);
  }

  // Ensure the number has enough digits (at least 10 for most countries)
  if (cleanNumber.length < 10) {
    console.error(`[WhatsApp SEND] INVALID: Too short (${cleanNumber.length} < 10 digits)`);
    throw new Error(`Phone number too short: ${toNumber}`);
  }

  // Format the number as a proper JID for WhatsApp
  const jid = `${cleanNumber}@s.whatsapp.net`;
  
  console.log(`[WhatsApp SEND] JID: ${jid}`);
  console.log(`[WhatsApp SEND] Message length: ${message.length} characters`);
  console.log(`[WhatsApp SEND] Socket state: ${session.socket.user ? 'authenticated' : 'not authenticated'}`);
  
  // Validate socket is in correct state
  if (!session.socket.user) {
    console.error(`[WhatsApp SEND] ERROR: Socket not authenticated`);
    throw new Error('WhatsApp socket not properly authenticated');
  }

  // Retry logic with exponential backoff
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[WhatsApp SEND] Attempt ${attempt}/${maxRetries} to send message...`);
      
      // Send message with proper structure - Baileys expects the message object to have the text field
      const result = await session.socket.sendMessage(jid, { 
        text: message
      });
      
      if (!result?.key?.id) {
        throw new Error('Message sent but no ID returned - possible delivery issue');
      }

      console.log(`[WhatsApp SEND] ✅ Message sent successfully to ${cleanNumber}`);
      console.log(`[WhatsApp SEND] Message ID: ${result.key.id}`);
      console.log(`[WhatsApp SEND] Timestamp: ${result.key.fromMe ? 'local' : 'remote'}`);
      console.log(`[WhatsApp SEND] ========================================\n`);
      return; // Success - exit function
      
    } catch (error: any) {
      lastError = error;
      console.error(`[WhatsApp SEND] ❌ Attempt ${attempt} failed: ${error?.message || error}`);
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`[WhatsApp SEND] Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
      }
    }
  }

  // All retries failed
  console.error(`[WhatsApp SEND] ❌ FAILED after ${maxRetries} attempts`);
  console.error(`[WhatsApp SEND] Last error:`, lastError?.message || lastError);
  console.log(`[WhatsApp SEND] ========================================\n`);
  
  throw new Error(`Failed to send WhatsApp message to ${cleanNumber} after ${maxRetries} attempts: ${lastError?.message}`);
}

export function getActiveSession(accountId: string): BaileysSession | undefined {
  return activeSessions.get(accountId);
}

export async function reconnectAllAccounts(): Promise<void> {
  try {
    console.log('Attempting to reconnect all WhatsApp accounts...');
    const allAccounts = await storage.getAllWhatsappAccounts?.() || [];
    
    for (const account of allAccounts) {
      if (account.status === 'connected') {
        try {
          console.log(`Reconnecting account: ${account.id}`);
          // Silently reconnect without waiting
          createWhatsAppConnection(account.id).catch(err => 
            console.error(`Failed to reconnect ${account.id}:`, err.message)
          );
        } catch (error) {
          console.error(`Error reconnecting account ${account.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in reconnectAllAccounts:', error);
  }
}
