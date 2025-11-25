import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertWhatsappAccountSchema, insertChatbotSchema, insertChatbotRuleSchema, insertKnowledgeBaseCategorySchema, insertKnowledgeBaseSubcategorySchema, insertKnowledgeBaseItemSchema, insertSurveySchema, insertSurveyQuestionSchema, insertSurveyResponseSchema, insertBankAccountSchema, insertBankTransactionSchema, insertFacebookAccountSchema, insertClientSchema, insertCalendarEventSchema, insertCalendarAvailabilitySchema, insertCalendarConfigSchema, insertLeadSchema, insertCustomDomainSchema, insertRaffleSchema, insertRaffleTicketSchema, insertRafflePurchaseSchema, insertRaffleStorySchema, insertRaffleBankAccountSchema, insertRaffleCustomerSchema, insertAIProviderSchema, insertTaskSchema, insertStoreProductCategorySchema, insertStoreProductSubcategorySchema } from "@shared/schema";
import { calendarAvailability, calendarConfig, calendarLinkStats, calendarEvents, calendarAnalyticsHistory } from "@shared/schema";
import { conversations, aiProviders, chatbotAIProviders } from "@shared/schema";
import { db } from "./db";
import { desc, eq, and, gte, lte, or, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createWhatsAppConnection, disconnectWhatsApp, sendWhatsAppMessage, reconnectAllAccounts } from "./whatsapp";
import { addRandomDelay, calculateTypingTime, dailyMessageTracker } from "./anti-detection";
import { verifyDomainDNS, validateDomainFormat, checkDomainAvailability } from "./domain-verification";
import { setWebSocketServer } from "./websocket-broadcast";

