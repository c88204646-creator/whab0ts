import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertWhatsappAccountSchema, insertChatbotSchema, insertChatbotRuleSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { createWhatsAppConnection, disconnectWhatsApp, sendWhatsAppMessage, reconnectAllAccounts } from "./whatsapp";

// Referencing javascript_websocket blueprint
export async function registerRoutes(app: Express): Promise<Server> {
  // Reconnect all previously connected WhatsApp accounts on startup
  reconnectAllAccounts().catch(err => console.error('Error reconnecting accounts:', err));
  
  // Log connected accounts status
  setInterval(async () => {
    try {
      const allAccounts = await storage.getAllWhatsappAccounts?.() || [];
      const connectedCount = allAccounts.filter(a => a.status === 'connected').length;
      if (connectedCount > 0) {
        console.log(`Status: ${connectedCount} WhatsApp accounts connected and listening for messages`);
      }
    } catch (error) {
      console.error('Error in status check:', error);
    }
  }, 30000); // Log status every 30 seconds

  // Authentication endpoints
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
      });

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // WhatsApp Accounts endpoints
  app.get("/api/whatsapp-accounts", async (req: Request, res: Response) => {
    try {
      // In a real app, get userId from session
      const userId = req.query.userId as string || "demo-user-id";
      const accounts = await storage.getWhatsappAccountsByUserId(userId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/whatsapp-accounts", async (req: Request, res: Response) => {
    try {
      const { deviceName, accountType, userId } = req.body;

      const account = await storage.createWhatsappAccount({
        userId: userId || "demo-user-id",
        deviceName,
        accountType,
        phoneNumber: null,
        status: "pending",
        qrCode: null,
        authState: null,
      });

      // Start WhatsApp connection and generate QR
      const qrCode = await createWhatsAppConnection(account.id);

      res.json({ ...account, qrCode });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/whatsapp-accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await disconnectWhatsApp(id);
      await storage.deleteWhatsappAccount(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Conversations endpoints
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const accountId = req.query.accountId as string;
      
      if (!accountId) {
        return res.status(400).json({ error: "accountId is required" });
      }

      const conversations = await storage.getConversationsByAccountId(accountId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Messages endpoints
  app.get("/api/messages/:conversationId", async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getMessagesByConversationId(conversationId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const { accountId, toNumber, content } = req.body;

      // Validate inputs
      if (!accountId || !toNumber || !content) {
        return res.status(400).json({ error: "accountId, toNumber, and content are required" });
      }

      // Clean the phone number for consistency
      const cleanNumber = toNumber
        .replace(/\s+/g, '')      // Remove all whitespace
        .replace(/[-()]/g, '')    // Remove dashes and parentheses
        .replace(/[+]/g, '')      // Remove + if it exists
        .replace(/@.*/g, '');     // Remove JID format if already present

      console.log(`Message endpoint: account=${accountId}, toNumber=${toNumber}, cleanNumber=${cleanNumber}`);

      // Send message via WhatsApp
      await sendWhatsAppMessage(accountId, cleanNumber, content);

      // Find or create conversation using clean number
      const conversations = await storage.getConversationsByAccountId(accountId);
      let conversation = conversations.find(c => c.contactNumber === cleanNumber);

      if (!conversation) {
        conversation = await storage.createConversation({
          whatsappAccountId: accountId,
          contactNumber: cleanNumber,
          contactName: null,
          lastMessageText: content,
          lastMessageTime: new Date(),
        });
      } else {
        await storage.updateConversation(conversation.id, {
          lastMessageText: content,
          lastMessageTime: new Date(),
        });
      }

      // Save message to database
      const message = await storage.createMessage({
        conversationId: conversation.id,
        messageId: `msg-${Date.now()}`,
        direction: 'outgoing',
        content,
        mediaType: 'text',
        timestamp: new Date(),
      });

      res.json(message);
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Chatbots endpoints
  app.get("/api/chatbots/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const chatbot = await storage.getChatbot(id);
      if (!chatbot) {
        return res.status(404).json({ error: "Chatbot not found" });
      }
      res.json(chatbot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chatbots", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const accountId = req.query.accountId as string;
      
      if (userId) {
        const chatbots = await storage.getChatbotsByUserId(userId);
        return res.json(chatbots);
      }

      if (accountId) {
        const chatbots = await storage.getChatbotsByAccountId(accountId);
        return res.json(chatbots);
      }

      return res.status(400).json({ error: "userId or accountId is required" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chatbots", async (req: Request, res: Response) => {
    try {
      const data = insertChatbotSchema.parse(req.body);
      const chatbot = await storage.createChatbot(data);
      res.json(chatbot);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/chatbots/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const chatbot = await storage.updateChatbot(id, req.body);
      res.json(chatbot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/chatbots/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteChatbot(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chatbot Rules endpoints
  app.get("/api/chatbot-rules", async (req: Request, res: Response) => {
    try {
      const chatbotId = req.query.chatbotId as string;
      
      if (!chatbotId) {
        return res.status(400).json({ error: "chatbotId is required" });
      }

      const rules = await storage.getChatbotRulesByChatbotId(chatbotId);
      res.json(rules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chatbot-rules", async (req: Request, res: Response) => {
    try {
      const data = insertChatbotRuleSchema.parse(req.body);
      const rule = await storage.createChatbotRule(data);
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/chatbot-rules/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rule = await storage.updateChatbotRule(id, req.body);
      res.json(rule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/chatbot-rules/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteChatbotRule(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time messaging
  // Referencing javascript_websocket blueprint
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);

        // Handle different message types
        if (data.type === 'subscribe') {
          // Subscribe to conversation updates
          // In production, track subscriptions per connection
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
