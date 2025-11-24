import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertWhatsappAccountSchema, insertChatbotSchema, insertChatbotRuleSchema, insertKnowledgeBaseCategorySchema, insertKnowledgeBaseSubcategorySchema, insertKnowledgeBaseItemSchema, insertSurveySchema, insertSurveyQuestionSchema, insertSurveyResponseSchema, insertBankAccountSchema, insertBankTransactionSchema, insertFacebookAccountSchema, insertClientSchema, insertCalendarEventSchema, insertLeadSchema, insertCustomDomainSchema, insertRaffleSchema, insertRaffleTicketSchema, insertRafflePurchaseSchema, insertRaffleStorySchema, insertRaffleBankAccountSchema, insertRaffleCustomerSchema, insertAIProviderSchema, insertTaskSchema, insertStoreProductCategorySchema, insertStoreProductSubcategorySchema } from "@shared/schema";
import { conversations, aiProviders, chatbotAIProviders } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createWhatsAppConnection, disconnectWhatsApp, sendWhatsAppMessage, reconnectAllAccounts } from "./whatsapp";
import { addRandomDelay, calculateTypingTime, dailyMessageTracker } from "./anti-detection";
import { verifyDomainDNS, validateDomainFormat, checkDomainAvailability } from "./domain-verification";
import { setWebSocketServer } from "./websocket-broadcast";

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
      const { name, description, type, whatsappAccountId, isActive, useAIResponses, minResponseDelay, maxResponseDelay, dailyMessageLimit, respectUserTypingTime, linkedStoreIds } = req.body;
      
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
        linkedStoreIds,
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

  // Get linked store products for chatbot
  app.get("/api/chatbots/:id/linked-products", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const chatbot = await storage.getChatbot(id);
      if (!chatbot) return res.status(404).json({ error: "Chatbot not found" });

      const products = [];
      if (chatbot.linkedStoreIds && chatbot.linkedStoreIds.length > 0) {
        for (const storeId of chatbot.linkedStoreIds) {
          const storeProducts = await storage.getStoreProductsByStoreId(storeId);
          products.push(...storeProducts);
        }
      }
      res.json(products);
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
      const events = await storage.getCalendarEventsByUserId(userId);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/calendar", async (req: Request, res: Response) => {
    try {
      const { userId, title, description, startTime, endTime, contactName, contactPhone, isActive } = req.body;
      if (!userId || !title || !startTime || !endTime) {
        return res.status(400).json({ error: "userId, title, startTime, and endTime are required" });
      }
      const event = await storage.createCalendarEvent({
        userId,
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
      // Return the status confirmation
      res.json({ userId, isActive });
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

  // Teams Endpoints - Team is an independent user
  app.get("/api/teams", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "userId required" });
      
      // Get teams created by this user (user is creator/owner)
      const teamsCreated = await storage.getTeamsCreatedByUser(userId as string);
      
      // Enhance with members and module access
      const teamsWithDetails = await Promise.all(teamsCreated.map(async (team) => {
        const members = await storage.getTeamMembersByTeamId(team.id);
        const moduleAccess = await storage.getTeamModuleAccess(team.id);
        const teamUser = await storage.getUser(team.userId);
        return { ...team, members, moduleAccess, teamUser };
      }));
      res.json(teamsWithDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/teams", async (req: Request, res: Response) => {
    try {
      const { teamName, email, password } = req.body;
      if (!teamName || !email || !password) {
        return res.status(400).json({ error: "teamName, email, and password required" });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Este correo ya está registrado" });
      }
      
      // Create team user
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      const teamUser = await storage.createUser({
        email,
        password: hashedPassword,
        name: teamName,
      });
      
      // Create team record linked to user
      const team = await storage.createTeam({ userId: teamUser.id });
      res.json({ team, teamUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/teams/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      const team = await storage.updateTeam(id, { name, description, isActive });
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/teams/:id/password", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      if (!password) return res.status(400).json({ error: "password required" });
      
      const team = await storage.getTeam(id);
      if (!team) return res.status(404).json({ error: "Team not found" });
      
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(team.userId, { password: hashedPassword });
      res.json({ success: true, message: "Contraseña actualizada" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/teams/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteTeam(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Team Members Endpoints
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

  app.post("/api/teams/:teamId/members", async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const { memberEmail, role = "member" } = req.body;
      if (!memberEmail) return res.status(400).json({ error: "memberEmail required" });
      
      const user = await storage.getUserByEmail(memberEmail);
      if (!user) return res.status(404).json({ error: "Usuario no encontrado con ese correo" });
      
      const member = await storage.createTeamMember({ 
        teamId, 
        userId: user.id,
        role 
      });
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/team-members/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteTeamMember(id);
      res.json({ success: true });
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