// Helper function to save analytics snapshots before deleting past events
async function saveAnalyticsSnapshotAndDeletePastEvents() {
  try {
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Get all events that are about to be deleted
    const eventsToDelete = await db.select().from(calendarEvents).where(lt(calendarEvents.endTime, now));
    
    if (eventsToDelete.length === 0) {
      await db.delete(calendarEvents).where(lt(calendarEvents.endTime, now)).catch(() => {});
      return;
    }

    // Group events by date and public token
    const eventsByDateAndToken: Record<string, Record<string, { visitas: number; reservas: number }>> = {};
    
    for (const event of eventsToDelete) {
      if (!event.isPublicBooking) continue;
      
      // Find token for this event
      const config = await db.select().from(calendarConfig).where(eq(calendarConfig.userId, event.userId)).limit(1);
      if (!config.length) continue;
      
      const token = config[0].publicShareToken;
      const eventDate = event.createdAt.toISOString().split('T')[0];
      
      if (!eventsByDateAndToken[eventDate]) {
        eventsByDateAndToken[eventDate] = {};
      }
      if (!eventsByDateAndToken[eventDate][token]) {
        eventsByDateAndToken[eventDate][token] = { visitas: 0, reservas: 0 };
      }
      
      eventsByDateAndToken[eventDate][token].visitas += 1;
      if (event.status === 'confirmed') {
        eventsByDateAndToken[eventDate][token].reservas += 1;
      }
    }

    // Save snapshots for yesterday (if not already saved)
    for (const [dateStr, tokenData] of Object.entries(eventsByDateAndToken)) {
      for (const [token, data] of Object.entries(tokenData)) {
        // Check if snapshot already exists for this date
        const existing = await db.select().from(calendarAnalyticsHistory)
          .where(and(
            eq(calendarAnalyticsHistory.publicShareToken, token),
            eq(calendarAnalyticsHistory.date, dateStr)
          )).limit(1);
        
        if (!existing.length && dateStr === yesterdayStr) {
          // Only save for yesterday
          await db.insert(calendarAnalyticsHistory).values({
            publicShareToken: token,
            date: dateStr,
            visitas: data.visitas,
            reservas: data.reservas,
          }).catch(() => {});
        }
      }
    }

    // Delete past events
    await db.delete(calendarEvents).where(lt(calendarEvents.endTime, now)).catch(() => {});
  } catch (error) {
    console.error('Error in saveAnalyticsSnapshotAndDeletePastEvents:', error);
  }
}

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

  // Get current user (retrieve from frontend localStorage userId)
  app.get("/api/me", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Profile endpoints
  app.patch("/api/user/profile", async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const updated = await storage.updateUser(userId, { name });
      const { password: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Change password endpoint
  app.post("/api/user/change-password", async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword, userId } = req.body;

      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "userId, currentPassword, and newPassword are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "La contraseña actual es incorrecta" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const updated = await storage.updateUser(userId, { password: hashedPassword });
      const { password: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  // Verify WhatsApp connection is truly working
  app.post("/api/whatsapp/verify-connection/:accountId", async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const { testNumber, message } = req.body;

      if (!accountId || !testNumber || !message) {
        return res.status(400).json({ error: "accountId, testNumber, and message are required" });
      }

      console.log(`\n[VERIFY] Starting connection verification for account ${accountId}`);
      console.log(`[VERIFY] Test number: ${testNumber}`);
      console.log(`[VERIFY] Message: ${message}\n`);

      // Clean the phone number
      const cleanNumber = testNumber
        .replace(/\s+/g, '')
        .replace(/[-()]/g, '')
        .replace(/[^\d]/g, '');

      console.log(`[VERIFY] Cleaned number: ${cleanNumber}`);

      if (!/^\d+$/.test(cleanNumber) || cleanNumber.length < 10) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }

      // Attempt to send message and track status
      const startTime = Date.now();
      try {
        await sendWhatsAppMessage(accountId, cleanNumber, message);
        const duration = Date.now() - startTime;
        
        res.json({
          success: true,
          message: "Message appears to have been sent (check your phone to verify)",
          details: {
            accountId,
            cleanNumber,
            duration: `${duration}ms`,
            note: "Baileys may report success but message might not arrive. Check your phone to confirm real delivery."
          }
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: error.message,
          details: "Failed to send - connection or session issue"
        });
      }
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
      });

      // Start WhatsApp connection and generate QR
      const qrCode = await createWhatsAppConnection(account.id);

      res.json({ ...account, qrCode });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/whatsapp-accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({ error: "isActive is required" });
      }

      const account = await storage.updateWhatsappAccount(id, { isActive });
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/whatsapp-accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Only remove from panel storage, don't disconnect from device
      // The WhatsApp connection stays active on the device
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

  app.patch("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { category, priority, status, tags, notes } = req.body;
      
      const conversation = await storage.updateConversation(id, {
        category,
        priority,
        status,
        tags,
        notes,
      });
      res.json(conversation);
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
      const { accountId, toNumber, content, chatbotId, isManual } = req.body;

      // Validate inputs
      if (!accountId || !toNumber || !content) {
        return res.status(400).json({ error: "accountId, toNumber, and content are required" });
      }

      // Use the phone number as-is (it comes from contactNumber in conversation which is already normalized)
      const cleanNumber = toNumber;

      console.log(`Message endpoint: account=${accountId}, toNumber=${toNumber}, cleanNumber=${cleanNumber}, isManual=${isManual}`);

      // Get chatbot settings if provided (for anti-detection measures)
      let minDelay = 2000; // 2 seconds default
      let maxDelay = 8000; // 8 seconds default
      let dailyLimit = 100; // 100 messages per day default
      let respectTypingTime = true;

      if (chatbotId) {
        try {
          const chatbot = await storage.getChatbot(chatbotId);
          if (chatbot) {
            minDelay = chatbot.minResponseDelay || 2000;
            maxDelay = chatbot.maxResponseDelay || 8000;
            dailyLimit = chatbot.dailyMessageLimit || 100;
            respectTypingTime = chatbot.respectUserTypingTime ?? true;
          }
        } catch (e) {
          console.log("Could not load chatbot settings, using defaults");
        }
      }

      // Check daily message limit
      if (!dailyMessageTracker.canSend(accountId, cleanNumber, dailyLimit)) {
        return res.status(429).json({ 
          error: `Daily message limit (${dailyLimit}) reached for this contact. Please try again tomorrow.` 
        });
      }

      // Only apply anti-detection delays for automated chatbot messages, not manual ones
      if (!isManual && chatbotId) {
        // Calculate delay with anti-detection measures
        let delayMs = minDelay;
        if (respectTypingTime) {
          delayMs = Math.max(minDelay, calculateTypingTime(content.length));
          delayMs = Math.min(delayMs, maxDelay); // Cap at max delay
        } else {
          delayMs = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        }

        console.log(`Anti-detection: Adding ${delayMs}ms delay before sending message`);
        
        // Add delay to simulate human behavior
        await addRandomDelay(Math.min(delayMs, maxDelay), maxDelay);
      } else if (isManual) {
        console.log(`Manual message: Sending immediately without delay`);
      }

      // Send message via WhatsApp
      await sendWhatsAppMessage(accountId, cleanNumber, content);
      
      // Increment daily counter
      dailyMessageTracker.increment(accountId, cleanNumber);

      // Find or create conversation using clean number
      const conversations = await storage.getConversationsByAccountId(accountId);
      let conversation = conversations.find(c => c.contactNumber === cleanNumber);

      if (!conversation) {
        conversation = await storage.createConversation({
          whatsappAccountId: accountId,
          contactNumber: cleanNumber,
          lastMessageText: content,
          lastMessageTime: new Date(),
          status: "active",
          category: "general",
          priority: "normal",
          tags: [],
        });
      } else {
        await storage.updateConversation(conversation.id, {
          lastMessageText: content,
          lastMessageTime: new Date(),
        });
      }

      // Don't save message here - wait for WhatsApp echo confirmation
      // This prevents duplicate messages. WhatsApp will send the message back
      // through the messages.upsert event with the correct timestamp.
      
      res.json({ 
        id: `temp-${Date.now()}`,
        conversationId: conversation.id,
        content,
        direction: 'outgoing',
        status: 'sending',
        timestamp: new Date().toISOString(),
      });
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
      const { name, description, type, whatsappAccountId, isActive, useAIResponses, minResponseDelay, maxResponseDelay, dailyMessageLimit, respectUserTypingTime } = req.body;
      
      const chatbot = await storage.updateChatbot(id, {
        name,
        description,
        type,
        whatsappAccountId,
        isActive,
        useAIResponses,
        minResponseDelay,
        maxResponseDelay,
        dailyMessageLimit,
        respectUserTypingTime,
      });
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

  // Get chatbot details
  app.get("/api/chatbots/:id/details", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const chatbot = await storage.getChatbot(id);
      if (!chatbot) return res.status(404).json({ error: "Chatbot not found" });
      res.json(chatbot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Providers endpoints
  app.get("/api/ai-providers", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const providers = await db.select().from(aiProviders).where(eq(aiProviders.userId, userId));
      // Hide API keys in response
      const safe = providers.map(p => ({ ...p, apiKey: '***' }));
      res.json(safe);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai-providers", async (req: Request, res: Response) => {
    try {
      const data = insertAIProviderSchema.parse(req.body);
      const provider = await db.insert(aiProviders).values(data).returning();
      res.json(provider[0]);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/ai-providers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, provider, apiKey, isActive } = req.body;
      const updated = await db.update(aiProviders).set({ name, provider, apiKey, isActive }).where(eq(aiProviders.id, id)).returning();
      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/ai-providers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(aiProviders).where(eq(aiProviders.id, id));
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

  // Knowledge Base Categories
  app.get("/api/knowledge-base/categories/:chatbotId", async (req: Request, res: Response) => {
    try {
      const { chatbotId } = req.params;
      const categories = await storage.getKnowledgeBaseCategoriesByChatbotId(chatbotId);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge-base/categories", async (req: Request, res: Response) => {
    try {
      const data = insertKnowledgeBaseCategorySchema.parse(req.body);
      const category = await storage.createKnowledgeBaseCategory(data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/knowledge-base/categories/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const category = await storage.updateKnowledgeBaseCategory(id, req.body);
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/knowledge-base/categories/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteKnowledgeBaseCategory(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge Base Subcategories
  app.get("/api/knowledge-base/subcategories/:categoryId", async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const subcategories = await storage.getKnowledgeBaseSubcategoriesByCategoryId(categoryId);
      res.json(subcategories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge-base/subcategories", async (req: Request, res: Response) => {
    try {
      const data = insertKnowledgeBaseSubcategorySchema.parse(req.body);
      const subcategory = await storage.createKnowledgeBaseSubcategory(data);
      res.json(subcategory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/knowledge-base/subcategories/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const subcategory = await storage.updateKnowledgeBaseSubcategory(id, req.body);
      res.json(subcategory);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/knowledge-base/subcategories/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteKnowledgeBaseSubcategory(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Surveys endpoints
  app.get("/api/surveys/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const surveys = await storage.getSurveysByUserId(userId);
      const surveysWithData = await Promise.all(
        surveys.map(async (survey) => {
          const questions = await storage.getSurveyQuestionsBySurveyId(survey.id);
          const responses = await storage.getSurveyResponsesBySurveyId(survey.id);
          return { ...survey, questions, responses };
        })
      );
      res.json(surveysWithData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/surveys/detail/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const survey = await storage.getSurvey(id);
      if (!survey) return res.status(404).json({ error: "Survey not found" });
      const questions = await storage.getSurveyQuestionsBySurveyId(id);
      const responses = await storage.getSurveyResponsesBySurveyId(id);
      res.json({ ...survey, questions, responses });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/surveys", async (req: Request, res: Response) => {
    try {
      const { title, description, userId, isActive } = req.body;
      if (!title || !userId) {
        return res.status(400).json({ error: "Title and userId are required" });
      }
      const data = {
        title,
        description: description || null,
        userId,
        isActive: isActive !== undefined ? isActive : true,
      };
      console.log("Creating survey with data:", data);
      const survey = await storage.createSurvey(data);
      console.log("Survey created:", survey);
      res.json(survey);
    } catch (error: any) {
      console.error("Error creating survey:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/surveys/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, isActive, whatsappConfig, customUrl } = req.body;
      const updateData: any = { title, description, isActive };
      if (whatsappConfig !== undefined) updateData.whatsappConfig = whatsappConfig;
      if (customUrl !== undefined) updateData.customUrl = customUrl;
      const survey = await storage.updateSurvey(id, updateData);
      res.json(survey);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/surveys/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteSurvey(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check survey custom URL availability
  app.get("/api/surveys/check-slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const existingSurvey = await db.select().from(surveys).where(eq(surveys.customUrl, slug)).limit(1);
      res.json({ available: existingSurvey.length === 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chatbot Activities endpoints
  app.get("/api/chatbot-activities/:chatbotId", async (req: Request, res: Response) => {
    try {
      const { chatbotId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getChatbotActivities(chatbotId, limit);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get chatbot stats
  app.get("/api/chatbots/:id/stats", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stats = await storage.getChatbotStats(id);
      res.json(stats || { chatbotId: id, totalMessages: 0, automatedResponses: 0, manualResponses: 0, avgResponseTime: 0, satisfactionRate: 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chatbot AI Providers endpoints (assignment/association)
  app.get("/api/chatbots/:chatbotId/ai-providers", async (req: Request, res: Response) => {
    try {
      const { chatbotId } = req.params;
      const chatbotProviders = await db.select().from(chatbotAIProviders).where(eq(chatbotAIProviders.chatbotId, chatbotId));
      res.json(chatbotProviders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chatbots/:chatbotId/ai-providers", async (req: Request, res: Response) => {
    try {
      const { chatbotId } = req.params;
      const { aiProviderId } = req.body;
      if (!aiProviderId) {
        return res.status(400).json({ error: "aiProviderId es requerido" });
      }
      const chatbotProvider = await db.insert(chatbotAIProviders).values({
        chatbotId,
        aiProviderId,
        isActive: true,
      }).returning();
      res.json(chatbotProvider[0]);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/chatbots/:chatbotId/ai-providers/:chatbotProviderId", async (req: Request, res: Response) => {
    try {
      const { chatbotId, chatbotProviderId } = req.params;
      await db.delete(chatbotAIProviders).where(
        eq(chatbotAIProviders.id, chatbotProviderId)
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/survey-questions", async (req: Request, res: Response) => {
    try {
      const data = insertSurveyQuestionSchema.parse(req.body);
      const question = await storage.createSurveyQuestion(data);
      res.json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/survey-questions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { question, type, isRequired, options } = req.body;
      const question_obj = await storage.updateSurveyQuestion(id, {
        question,
        type,
        isRequired,
        options: options || [],
      });
      res.json(question_obj);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/survey-questions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteSurveyQuestion(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get survey questions by survey ID
  app.get("/api/survey-questions/:surveyId", async (req: Request, res: Response) => {
    try {
      const { surveyId } = req.params;
      const questions = await storage.getSurveyQuestionsBySurveyId(surveyId);
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get survey responses by survey ID
  app.get("/api/survey-responses/:surveyId", async (req: Request, res: Response) => {
    try {
      const { surveyId } = req.params;
      const responses = await storage.getSurveyResponsesBySurveyId(surveyId);
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/survey-responses", async (req: Request, res: Response) => {
    try {
      let data = insertSurveyResponseSchema.parse(req.body);
      const { surveyId } = data;
      
      // Check what data we have BEFORE modifying
      const hasName = data.respondentName && data.respondentName.trim();
      const hasWhatsapp = data.respondentWhatsapp && data.respondentWhatsapp.trim();
      
      // Save independently: only save name if provided, only save whatsapp if provided
      // But ALWAYS save country and city
      data = {
        ...data,
        respondentName: hasName ? data.respondentName : null,
        respondentWhatsapp: hasWhatsapp ? data.respondentWhatsapp : null,
      };
      
      const response = await storage.createSurveyResponse(data);
      
      // Capture request info before setTimeout since req won't be available later
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      
      // Send auto-reply after 5 seconds if WhatsApp addon is enabled (based on ORIGINAL hasWhatsapp check)
      setTimeout(async () => {
        try {
          if (hasWhatsapp) {
            const survey = await storage.getSurvey(surveyId);
            const config = survey?.whatsappConfig as any;
            if (survey && config?.enabled && config?.senderId && data.respondentWhatsapp) {
              let message = config?.message || `¡Gracias por responder nuestra encuesta: ${survey.title}!`;
              
              // Replace variables in message - use captured baseUrl
              const surveyUrl = `${baseUrl}/survey/${surveyId}`;
              message = message
                .replace(/\{\{survey_name\}\}/g, survey.title)
                .replace(/\{\{survey_description\}\}/g, survey.description || '')
                .replace(/\{\{survey_url\}\}/g, surveyUrl)
                .replace(/\{\{respondent_name\}\}/g, data.respondentName || 'Respondente');
              
              console.log(`Sending WhatsApp to ${data.respondentWhatsapp} from sender ${config.senderId}`);
              console.log(`Message with variables replaced: "${message}"`);
              await sendWhatsAppMessage(config.senderId, data.respondentWhatsapp, message);
            }
          }
        } catch (error) {
          console.error("Error sending auto-reply:", error);
        }
      }, 5000);
      
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/survey-responses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { answers } = req.body;
      const response = await storage.updateSurveyResponse(id, { answers });
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/survey-responses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteSurveyResponse(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge Base Items
  app.get("/api/knowledge-base/items/:chatbotId", async (req: Request, res: Response) => {
    try {
      const { chatbotId } = req.params;
      const items = await storage.getKnowledgeBaseItemsByChatbotId(chatbotId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge-base/items", async (req: Request, res: Response) => {
    try {
      const data = insertKnowledgeBaseItemSchema.parse(req.body);
      const item = await storage.createKnowledgeBaseItem(data);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/knowledge-base/items/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await storage.updateKnowledgeBaseItem(id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/knowledge-base/items/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteKnowledgeBaseItem(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle category active status
  app.patch("/api/knowledge-base/categories/:id/toggle", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const category = await storage.getKnowledgeBaseCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      const updated = await storage.updateKnowledgeBaseCategory(id, { isActive: !category.isActive });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle item active status
  app.patch("/api/knowledge-base/items/:id/toggle", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await storage.getKnowledgeBaseItem(id);
      if (!item) {
        return res.status(404).json({ error: "Elemento no encontrado" });
      }
      const updated = await storage.updateKnowledgeBaseItem(id, { isActive: !item.isActive });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bank Accounts endpoints
  app.get("/api/bank-accounts/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const accounts = await storage.getBankAccountsByUserId(userId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bank-accounts/detail/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const account = await storage.getBankAccount(id);
      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bank-accounts", async (req: Request, res: Response) => {
    try {
      const data = insertBankAccountSchema.parse(req.body);
      const account = await storage.createBankAccount(data);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/bank-accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const account = await storage.updateBankAccount(id, req.body);
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/bank-accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteBankAccount(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bank Transactions endpoints
  app.get("/api/bank-transactions/:accountId", async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const transactions = await storage.getBankTransactionsByAccountId(accountId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bank-transactions", async (req: Request, res: Response) => {
    try {
      const data = insertBankTransactionSchema.parse(req.body);
      const transaction = await storage.createBankTransaction(data);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/bank-transactions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteBankTransaction(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Facebook Authentication endpoints
  app.post("/api/facebook-auth/start-login", async (req: Request, res: Response) => {
    try {
      const { userId, accountName } = req.body;
      if (!userId || !accountName) {
        return res.status(400).json({ error: "userId y accountName son requeridos" });
      }
      const { startFacebookLogin } = await import("./facebook-auth");
      const result = await startFacebookLogin(userId, accountName);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/facebook-auth/complete-login", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId es requerido" });
      }
      const { completeFacebookLogin } = await import("./facebook-auth");
      const result = await completeFacebookLogin(sessionId);
      // Return both the account and the actual user ID
      res.json({
        account: result.account,
        actualUserId: result.actualUserId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Facebook Accounts endpoints
  app.get("/api/facebook-accounts/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const accounts = await storage.getFacebookAccountsByUserId(userId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/facebook-accounts/detail/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const account = await storage.getFacebookAccount(id);
      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/facebook-accounts", async (req: Request, res: Response) => {
    try {
      const data = insertFacebookAccountSchema.parse(req.body);
      const account = await storage.createFacebookAccount(data);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/facebook-accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const account = await storage.updateFacebookAccount(id, req.body);
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/facebook-accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteFacebookAccount(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Facebook Automation endpoint
  app.post("/api/facebook-automation/execute", async (req: Request, res: Response) => {
    try {
      const { postUrl, selectedAccounts, actionType, commentText } = req.body;
      
      if (!postUrl || !selectedAccounts || selectedAccounts.length === 0) {
        return res.status(400).json({ error: "postUrl y selectedAccounts son requeridos" });
      }

      const { executePostAutomation } = await import("./facebook-automation");
      const results = await executePostAutomation({
        postUrl,
        selectedAccounts,
        actionType,
        commentText,
      });

      res.json({ results, completed: results.filter(r => r.success).length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Calendar endpoints
  app.get("/api/calendar/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Save analytics snapshots and delete past events
      await saveAnalyticsSnapshotAndDeletePastEvents();
      
      const events = await storage.getCalendarEventsByUserId(userId);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/calendar", async (req: Request, res: Response) => {
    try {
      const { userId, title, description, startTime, endTime, contactName, contactPhone, isActive, clientId, leadId } = req.body;
      if (!userId || !title || !startTime || !endTime) {
        return res.status(400).json({ error: "userId, title, startTime, and endTime are required" });
      }
      const event = await storage.createCalendarEvent({
        userId,
        clientId: clientId || null,
        leadId: leadId || null,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        status: "pending",
        isActive: isActive !== undefined ? isActive : true,
      });
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Calendar status endpoint - must be before /:id route
  app.patch("/api/calendar/status", async (req: Request, res: Response) => {
    try {
      const { userId, isActive } = req.body;
      if (!userId || isActive === undefined) {
        return res.status(400).json({ error: "userId and isActive are required" });
      }
      // Update the calendar config status in the database
      const updated = await db.update(calendarConfig).set({ isActive, updatedAt: new Date() }).where(eq(calendarConfig.userId, userId)).returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Calendar config not found" });
      }
      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/calendar/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, startTime, endTime, attendee, status, isActive } = req.body;
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (attendee !== undefined) updateData.attendee = attendee;
      if (status !== undefined) updateData.status = status;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const event = await storage.updateCalendarEvent(id, updateData);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/calendar/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteCalendarEvent(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Calendar Availability endpoints
  app.get("/api/calendar/availability/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const availability = await db.select().from(calendarAvailability).where(eq(calendarAvailability.userId, userId));
      res.json(availability);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/calendar/availability", async (req: Request, res: Response) => {
    try {
      const { userId, dayOfWeek, startTime, endTime, isActive } = req.body;
      if (!userId || dayOfWeek === undefined || !startTime || !endTime) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const result = await db.insert(calendarAvailability).values({
        userId,
        dayOfWeek,
        startTime,
        endTime,
        isActive: isActive ?? true,
      }).returning();
      res.json(result[0]);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/calendar/availability/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { dayOfWeek, startTime, endTime, isActive } = req.body;
      const updateData: any = {};
      if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const result = await db.update(calendarAvailability).set(updateData).where(eq(calendarAvailability.id, id)).returning();
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/calendar/availability/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get the availability slot to check for conflicts
      const availabilitySlot = await db.select().from(calendarAvailability).where(eq(calendarAvailability.id, id)).limit(1);
      if (!availabilitySlot.length) {
        return res.status(404).json({ error: "Horario no encontrado" });
      }
      
      const slot = availabilitySlot[0];
      
      // Check if there are any events scheduled for this day/time slot
      const events = await storage.getCalendarEventsByUserId(slot.userId);
      
      // Convert times to minutes for comparison
      const [slotStartHour, slotStartMin] = slot.startTime.split(":").map(Number);
      const [slotEndHour, slotEndMin] = slot.endTime.split(":").map(Number);
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const slotEndMinutes = slotEndHour * 60 + slotEndMin;
      
      // Check for conflicting events on this day of week
      for (const event of events) {
        const eventDate = new Date(event.startTime);
        const eventDayOfWeek = eventDate.getDay();
        
        if (eventDayOfWeek === slot.dayOfWeek) {
          const eventStartHour = eventDate.getHours();
          const eventStartMin = eventDate.getMinutes();
          const eventStartMinutes = eventStartHour * 60 + eventStartMin;
          
          // Check if event falls within this availability slot
          if (eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotEndMinutes) {
            return res.status(409).json({ 
              error: "No se puede eliminar este horario porque hay citas agendadas en ese rango horario. Elimina o edita las citas primero.",
              hasConflict: true 
            });
          }
        }
      }
      
      // No conflicts, proceed with deletion
      await db.delete(calendarAvailability).where(eq(calendarAvailability.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Calendar Config endpoints
  app.get("/api/calendar/config/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      let config = await db.select().from(calendarConfig).where(eq(calendarConfig.userId, userId));
      if (!config.length) {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const newConfig = await db.insert(calendarConfig).values({
          userId,
          publicShareToken: token,
          isPublicBookingEnabled: true,
          eventDurationMinutes: 60,
        }).returning();
        
        // Create stats record for the new calendar
        await db.insert(calendarLinkStats).values({
          userId,
          publicShareToken: token,
          timesShared: 0,
          timesVisited: 0,
          bookingsCompleted: 0,
          totalMinutesBooked: 0,
          averageMinutesPerBooking: 0,
          returnVisitorCount: 0,
          conversionRate: 0,
        }).catch(() => {});
        
        return res.json(newConfig[0]);
      }
      
      // Ensure stats record exists for existing config
      const existingStats = await db.select().from(calendarLinkStats).where(eq(calendarLinkStats.publicShareToken, config[0].publicShareToken)).limit(1);
      if (!existingStats.length) {
        await db.insert(calendarLinkStats).values({
          userId,
          publicShareToken: config[0].publicShareToken,
          timesShared: 0,
          timesVisited: 0,
          bookingsCompleted: 0,
          totalMinutesBooked: 0,
          averageMinutesPerBooking: 0,
          returnVisitorCount: 0,
          conversionRate: 0,
        }).catch(() => {});
      }
      
      res.json(config[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/calendar/config/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { isPublicBookingEnabled, eventDurationMinutes, businessName, businessDescription } = req.body;
      
      let config = await db.select().from(calendarConfig).where(eq(calendarConfig.userId, userId));
      if (!config.length) {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const newConfig = await db.insert(calendarConfig).values({
          userId,
          publicShareToken: token,
          isPublicBookingEnabled: isPublicBookingEnabled ?? true,
          eventDurationMinutes: eventDurationMinutes ?? 60,
          businessName,
          businessDescription,
        }).returning();
        
        // Create stats record
        await db.insert(calendarLinkStats).values({
          userId,
          publicShareToken: token,
          timesShared: 0,
          timesVisited: 0,
          bookingsCompleted: 0,
          totalMinutesBooked: 0,
          averageMinutesPerBooking: 0,
          returnVisitorCount: 0,
          conversionRate: 0,
        }).catch(() => {});
        
        return res.json(newConfig[0]);
      }

      const updateData: any = {};
      if (isPublicBookingEnabled !== undefined) updateData.isPublicBookingEnabled = isPublicBookingEnabled;
      if (eventDurationMinutes !== undefined) updateData.eventDurationMinutes = eventDurationMinutes;
      if (businessName !== undefined) updateData.businessName = businessName;
      if (businessDescription !== undefined) updateData.businessDescription = businessDescription;
      updateData.updatedAt = new Date();
      
      const result = await db.update(calendarConfig).set(updateData).where(eq(calendarConfig.userId, userId)).returning();
      
      // Ensure stats record exists
      const existingStats = await db.select().from(calendarLinkStats).where(eq(calendarLinkStats.publicShareToken, config[0].publicShareToken)).limit(1);
      if (!existingStats.length) {
        await db.insert(calendarLinkStats).values({
          userId,
          publicShareToken: config[0].publicShareToken,
          timesShared: 0,
          timesVisited: 0,
          bookingsCompleted: 0,
          totalMinutesBooked: 0,
          averageMinutesPerBooking: 0,
          returnVisitorCount: 0,
          conversionRate: 0,
        }).catch(() => {});
      }
      
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public calendar endpoint for guests
  app.get("/api/calendar/public/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const config = await db.select().from(calendarConfig).where(eq(calendarConfig.publicShareToken, token)).limit(1);
      if (!config.length) {
        return res.status(404).json({ error: "Calendar not found" });
      }
      // Check if calendar is active - ONLY THIS BLOCKS ACCESS
      if (!config[0].isActive) {
        return res.status(403).json({ error: "Calendar is inactive" });
      }
      // NOTE: If isPublicBookingEnabled is false, we still return the calendar data
      // Frontend will show calendar but disable the booking button
      const userId = config[0].userId;
      
      // Save analytics snapshots and delete past events
      await saveAnalyticsSnapshotAndDeletePastEvents();
      
      const availability = await db.select().from(calendarAvailability).where(eq(calendarAvailability.userId, userId));
      const events = await storage.getCalendarEventsByUserId(userId);
      
      // Record visit
      const existingStats = await db.select().from(calendarLinkStats).where(eq(calendarLinkStats.publicShareToken, token)).limit(1);
      if (existingStats.length) {
        await db.update(calendarLinkStats).set({ timesVisited: existingStats[0].timesVisited + 1, lastVisitedAt: new Date() }).where(eq(calendarLinkStats.publicShareToken, token));
      }
      
      res.json({ config: config[0], availability, events });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public calendar booking endpoint - for guests to book appointments
  app.post("/api/calendar/public/book/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { title, description, startTime, endTime, contactName, contactPhone } = req.body;

      // Validate required fields
      if (!title || !startTime || !endTime) {
        return res.status(400).json({ error: "title, startTime, and endTime are required" });
      }

      // Get config and validate
      const config = await db.select().from(calendarConfig).where(eq(calendarConfig.publicShareToken, token)).limit(1);
      if (!config.length) {
        return res.status(404).json({ error: "Calendar not found" });
      }

      // Check if calendar is active
      if (!config[0].isActive) {
        return res.status(403).json({ error: "Calendar is inactive" });
      }

      // Check if public booking is enabled
      if (!config[0].isPublicBookingEnabled) {
        return res.status(403).json({ error: "Public booking is disabled" });
      }

      const userId = config[0].userId;

      // Create the calendar event
      const event = await storage.createCalendarEvent({
        userId,
        clientId: null,
        leadId: null,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        status: "pending",
        isActive: true,
        isPublicBooking: true,
      });

      // Update booking stats
      const existingStats = await db.select().from(calendarLinkStats).where(eq(calendarLinkStats.publicShareToken, token)).limit(1);
      if (existingStats.length) {
        // Calculate minutes for this booking
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        const minutesThisBooking = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
        
        // Calculate new totals and averages
        const newTotalMinutes = (existingStats[0].totalMinutesBooked || 0) + minutesThisBooking;
        const newBookingsCompleted = existingStats[0].bookingsCompleted + 1;
        const newAverageMinutes = Math.floor(newTotalMinutes / newBookingsCompleted);
        const newConversionRate = existingStats[0].timesVisited > 0 
          ? Math.round((newBookingsCompleted / existingStats[0].timesVisited) * 100)
          : 0;
        
        // Get day of week for peak booking day
        const dayOfWeekNum = startTime.getDay();
        const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dayName = daysOfWeek[dayOfWeekNum];
        
        await db.update(calendarLinkStats).set({
          bookingsCompleted: newBookingsCompleted,
          totalMinutesBooked: newTotalMinutes,
          averageMinutesPerBooking: newAverageMinutes,
          conversionRate: newConversionRate,
          peakBookingDay: dayName,
          lastBookedAt: new Date()
        }).where(eq(calendarLinkStats.publicShareToken, token));
      }

      res.json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Calendar link statistics endpoints
  app.get("/api/calendar/stats/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const stats = await db.select().from(calendarLinkStats).where(eq(calendarLinkStats.publicShareToken, token)).limit(1);
      if (!stats.length) {
        return res.json({ timesShared: 0, timesVisited: 0, bookingsCompleted: 0 });
      }
      res.json(stats[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/calendar/stats/share/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const existingStats = await db.select().from(calendarLinkStats).where(eq(calendarLinkStats.publicShareToken, token)).limit(1);
      if (existingStats.length) {
        await db.update(calendarLinkStats).set({ timesShared: existingStats[0].timesShared + 1, lastSharedAt: new Date() }).where(eq(calendarLinkStats.publicShareToken, token));
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Calendar analytics endpoint - comprehensive stats (real-time from database)
  app.get("/api/calendar/analytics/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      // Get link stats first (primary source of truth)
      const linkStats = await db.select().from(calendarLinkStats).where(eq(calendarLinkStats.publicShareToken, token)).limit(1);
      if (!linkStats.length) {
        return res.json({
          timesShared: 0,
          timesVisited: 0,
          bookingsCompleted: 0,
          totalMinutesBooked: 0,
          averageMinutesPerBooking: 0,
          peakBookingDay: null,
          returnVisitorCount: 0,
          conversionRate: 0,
          lastSharedAt: null,
          lastVisitedAt: null,
          lastBookedAt: null
        });
      }

      // Get calendar config by token to find userId
      const config = await db.select().from(calendarConfig).where(eq(calendarConfig.publicShareToken, token)).limit(1);
      if (!config.length) {
        return res.json(linkStats[0]);
      }

      const userId = config[0].userId;
      
      // Get all public bookings
      const events = await db.select().from(calendarEvents).where(
        and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.isPublicBooking, true)
        )
      );

      // Calculate all metrics in real-time
      // Count both 'confirmed' and 'pending' as valid bookings for public bookings
      const confirmedEvents = events.filter(e => e.status === 'confirmed' || e.status === 'pending');
      
      // Count bookings and calculate minutes
      let totalMinutesBooked = 0;
      const contactPhones = new Map<string, number>();
      const dayBookings: Record<string, number> = {
        'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
      };
      let lastBookedAt: Date | null = null;

      confirmedEvents.forEach((event) => {
        // Calculate duration in minutes
        const durationMs = event.endTime.getTime() - event.startTime.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        totalMinutesBooked += durationMinutes;

        // Track return visitors
        if (event.contactPhone) {
          contactPhones.set(event.contactPhone, (contactPhones.get(event.contactPhone) || 0) + 1);
        }

        // Track peak booking day
        const dayIndex = event.startTime.getDay();
        const dayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
        if (dayKey) dayBookings[dayKey]++;

        // Track last booked time
        if (!lastBookedAt || event.createdAt > lastBookedAt) {
          lastBookedAt = event.createdAt;
        }
      });

      // Find peak booking day
      let peakBookingDay: string | null = null;
      let maxBookings = 0;
      Object.entries(dayBookings).forEach(([day, count]) => {
        if (count > maxBookings) {
          maxBookings = count;
          peakBookingDay = day;
        }
      });

      // Use stored peak day if no recent confirmed events
      if (!peakBookingDay && linkStats[0].peakBookingDay) {
        peakBookingDay = linkStats[0].peakBookingDay;
      }

      // Count return visitors (those with more than 1 booking)
      const returnVisitorCount = Array.from(contactPhones.values()).filter(count => count > 1).length;

      // Calculate conversion rate using linkStats timesVisited (not events count)
      const bookingsCompleted = linkStats[0].bookingsCompleted || confirmedEvents.length;
      const timesVisited = linkStats[0].timesVisited || 0;
      const conversionRate = timesVisited > 0 ? Math.round((bookingsCompleted / timesVisited) * 100) : 0;

      // Average minutes per booking
      const averageMinutesPerBooking = bookingsCompleted > 0 ? Math.round(totalMinutesBooked / bookingsCompleted) : 0;

      res.json({
        timesShared: linkStats[0].timesShared || 0,
        timesVisited,
        bookingsCompleted,
        totalMinutesBooked,
        averageMinutesPerBooking,
        peakBookingDay: peakBookingDay || null,
        returnVisitorCount,
        conversionRate,
        lastSharedAt: linkStats[0].lastSharedAt || null,
        lastVisitedAt: lastBookedAt || linkStats[0].lastVisitedAt || null,
        lastBookedAt: lastBookedAt || linkStats[0].lastBookedAt || null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Calendar analytics - last 7 days data (uses historical snapshots)
  app.get("/api/calendar/analytics/:token/last-7-days", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      // Get link stats for totals
      const linkStats = await db.select().from(calendarLinkStats).where(eq(calendarLinkStats.publicShareToken, token)).limit(1);
      
      // Get calendar config by token to find userId
      const config = await db.select().from(calendarConfig).where(eq(calendarConfig.publicShareToken, token)).limit(1);
      if (!config.length) {
        return res.json([]);
      }

      const userId = config[0].userId;
      
      // Get last 7 days data from history table
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      
      const historyData = await db.select().from(calendarAnalyticsHistory).where(
        and(
          eq(calendarAnalyticsHistory.publicShareToken, token),
          gte(calendarAnalyticsHistory.date, sevenDaysAgoStr)
        )
      );

      // Group by day
      const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const data: Record<string, { name: string; visitas: number; reservas: number }> = {};
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayIndex = date.getDay();
        
        data[dateStr] = {
          name: dayNames[dayIndex],
          visitas: 0,
          reservas: 0
        };
      }

      // Fill data from history
      historyData.forEach((record) => {
        const dateStr = typeof record.date === 'string' ? record.date : record.date.toISOString().split('T')[0];
        if (data[dateStr]) {
          data[dateStr].visitas = record.visitas || 0;
          data[dateStr].reservas = record.reservas || 0;
        }
      });

      // If no historical data found in last 7 days, distribute totals evenly
      const dataArray = Object.values(data);
      if (dataArray.every(d => d.visitas === 0 && d.reservas === 0) && linkStats[0]) {
        const totalVisitas = linkStats[0].timesVisited || 0;
        const totalReservas = linkStats[0].bookingsCompleted || 0;
        
        if (totalVisitas > 0 || totalReservas > 0) {
          // Distribute totals evenly across 7 days
          const visitsPerDay = Math.floor(totalVisitas / 7);
          const visitsRemainder = totalVisitas % 7;
          const bookingsPerDay = Math.floor(totalReservas / 7);
          const bookingsRemainder = totalReservas % 7;
          
          dataArray.forEach((day, index) => {
            day.visitas = visitsPerDay + (index >= dataArray.length - visitsRemainder ? 1 : 0);
            day.reservas = bookingsPerDay + (index >= dataArray.length - bookingsRemainder ? 1 : 0);
          });
        }
      }

      res.json(dataArray);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CRM Clients endpoints
  app.get("/api/clients/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const clients = await storage.getClientsByUserId(userId);
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      const { userId, firstName, lastName, email, phone, company, address, city, postalCode, country, notes, status, currency } = insertClientSchema.parse(req.body);
      const client = await storage.createClient({
        userId,
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
        notes: notes || undefined,
        status: status || "active",
        currency: currency || "MXN",
      });
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, phone, company, address, city, postalCode, country, notes, status } = req.body;
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (company !== undefined) updateData.company = company;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (postalCode !== undefined) updateData.postalCode = postalCode;
      if (country !== undefined) updateData.country = country;
      if (notes !== undefined) updateData.notes = notes;
      if (status !== undefined) updateData.status = status;

      const client = await storage.updateClient(id, updateData);
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CRM Leads endpoints
  app.get("/api/leads/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const leads = await storage.getLeadsByUserId(userId);
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/leads", async (req: Request, res: Response) => {
    try {
      const { userId, firstName, lastName, email, phone, company, source, notes, status, value, currency } = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead({
        userId,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source: source || null,
        notes: notes || null,
        status: status || "new",
        value: value || null,
        currency: currency || "MXN",
      });
      res.json(lead);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/leads/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, phone, company, source, notes, status, value } = req.body;
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (company !== undefined) updateData.company = company;
      if (source !== undefined) updateData.source = source;
      if (notes !== undefined) updateData.notes = notes;
      if (status !== undefined) updateData.status = status;
      if (value !== undefined) updateData.value = value;

      const lead = await storage.updateLead(id, updateData);
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/leads/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteLead(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test WhatsApp endpoint (for debugging)
  app.post("/api/test-whatsapp", async (req: Request, res: Response) => {
    try {
      const { toNumber, message } = req.body;
      
      if (!toNumber || !message) {
        return res.status(400).json({ error: "toNumber and message are required" });
      }

      // Get all WhatsApp accounts and find the first connected one
      const allAccounts = await storage.getAllWhatsappAccounts?.() || [];
      const connectedAccount = allAccounts.find((acc: any) => acc.status === 'connected');

      if (!connectedAccount) {
        return res.status(400).json({ error: "No WhatsApp accounts connected" });
      }

      console.log(`[TEST] Sending WhatsApp test message to ${toNumber}`);
      console.log(`[TEST] Using account: ${connectedAccount.id} (${connectedAccount.phoneNumber})`);
      console.log(`[TEST] Message: ${message}`);

      // Send the message
      await sendWhatsAppMessage(connectedAccount.id, toNumber, message);

      res.json({ 
        success: true, 
        message: `Message sent to ${toNumber} from account ${connectedAccount.phoneNumber}`,
        accountId: connectedAccount.id,
        toNumber
      });
    } catch (error: any) {
      console.error('[TEST] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time messaging
  // Referencing javascript_websocket blueprint
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize broadcast system
  setWebSocketServer(wss);

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

  // Custom Domains endpoints
  app.get("/api/custom-domains/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const domains = await storage.getCustomDomainsByUserId(userId);
      res.json(domains);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/custom-domains", async (req: Request, res: Response) => {
    try {
      const { userId, domain, description } = insertCustomDomainSchema.parse(req.body);
      
      // Validate domain format
      const formatValidation = validateDomainFormat(domain);
      if (!formatValidation.valid) {
        return res.status(400).json({ error: formatValidation.error });
      }
      
      // Check if user already has a custom domain (max 1 per user)
      const userDomains = await storage.getCustomDomainsByUserId(userId);
      if (userDomains.length > 0) {
        return res.status(400).json({ 
          error: "Solo se permite un dominio personalizado por cuenta por razones de seguridad. Elimina el dominio actual para agregar uno nuevo." 
        });
      }
      
      // Check if domain already exists in our system
      const existingDomain = await storage.getCustomDomainByDomain(domain);
      if (existingDomain) {
        return res.status(400).json({ error: "Este dominio ya está registrado en nuestro sistema" });
      }

      // Check if domain is available
      const availability = await checkDomainAvailability(domain);
      if (!availability.available) {
        console.warn(`Domain might be in use: ${domain}`, availability.message);
      }

      const newDomain = await storage.createCustomDomain({
        userId,
        domain,
        status: "pending",
        isActive: true, // Auto-activate since it's the only one
        description: description || null,
      });

      // Start background verification (non-blocking)
      // If DNS verification succeeds, upgrade to "verified" status
      verifyDomainDNS(domain)
        .then(result => {
          if (result.verified) {
            storage.updateCustomDomain(newDomain.id, { 
              status: "verified", 
              lastVerifiedAt: new Date() 
            }).catch(err => console.error("Error updating domain status:", err));
          }
        })
        .catch(err => console.error("Error in background domain verification:", err));

      res.json(newDomain);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/custom-domains/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, isActive, description } = req.body;
      
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (description !== undefined) updateData.description = description;
      if (status === "verified") updateData.lastVerifiedAt = new Date();

      const domain = await storage.updateCustomDomain(id, updateData);
      res.json(domain);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/custom-domains/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteCustomDomain(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Products/Services endpoints

  // Check domain availability and format
  app.post("/api/custom-domains/check-availability", async (req: Request, res: Response) => {
    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain es requerido" });
      }

      // Validate format
      const formatValidation = validateDomainFormat(domain);
      if (!formatValidation.valid) {
        return res.json({
          valid: false,
          error: formatValidation.error,
        });
      }

      // Check if already exists in our system
      const existingDomain = await storage.getCustomDomainByDomain(domain);
      if (existingDomain) {
        return res.json({
          valid: false,
          error: "Este dominio ya está registrado en nuestro sistema",
          inUse: true,
        });
      }

      // Check global availability
      const availability = await checkDomainAvailability(domain);
      
      return res.json({
        valid: true,
        available: availability.available,
        message: availability.message || "Dominio disponible",
      });
    } catch (error: any) {
      res.status(500).json({ 
        valid: false,
        error: error.message || "Error verificando dominio" 
      });
    }
  });

  // Access survey by custom domain - for actual domain routing
  // This endpoint handles custom domain access: customdomain.com/survey/{surveyId}
  app.get("/api/custom-domain-survey/:domain/:surveyId", async (req: Request, res: Response) => {
    try {
      const { domain, surveyId } = req.params;
      
      // Get the custom domain
      const customDomain = await storage.getCustomDomainByDomain(domain);
      if (!customDomain) {
        return res.status(404).json({ error: "Dominio no encontrado" });
      }

      // Allow both verified and active (development) domains
      if (customDomain.status !== "verified" && customDomain.status !== "active") {
        return res.status(403).json({ error: "Dominio no está activo" });
      }

      // Get the survey
      const survey = await storage.getSurvey(surveyId);
      if (!survey) {
        return res.status(404).json({ error: "Encuesta no encontrada" });
      }

      // Verify the survey belongs to the domain owner
      if (survey.userId !== customDomain.userId) {
        return res.status(403).json({ error: "No tienes permiso para acceder a esta encuesta" });
      }

      // Return the survey data
      const questions = await storage.getSurveyQuestionsBySurveyId(surveyId);
      const responses = await storage.getSurveyResponsesBySurveyId(surveyId);

      res.json({
        survey,
        questions,
        responses: responses || [],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get survey access URL (with custom domain if available)
  app.get("/api/survey-access-url/:surveyId", async (req: Request, res: Response) => {
    try {
      const { surveyId } = req.params;
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({ error: "userId es requerido" });
      }

      const survey = await storage.getSurvey(surveyId);
      if (!survey || survey.userId !== userId) {
        return res.status(404).json({ error: "Encuesta no encontrada" });
      }

      // Default URL
      const defaultUrl = `${req.protocol}://${req.get("host")}/survey/${surveyId}`;

      // Check if survey has custom domain linked
      if (survey.customDomainId) {
        const customDomain = await storage.getCustomDomain(survey.customDomainId);
        if (customDomain && (customDomain.status === "verified" || customDomain.status === "active")) {
          const customUrl = `https://${customDomain.domain}/survey/${surveyId}`;
          return res.json({
            defaultUrl,
            customUrl,
            domain: customDomain.domain,
            verified: customDomain.status === "verified",
            isDevelopment: customDomain.status === "active",
          });
        }
      }

      res.json({
        defaultUrl,
        customUrl: null,
        domain: null,
        verified: false,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Link custom domain to survey
  app.patch("/api/surveys/:surveyId/domain/:domainId", async (req: Request, res: Response) => {
    try {
      const { surveyId, domainId } = req.params;
      const survey = await storage.updateSurvey(surveyId, { customDomainId: domainId });
      res.json(survey);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unlink custom domain from survey
  app.patch("/api/surveys/:surveyId/domain/remove", async (req: Request, res: Response) => {
    try {
      const { surveyId } = req.params;
      const survey = await storage.updateSurvey(surveyId, { customDomainId: null });
      res.json(survey);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get survey by custom domain - access surveys from custom domain
  app.get("/api/survey-by-domain/:domain/:surveyId", async (req: Request, res: Response) => {
    try {
      const { domain, surveyId } = req.params;
      
      // Get the custom domain
      const customDomain = await storage.getCustomDomainByDomain(domain);
      if (!customDomain) {
        return res.status(404).json({ error: "Dominio no encontrado" });
      }
      
      // Verify domain is verified
      if (customDomain.status !== "verified") {
        return res.status(403).json({ error: "Dominio no verificado" });
      }

      // Get survey
      const survey = await storage.getSurvey(surveyId);
      if (!survey) {
        return res.status(404).json({ error: "Encuesta no encontrada" });
      }

      // Verify survey belongs to domain owner
      if (survey.userId !== customDomain.userId) {
        return res.status(403).json({ error: "No autorizado" });
      }

      // Get questions and responses
      const questions = await storage.getSurveyQuestionsBySurveyId(surveyId);
      const responses = await storage.getSurveyResponsesBySurveyId(surveyId);

      res.json({
        survey,
        questions,
        responses: responses || [],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check domain ownership
  app.get("/api/survey-domain-check", async (req: Request, res: Response) => {
    try {
      const host = req.get("host") || "";
      
      // Check if this host is a custom domain
      const customDomain = await storage.getCustomDomainByDomain(host);
      if (customDomain && customDomain.status === "verified") {
        return res.json({
          isCustomDomain: true,
          userId: customDomain.userId,
          domain: customDomain.domain,
        });
      }

      res.json({
        isCustomDomain: false,
        userId: null,
        domain: null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Raffles endpoints
  app.get("/api/raffles", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const raffles = await storage.getRafflesByUserId(userId);
      res.json(raffles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/raffles/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const raffle = await storage.getRaffle(id);
      if (!raffle) {
        return res.status(404).json({ error: "Rifa no encontrada" });
      }
      res.json(raffle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/raffles", async (req: Request, res: Response) => {
    try {
      const data = insertRaffleSchema.parse(req.body);
      const raffle = await storage.createRaffle(data);
      res.json(raffle);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/raffles/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const raffle = await storage.updateRaffle(id, req.body);
      res.json(raffle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/raffles/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteRaffle(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Raffle Tickets endpoints
  app.get("/api/raffles/:raffleId/tickets", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const tickets = await storage.getRaffleTicketsByRaffleId(raffleId);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/raffles/:raffleId/tickets", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const data = insertRaffleTicketSchema.parse({
        ...req.body,
        raffleId,
      });
      const ticket = await storage.createRaffleTicket(data);
      res.json(ticket);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/raffles/:raffleId/tickets/:ticketId", async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const ticket = await storage.updateRaffleTicket(ticketId, req.body);
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/raffles/:raffleId/available-tickets", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const tickets = await storage.getRaffleTicketsByRaffleId(raffleId);
      const available = tickets.filter(t => t.status === "available");
      res.json({ total: tickets.length, available: available.length, tickets: available });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/raffles/:raffleId/verify-ticket", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const { ticketNumber } = req.body;
      const tickets = await storage.getRaffleTicketsByRaffleId(raffleId);
      const ticket = tickets.find(t => t.ticketNumber === ticketNumber);
      if (!ticket) {
        return res.status(404).json({ error: "Boleto no encontrado" });
      }
      res.json({ valid: true, ticket });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Raffle Purchases endpoints
  app.get("/api/raffles/:raffleId/purchases", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const purchases = await storage.getRafflePurchasesByRaffleId(raffleId);
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/raffles/:raffleId/purchases", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const data = insertRafflePurchaseSchema.parse({
        ...req.body,
        raffleId,
      });
      const purchase = await storage.createRafflePurchase(data);
      res.json(purchase);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Raffle Stories endpoints
  app.get("/api/raffles/:raffleId/stories", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const stories = await storage.getRaffleStoriesByRaffleId(raffleId);
      res.json(stories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/raffles/:raffleId/stories", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const data = insertRaffleStorySchema.parse({
        ...req.body,
        raffleId,
      });
      const story = await storage.createRaffleStory(data);
      res.json(story);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/raffles/:raffleId/stories/:storyId", async (req: Request, res: Response) => {
    try {
      const { storyId } = req.params;
      await storage.deleteRaffleStory(storyId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Raffle Bank Accounts endpoints
  app.get("/api/raffles/:raffleId/bank-accounts", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const accounts = await storage.getRaffleBankAccountsByRaffleId(raffleId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/raffles/:raffleId/bank-accounts", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const data = insertRaffleBankAccountSchema.parse({
        ...req.body,
        raffleId,
      });
      const account = await storage.createRaffleBankAccount(data);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/raffles/:raffleId/bank-accounts/:accountId", async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      await storage.deleteRaffleBankAccount(accountId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Raffle Customers endpoints
  app.post("/api/raffles/:raffleId/customers", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const { firstName, lastName, email, phone, whatsapp, ticketNumbers } = req.body;

      // Generate unique customer ID
      const customerId = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const data = insertRaffleCustomerSchema.parse({
        raffleId,
        customerId,
        firstName,
        lastName,
        email,
        phone,
        whatsapp,
        ticketNumbers: ticketNumbers || [],
      });

      const customer = await storage.createRaffleCustomer(data);
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Public Raffle endpoints (no auth required)
  app.get("/api/raffles/:id/public", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const raffle = await storage.getRaffle(id);
      if (!raffle || !raffle.isPublished) {
        return res.status(404).json({ error: "Rifa no encontrada o no publicada" });
      }
      res.json(raffle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/raffles/:raffleId/stories/public", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const raffle = await storage.getRaffle(raffleId);
      if (!raffle || !raffle.isPublished) {
        return res.status(404).json({ error: "Rifa no encontrada o no publicada" });
      }
      const stories = await storage.getRaffleStoriesByRaffleId(raffleId);
      res.json(stories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/raffles/:raffleId/purchases/public", async (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const raffle = await storage.getRaffle(raffleId);
      if (!raffle || !raffle.isPublished) {
        return res.status(404).json({ error: "Rifa no encontrada o no publicada" });
      }
      const purchases = await storage.getRafflePurchasesByRaffleId(raffleId);
      // Only return non-sensitive data for public view
      const publicPurchases = purchases.map(p => ({
        id: p.id,
        quantity: p.quantity,
        paymentStatus: p.paymentStatus,
        createdAt: p.createdAt,
      }));
      res.json(publicPurchases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat Classification / Sales Funnel
  app.get("/api/conversations/funnel", async (req: Request, res: Response) => {
    try {
      const { accountId } = req.query;
      if (!accountId) {
        const allConversations = await db.select().from(conversations);
        return res.json(allConversations);
      }
      const convs = await storage.getConversationsByAccountId(accountId as string);
      res.json(convs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Team Members Endpoints - Get members of current user's team
  app.get("/api/team-members", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "userId required" });
      
      // Get the user's team record (or create if doesn't exist)
      let userTeam = await storage.getTeamsCreatedByUser(userId as string).then(teams => teams[0]);
      
      if (!userTeam) {
        // Create a team record for this user
        userTeam = await storage.createTeam({ userId: userId as string });
      }
      
      // Get the owner user
      const ownerUser = await storage.getUser(userId as string);
      
      // Get all members of this team
      const members = await storage.getTeamMembersByTeamId(userTeam.id);
      
      // Enhance members with user details
      const membersWithDetails = await Promise.all(members.map(async (member) => {
        const user = await storage.getUser(member.userId);
        return { 
          ...user, 
          teamMemberId: member.id,  // Add team member ID for API operations
          role: member.role, 
          isActive: member.isActive, 
          isMember: true 
        };
      }));
      
      // Add owner as first item (marked as not a member to disable actions)
      const result = [
        { ...ownerUser, role: "admin", isActive: true, isMember: false, isOwner: true },
        ...membersWithDetails
      ];
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new member directly (no email invite)
  app.post("/api/team-members/create", async (req: Request, res: Response) => {
    try {
      const { name, email, password, confirmPassword, role = "member" } = req.body;
      const userId = req.query.userId || (req.session as any)?.user?.id;
      
      if (!name) return res.status(400).json({ error: "name required" });
      if (!email) return res.status(400).json({ error: "email required" });
      if (!password) return res.status(400).json({ error: "password required" });
      if (password !== confirmPassword) return res.status(400).json({ error: "Las contraseñas no coinciden" });
      if (password.length < 6) return res.status(400).json({ error: "La contraseña debe tener mínimo 6 caracteres" });
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Este correo ya está registrado" });
      }
      
      // Get the owner's team record
      let userTeam = await storage.getTeamsCreatedByUser(userId as string).then(teams => teams[0]);
      if (!userTeam) {
        userTeam = await storage.createTeam({ userId: userId as string });
      }
      
      // Create new user
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({
        name,
        email,
        password: hashedPassword,
      });
      
      // Add user as team member
      const member = await storage.createTeamMember({
        teamId: userTeam.id,
        userId: newUser.id,
        role,
      });
      
      res.json({ success: true, memberId: member.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update member role or isActive
  app.patch("/api/team-members/:memberId", async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const { role, isActive } = req.body;
      
      const member = await storage.getTeamMember(memberId);
      if (!member) return res.status(404).json({ error: "Member not found" });
      
      const updateData: any = {};
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const updated = await storage.updateTeamMember(memberId, updateData);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reset member password
  app.patch("/api/team-members/:memberId/reset-password", async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const { newPassword, confirmPassword } = req.body;
      
      if (!newPassword) return res.status(400).json({ error: "newPassword required" });
      if (newPassword !== confirmPassword) return res.status(400).json({ error: "Las contraseñas no coinciden" });
      if (newPassword.length < 6) return res.status(400).json({ error: "La contraseña debe tener mínimo 6 caracteres" });
      
      const member = await storage.getTeamMember(memberId);
      if (!member) return res.status(404).json({ error: "Member not found" });
      
      // Hash and update password
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(member.userId, { password: hashedPassword });
      
      res.json({ success: true, message: "Contraseña restablecida exitosamente" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove a member from the team
  app.delete("/api/team-members/:memberId", async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      
      const member = await storage.getTeamMember(memberId);
      if (!member) return res.status(404).json({ error: "Member not found" });
      
      await storage.deleteTeamMember(memberId);
      // Optionally delete the user account too, depending on requirements
      // For now, just remove from team
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify email endpoint (used for checking if user exists)
  app.get("/api/verify-email/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      if (!email) return res.status(400).json({ error: "email required" });
      
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ exists: false });
      
      res.json({ exists: true, userId: user.id, name: user.name });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get member permissions
  app.get("/api/team-members/:memberId/permissions", async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      if (!memberId) return res.status(400).json({ error: "memberId required" });
      
      const member = await storage.getTeamMember(memberId);
      if (!member) return res.status(404).json({ error: "Member not found" });
      
      const permissions = await storage.getTeamModuleAccess(member.teamId).then(accesses =>
        accesses.filter(a => !a.memberId || a.memberId === memberId)
      );
      
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update member permissions
  app.patch("/api/team-members/:memberId/permissions", async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const { module, canRead, canCreate, canEdit, canDelete, assignedResourceIds } = req.body;
      
      if (!memberId || !module) return res.status(400).json({ error: "memberId and module required" });
      
      const member = await storage.getTeamMember(memberId);
      if (!member) return res.status(404).json({ error: "Member not found" });
      
      // Find or create module access for this member
      const existing = await storage.getTeamModuleAccess(member.teamId).then(accesses =>
        accesses.find(a => a.module === module && a.memberId === memberId)
      );
      
      if (existing) {
        const updated = await storage.updateTeamModuleAccess(existing.id, {
          canRead: canRead !== undefined ? canRead : existing.canRead,
          canCreate: canCreate !== undefined ? canCreate : existing.canCreate,
          canEdit: canEdit !== undefined ? canEdit : existing.canEdit,
          canDelete: canDelete !== undefined ? canDelete : existing.canDelete,
          assignedResourceIds: assignedResourceIds || existing.assignedResourceIds,
        });
        res.json(updated);
      } else {
        const newAccess = await storage.createTeamModuleAccess({
          teamId: member.teamId,
          memberId,
          module,
          canRead: canRead !== undefined ? canRead : true,
          canCreate: canCreate !== undefined ? canCreate : false,
          canEdit: canEdit !== undefined ? canEdit : false,
          canDelete: canDelete !== undefined ? canDelete : false,
          assignedResourceIds: assignedResourceIds || [],
        });
        res.json(newAccess);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Team Activity Logs
  app.get("/api/teams/:teamId/activity", async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const logs = await storage.getActivityLogsByTeamId(teamId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/teams/:teamId/activity", async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const { userId, action, details } = req.body;
      const log = await storage.createActivityLog({
        teamId,
        userId,
        action,
        details,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hrs
      });
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Team Module Access
  app.get("/api/teams/:teamId/modules", async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const modules = await storage.getTeamModuleAccess(teamId);
      res.json(modules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/teams/:teamId/modules", async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const { module, canView, canCreate, canEdit, canDelete, assignedResourceIds } = req.body;
      if (!module) return res.status(400).json({ error: "module required" });
      
      const access = await storage.createTeamModuleAccess({
        teamId,
        module,
        canView: canView ?? true,
        canCreate: canCreate ?? false,
        canEdit: canEdit ?? false,
        canDelete: canDelete ?? false,
        assignedResourceIds: assignedResourceIds ?? [],
      });
      res.json(access);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/teams/:teamId/modules/:module", async (req: Request, res: Response) => {
    try {
      const { teamId, module } = req.params;
      const { canView, canCreate, canEdit, canDelete, assignedResourceIds } = req.body;
      
      const existing = await storage.getTeamModuleAccessByModule(teamId, module);
      if (!existing) {
        return await storage.createTeamModuleAccess({
          teamId,
          module,
          canView: canView ?? true,
          canCreate: canCreate ?? false,
          canEdit: canEdit ?? false,
          canDelete: canDelete ?? false,
          assignedResourceIds: assignedResourceIds ?? [],
        });
      }
      
      const updated = await storage.updateTeamModuleAccess(existing.id, {
        canView,
        canCreate,
        canEdit,
        canDelete,
        assignedResourceIds,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // E-Commerce Store Routes
  app.get("/api/stores", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId required" });
      const stores = await storage.getStoresByUserId(userId);
      res.json(stores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stores/:id", async (req: Request, res: Response) => {
    try {
      const store = await storage.getStore(req.params.id);
      if (!store) return res.status(404).json({ error: "Store not found" });
      const products = await storage.getStoreProductsByStoreId(req.params.id);
      res.json({ ...store, products });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stores/url/:customUrl", async (req: Request, res: Response) => {
    try {
      const store = await storage.getStoreByCustomUrl(req.params.customUrl);
      if (!store) return res.status(404).json({ error: "Store not found" });
      const products = await storage.getStoreProductsByStoreId(store.id);
      res.json({ ...store, products });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stores", async (req: Request, res: Response) => {
    try {
      const { userId, name, description, customUrl } = req.body;
      if (!userId || !name) return res.status(400).json({ error: "userId and name required" });
      const store = await storage.createStore({ userId, name, description, customUrl, currency: "MXN" });
      res.json(store);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/stores/:id", async (req: Request, res: Response) => {
    try {
      const store = await storage.updateStore(req.params.id, req.body);
      res.json(store);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/stores/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteStore(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check store custom URL availability
  app.get("/api/stores/check-slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const existingStore = await db.select().from(stores).where(eq(stores.customUrl, slug)).limit(1);
      res.json({ available: existingStore.length === 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // E-Commerce Categories
  app.get("/api/store-product-categories", async (req: Request, res: Response) => {
    try {
      const storeId = req.query.storeId as string;
      if (!storeId) return res.status(400).json({ error: "storeId required" });
      const categories = await storage.getStoreProductCategoriesByStoreId(storeId);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/store-product-categories", async (req: Request, res: Response) => {
    try {
      const data = insertStoreProductCategorySchema.parse(req.body);
      const category = await storage.createStoreProductCategory(data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/store-product-categories/:id", async (req: Request, res: Response) => {
    try {
      const category = await storage.updateStoreProductCategory(req.params.id, req.body);
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/store-product-categories/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteStoreProductCategory(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // E-Commerce Subcategories
  app.get("/api/store-product-subcategories", async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId as string;
      if (!categoryId) return res.status(400).json({ error: "categoryId required" });
      const subcategories = await storage.getStoreProductSubcategoriesByCategoryId(categoryId);
      res.json(subcategories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/store-product-subcategories", async (req: Request, res: Response) => {
    try {
      const data = insertStoreProductSubcategorySchema.parse(req.body);
      const subcategory = await storage.createStoreProductSubcategory(data);
      res.json(subcategory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/store-product-subcategories/:id", async (req: Request, res: Response) => {
    try {
      const subcategory = await storage.updateStoreProductSubcategory(req.params.id, req.body);
      res.json(subcategory);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/store-product-subcategories/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteStoreProductSubcategory(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // E-Commerce Products
  app.get("/api/store-products", async (req: Request, res: Response) => {
    try {
      const storeId = req.query.storeId as string;
      if (!storeId) return res.status(400).json({ error: "storeId required" });
      const products = await storage.getStoreProductsByStoreId(storeId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/store-products", async (req: Request, res: Response) => {
    try {
      const product = await storage.createStoreProduct(req.body);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/store-products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.updateStoreProduct(req.params.id, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/store-products/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteStoreProduct(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // E-Commerce Coupons
  app.get("/api/store-coupons", async (req: Request, res: Response) => {
    try {
      const storeId = req.query.storeId as string;
      if (!storeId) return res.status(400).json({ error: "storeId required" });
      const coupons = await storage.getStoreCouponsByStoreId(storeId);
      res.json(coupons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/store-coupons/code/:code", async (req: Request, res: Response) => {
    try {
      const { storeId } = req.query;
      if (!storeId) return res.status(400).json({ error: "storeId required" });
      const coupon = await storage.getStoreCouponByCode(storeId as string, req.params.code);
      if (!coupon) return res.status(404).json({ error: "Coupon not found" });
      res.json(coupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/store-coupons", async (req: Request, res: Response) => {
    try {
      const coupon = await storage.createStoreCoupon(req.body);
      res.json(coupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/store-coupons/:id", async (req: Request, res: Response) => {
    try {
      const coupon = await storage.updateStoreCoupon(req.params.id, req.body);
      res.json(coupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/store-coupons/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteStoreCoupon(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // E-Commerce Orders
  app.get("/api/store-orders", async (req: Request, res: Response) => {
    try {
      const { storeId, clientId, userId } = req.query;
      let orders = [];
      if (storeId) {
        orders = await storage.getStoreOrdersByStoreId(storeId as string);
      } else if (clientId) {
        orders = await storage.getStoreOrdersByClientId(clientId as string);
      } else if (userId) {
        // Get all stores for this user, then get all orders
        const stores = await storage.getStoresByUserId(userId as string);
        for (const store of stores) {
          const storeOrders = await storage.getStoreOrdersByStoreId(store.id);
          orders.push(...storeOrders);
        }
      } else {
        return res.status(400).json({ error: "storeId, clientId, or userId required" });
      }
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/store-orders/:id", async (req: Request, res: Response) => {
    try {
      const order = await storage.getStoreOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      const items = await storage.getStoreOrderItemsByOrderId(req.params.id);
      res.json({ ...order, items });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/store-orders", async (req: Request, res: Response) => {
    try {
      const orderData = req.body;
      const order = await storage.createStoreOrder(orderData);
      
      // Create order items
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          await storage.createStoreOrderItem({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          });
        }
      }

      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/store-orders/:id", async (req: Request, res: Response) => {
    try {
      const order = await storage.updateStoreOrder(req.params.id, req.body);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      const { userId, status } = req.query;
      if (!userId) return res.status(400).json({ error: "userId required" });
      let tasks = [];
      if (status) {
        tasks = await storage.getTasksByStatus(userId as string, status as string);
      } else {
        tasks = await storage.getTasksByUserId(userId as string);
      }
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const validated = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validated);
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "userId required" });
      const notifications = await storage.getNotificationsByUserId(userId as string);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/notifications/unviewed/:userId", async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUnviewedNotificationsByUserId(req.params.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications", async (req: Request, res: Response) => {
    try {
      const notification = await storage.createNotification(req.body);
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/notifications/:id/view", async (req: Request, res: Response) => {
    try {
      const notification = await storage.markNotificationAsViewed(req.params.id);
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/notifications/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
