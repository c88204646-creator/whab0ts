import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertWhatsappAccountSchema, insertChatbotSchema, insertChatbotRuleSchema, insertKnowledgeBaseCategorySchema, insertKnowledgeBaseSubcategorySchema, insertKnowledgeBaseItemSchema, insertSurveySchema, insertSurveyQuestionSchema, insertSurveyResponseSchema, insertBankAccountSchema, insertBankTransactionSchema, insertFacebookAccountSchema, insertClientSchema, insertCalendarEventSchema, insertLeadSchema } from "@shared/schema";
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
      const { name, description, type, whatsappAccountId, isActive, useAIResponses } = req.body;
      
      const chatbot = await storage.updateChatbot(id, {
        name,
        description,
        type,
        whatsappAccountId,
        isActive,
        useAIResponses
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
      const survey = await storage.createSurvey(data);
      res.json(survey);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/surveys/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, isActive, whatsappConfig } = req.body;
      const updateData: any = { title, description, isActive };
      if (whatsappConfig !== undefined) updateData.whatsappConfig = whatsappConfig;
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

  // AI Providers endpoints
  app.get("/api/chatbots/:chatbotId/ai-providers", async (req: Request, res: Response) => {
    try {
      const { chatbotId } = req.params;
      const providers = await storage.getChatbotAIProviders(chatbotId);
      // Return providers without API keys for security
      const safe = providers.map(p => ({ ...p, apiKey: '***' }));
      res.json(safe);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chatbots/:chatbotId/ai-providers", async (req: Request, res: Response) => {
    try {
      const { chatbotId } = req.params;
      const { provider, apiKey } = req.body;
      if (!provider || !apiKey) {
        return res.status(400).json({ error: "Provider y API Key son requeridos" });
      }
      const aiProvider = await storage.createChatbotAIProvider({
        chatbotId,
        provider,
        apiKey,
        isActive: true,
      });
      const { apiKey: _, ...safe } = aiProvider;
      res.json(safe);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/ai-providers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteChatbotAIProvider(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/ai-providers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updated = await storage.updateChatbotAIProvider(id, { isActive });
      const { apiKey: _, ...safe } = updated;
      res.json(safe);
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
      
      // Send auto-reply after 5 seconds if WhatsApp addon is enabled (based on ORIGINAL hasWhatsapp check)
      setTimeout(async () => {
        try {
          if (hasWhatsapp) {
            const survey = await storage.getSurvey(surveyId);
            const config = survey?.whatsappConfig as any;
            if (survey && config?.enabled && config?.senderId && data.respondentWhatsapp) {
              const message = config?.message || `¡Gracias por responder nuestra encuesta: ${survey.title}!`;
              console.log(`Sending WhatsApp to ${data.respondentWhatsapp} from sender ${config.senderId}`);
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
      const { userId, firstName, lastName, email, phone, company, address, city, postalCode, country, notes, status } = insertClientSchema.parse(req.body);
      const client = await storage.createClient({
        userId,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        company: company || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null,
        notes: notes || null,
        status: status || "active",
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
      const { userId, firstName, lastName, email, phone, company, source, notes, status, value } = insertLeadSchema.parse(req.body);
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
