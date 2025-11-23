// Referencing javascript_database blueprint
import { 
  users, whatsappAccounts, conversations, messages, chatbots, chatbotRules, knowledgeBaseCategories, knowledgeBaseSubcategories, knowledgeBaseItems, surveys, surveyQuestions, surveyResponses, chatbotActivities, chatbotStats, chatbotAIProviders, bankAccounts, bankTransactions, facebookAccounts, calendarEvents, clients, leads, customDomains, products, raffles, raffleTickets, rafflePurchases, raffleStories, raffleBankAccounts,
  type User, type InsertUser,
  type WhatsappAccount, type InsertWhatsappAccount,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Chatbot, type InsertChatbot,
  type ChatbotRule, type InsertChatbotRule,
  type KnowledgeBaseCategory, type InsertKnowledgeBaseCategory,
  type KnowledgeBaseSubcategory, type InsertKnowledgeBaseSubcategory,
  type KnowledgeBaseItem, type InsertKnowledgeBaseItem,
  type Survey, type InsertSurvey,
  type SurveyQuestion, type InsertSurveyQuestion,
  type SurveyResponse, type InsertSurveyResponse,
  type ChatbotActivity, type InsertChatbotActivity,
  type ChatbotAIProvider, type InsertChatbotAIProvider,
  type BankAccount, type InsertBankAccount,
  type BankTransaction, type InsertBankTransaction,
  type FacebookAccount, type InsertFacebookAccount,
  type CalendarEvent, type InsertCalendarEvent,
  type Client, type InsertClient,
  type Lead, type InsertLead,
  type CustomDomain, type InsertCustomDomain,
  type Product, type InsertProduct,
  type Raffle, type InsertRaffle,
  type RaffleTicket, type InsertRaffleTicket,
  type RafflePurchase, type InsertRafflePurchase,
  type RaffleStory, type InsertRaffleStory,
  type RaffleBankAccount, type InsertRaffleBankAccount,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // WhatsApp Accounts
  getWhatsappAccount(id: string): Promise<WhatsappAccount | undefined>;
  getWhatsappAccountsByUserId(userId: string): Promise<WhatsappAccount[]>;
  getAllWhatsappAccounts(): Promise<WhatsappAccount[]>;
  createWhatsappAccount(account: InsertWhatsappAccount): Promise<WhatsappAccount>;
  updateWhatsappAccount(id: string, data: Partial<WhatsappAccount>): Promise<WhatsappAccount>;
  deleteWhatsappAccount(id: string): Promise<void>;
  
  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByAccountId(accountId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation>;
  
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Chatbots
  getChatbot(id: string): Promise<Chatbot | undefined>;
  getChatbotsByUserId(userId: string): Promise<Chatbot[]>;
  getChatbotsByAccountId(accountId: string): Promise<Chatbot[]>;
  createChatbot(chatbot: InsertChatbot): Promise<Chatbot>;
  updateChatbot(id: string, data: Partial<Chatbot>): Promise<Chatbot>;
  deleteChatbot(id: string): Promise<void>;
  
  // Chatbot Rules
  getChatbotRule(id: string): Promise<ChatbotRule | undefined>;
  getChatbotRulesByChatbotId(chatbotId: string): Promise<ChatbotRule[]>;
  createChatbotRule(rule: InsertChatbotRule): Promise<ChatbotRule>;
  updateChatbotRule(id: string, data: Partial<ChatbotRule>): Promise<ChatbotRule>;
  deleteChatbotRule(id: string): Promise<void>;

  // Knowledge Base Categories
  getKnowledgeBaseCategory(id: string): Promise<KnowledgeBaseCategory | undefined>;
  getKnowledgeBaseCategoriesByChatbotId(chatbotId: string): Promise<KnowledgeBaseCategory[]>;
  createKnowledgeBaseCategory(category: InsertKnowledgeBaseCategory): Promise<KnowledgeBaseCategory>;
  updateKnowledgeBaseCategory(id: string, data: Partial<KnowledgeBaseCategory>): Promise<KnowledgeBaseCategory>;
  deleteKnowledgeBaseCategory(id: string): Promise<void>;

  // Knowledge Base Subcategories
  getKnowledgeBaseSubcategory(id: string): Promise<KnowledgeBaseSubcategory | undefined>;
  getKnowledgeBaseSubcategoriesByCategoryId(categoryId: string): Promise<KnowledgeBaseSubcategory[]>;
  createKnowledgeBaseSubcategory(subcategory: InsertKnowledgeBaseSubcategory): Promise<KnowledgeBaseSubcategory>;
  updateKnowledgeBaseSubcategory(id: string, data: Partial<KnowledgeBaseSubcategory>): Promise<KnowledgeBaseSubcategory>;
  deleteKnowledgeBaseSubcategory(id: string): Promise<void>;

  // Knowledge Base Items
  getKnowledgeBaseItem(id: string): Promise<KnowledgeBaseItem | undefined>;
  getKnowledgeBaseItemsByChatbotId(chatbotId: string): Promise<KnowledgeBaseItem[]>;
  getKnowledgeBaseItemsByCategoryId(categoryId: string): Promise<KnowledgeBaseItem[]>;
  createKnowledgeBaseItem(item: InsertKnowledgeBaseItem): Promise<KnowledgeBaseItem>;
  updateKnowledgeBaseItem(id: string, data: Partial<KnowledgeBaseItem>): Promise<KnowledgeBaseItem>;
  deleteKnowledgeBaseItem(id: string): Promise<void>;

  // Surveys
  getSurvey(id: string): Promise<Survey | undefined>;
  getSurveysByUserId(userId: string): Promise<Survey[]>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: string, data: Partial<Survey>): Promise<Survey>;
  deleteSurvey(id: string): Promise<void>;

  // Survey Questions
  getSurveyQuestion(id: string): Promise<SurveyQuestion | undefined>;
  getSurveyQuestionsBySurveyId(surveyId: string): Promise<SurveyQuestion[]>;
  createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion>;
  updateSurveyQuestion(id: string, data: Partial<SurveyQuestion>): Promise<SurveyQuestion>;
  deleteSurveyQuestion(id: string): Promise<void>;

  // Survey Responses
  getSurveyResponse(id: string): Promise<SurveyResponse | undefined>;
  getSurveyResponsesBySurveyId(surveyId: string): Promise<SurveyResponse[]>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  updateSurveyResponse(id: string, data: Partial<SurveyResponse>): Promise<SurveyResponse>;
  deleteSurveyResponse(id: string): Promise<void>;

  // Chatbot Activities
  getChatbotActivities(chatbotId: string, limit?: number): Promise<ChatbotActivity[]>;
  createChatbotActivity(activity: InsertChatbotActivity): Promise<ChatbotActivity>;

  // AI Providers
  getChatbotAIProviders(chatbotId: string): Promise<ChatbotAIProvider[]>;
  createChatbotAIProvider(provider: InsertChatbotAIProvider): Promise<ChatbotAIProvider>;
  deleteChatbotAIProvider(id: string): Promise<void>;
  updateChatbotAIProvider(id: string, data: Partial<ChatbotAIProvider>): Promise<ChatbotAIProvider>;

  // Chatbot Stats
  getChatbotStats(chatbotId: string): Promise<any | undefined>;
  createChatbotStats(chatbotId: string): Promise<any>;
  updateChatbotStats(chatbotId: string, data: Partial<any>): Promise<any>;
  incrementChatbotStats(chatbotId: string, field: 'totalMessages' | 'automatedResponses'): Promise<any>;

  // Bank Accounts
  getBankAccount(id: string): Promise<BankAccount | undefined>;
  getBankAccountsByUserId(userId: string): Promise<BankAccount[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: string, data: Partial<BankAccount>): Promise<BankAccount>;
  deleteBankAccount(id: string): Promise<void>;

  // Bank Transactions
  getBankTransaction(id: string): Promise<BankTransaction | undefined>;
  getBankTransactionsByAccountId(accountId: string): Promise<BankTransaction[]>;
  createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction>;
  updateBankTransaction(id: string, data: Partial<BankTransaction>): Promise<BankTransaction>;
  deleteBankTransaction(id: string): Promise<void>;

  // Facebook Accounts
  getFacebookAccount(id: string): Promise<FacebookAccount | undefined>;
  getFacebookAccountsByUserId(userId: string): Promise<FacebookAccount[]>;
  createFacebookAccount(account: InsertFacebookAccount): Promise<FacebookAccount>;
  updateFacebookAccount(id: string, data: Partial<FacebookAccount>): Promise<FacebookAccount>;
  deleteFacebookAccount(id: string): Promise<void>;

  // Calendar Events
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  getCalendarEventsByUserId(userId: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;

  // Clients (CRM)
  getClient(id: string): Promise<Client | undefined>;
  getClientsByUserId(userId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, data: Partial<Client>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Leads (CRM)
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByUserId(userId: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, data: Partial<Lead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  // Custom Domains
  getCustomDomain(id: string): Promise<CustomDomain | undefined>;
  getCustomDomainsByUserId(userId: string): Promise<CustomDomain[]>;
  getCustomDomainByDomain(domain: string): Promise<CustomDomain | undefined>;
  createCustomDomain(domain: InsertCustomDomain): Promise<CustomDomain>;
  updateCustomDomain(id: string, data: Partial<CustomDomain>): Promise<CustomDomain>;
  deleteCustomDomain(id: string): Promise<void>;

  // Products/Services
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByUserId(userId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Raffles
  getRaffle(id: string): Promise<Raffle | undefined>;
  getRafflesByUserId(userId: string): Promise<Raffle[]>;
  createRaffle(raffle: InsertRaffle): Promise<Raffle>;
  updateRaffle(id: string, data: Partial<Raffle>): Promise<Raffle>;
  deleteRaffle(id: string): Promise<void>;

  // Raffle Tickets
  getRaffleTicket(id: string): Promise<RaffleTicket | undefined>;
  getRaffleTicketsByRaffleId(raffleId: string): Promise<RaffleTicket[]>;
  createRaffleTicket(ticket: InsertRaffleTicket): Promise<RaffleTicket>;
  updateRaffleTicket(id: string, data: Partial<RaffleTicket>): Promise<RaffleTicket>;
  deleteRaffleTicket(id: string): Promise<void>;

  // Raffle Purchases
  getRafflePurchase(id: string): Promise<RafflePurchase | undefined>;
  getRafflePurchasesByRaffleId(raffleId: string): Promise<RafflePurchase[]>;
  createRafflePurchase(purchase: InsertRafflePurchase): Promise<RafflePurchase>;
  updateRafflePurchase(id: string, data: Partial<RafflePurchase>): Promise<RafflePurchase>;
  deleteRafflePurchase(id: string): Promise<void>;

  // Raffle Stories
  getRaffleStory(id: string): Promise<RaffleStory | undefined>;
  getRaffleStoriesByRaffleId(raffleId: string): Promise<RaffleStory[]>;
  createRaffleStory(story: InsertRaffleStory): Promise<RaffleStory>;
  updateRaffleStory(id: string, data: Partial<RaffleStory>): Promise<RaffleStory>;
  deleteRaffleStory(id: string): Promise<void>;

  // Raffle Bank Accounts
  getRaffleBankAccount(id: string): Promise<RaffleBankAccount | undefined>;
  getRaffleBankAccountsByRaffleId(raffleId: string): Promise<RaffleBankAccount[]>;
  createRaffleBankAccount(account: InsertRaffleBankAccount): Promise<RaffleBankAccount>;
  updateRaffleBankAccount(id: string, data: Partial<RaffleBankAccount>): Promise<RaffleBankAccount>;
  deleteRaffleBankAccount(id: string): Promise<void>;

}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getWhatsappAccount(id: string): Promise<WhatsappAccount | undefined> {
    const [account] = await db.select().from(whatsappAccounts).where(eq(whatsappAccounts.id, id));
    return account || undefined;
  }

  async getWhatsappAccountsByUserId(userId: string): Promise<WhatsappAccount[]> {
    return db.select().from(whatsappAccounts).where(eq(whatsappAccounts.userId, userId));
  }

  async getAllWhatsappAccounts(): Promise<WhatsappAccount[]> {
    return db.select().from(whatsappAccounts);
  }

  async createWhatsappAccount(account: InsertWhatsappAccount): Promise<WhatsappAccount> {
    const [newAccount] = await db.insert(whatsappAccounts).values(account).returning();
    return newAccount;
  }

  async updateWhatsappAccount(id: string, data: Partial<WhatsappAccount>): Promise<WhatsappAccount> {
    const [updated] = await db.update(whatsappAccounts).set(data).where(eq(whatsappAccounts.id, id)).returning();
    return updated;
  }

  async deleteWhatsappAccount(id: string): Promise<void> {
    await db.delete(whatsappAccounts).where(eq(whatsappAccounts.id, id));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv || undefined;
  }

  async getConversationsByAccountId(accountId: string): Promise<Conversation[]> {
    return db.select().from(conversations).where(eq(conversations.whatsappAccountId, accountId)).orderBy(desc(conversations.lastMessageAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConv] = await db.insert(conversations).values(conversation).returning();
    return newConv;
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation> {
    const [updated] = await db.update(conversations).set(data).where(eq(conversations.id, id)).returning();
    return updated;
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [msg] = await db.select().from(messages).where(eq(messages.id, id));
    return msg || undefined;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMsg] = await db.insert(messages).values(message).returning();
    return newMsg;
  }

  async getChatbot(id: string): Promise<Chatbot | undefined> {
    const [bot] = await db.select().from(chatbots).where(eq(chatbots.id, id));
    return bot || undefined;
  }

  async getChatbotsByUserId(userId: string): Promise<Chatbot[]> {
    return db.select().from(chatbots).where(eq(chatbots.userId, userId)).orderBy(desc(chatbots.createdAt));
  }

  async getChatbotsByAccountId(accountId: string): Promise<Chatbot[]> {
    return db.select().from(chatbots).where(eq(chatbots.whatsappAccountId, accountId));
  }

  async createChatbot(chatbot: InsertChatbot): Promise<Chatbot> {
    const [newBot] = await db.insert(chatbots).values(chatbot).returning();
    return newBot;
  }

  async updateChatbot(id: string, data: Partial<Chatbot>): Promise<Chatbot> {
    const [updated] = await db.update(chatbots).set(data).where(eq(chatbots.id, id)).returning();
    return updated;
  }

  async deleteChatbot(id: string): Promise<void> {
    await db.delete(chatbots).where(eq(chatbots.id, id));
  }

  async getChatbotRule(id: string): Promise<ChatbotRule | undefined> {
    const [rule] = await db.select().from(chatbotRules).where(eq(chatbotRules.id, id));
    return rule || undefined;
  }

  async getChatbotRulesByChatbotId(chatbotId: string): Promise<ChatbotRule[]> {
    return db.select().from(chatbotRules).where(eq(chatbotRules.chatbotId, chatbotId));
  }

  async createChatbotRule(rule: InsertChatbotRule): Promise<ChatbotRule> {
    const [newRule] = await db.insert(chatbotRules).values(rule).returning();
    return newRule;
  }

  async updateChatbotRule(id: string, data: Partial<ChatbotRule>): Promise<ChatbotRule> {
    const [updated] = await db.update(chatbotRules).set(data).where(eq(chatbotRules.id, id)).returning();
    return updated;
  }

  async deleteChatbotRule(id: string): Promise<void> {
    await db.delete(chatbotRules).where(eq(chatbotRules.id, id));
  }

  async getKnowledgeBaseCategory(id: string): Promise<KnowledgeBaseCategory | undefined> {
    const [cat] = await db.select().from(knowledgeBaseCategories).where(eq(knowledgeBaseCategories.id, id));
    return cat || undefined;
  }

  async getKnowledgeBaseCategoriesByChatbotId(chatbotId: string): Promise<KnowledgeBaseCategory[]> {
    return db.select().from(knowledgeBaseCategories).where(eq(knowledgeBaseCategories.chatbotId, chatbotId));
  }

  async createKnowledgeBaseCategory(category: InsertKnowledgeBaseCategory): Promise<KnowledgeBaseCategory> {
    const [newCat] = await db.insert(knowledgeBaseCategories).values(category).returning();
    return newCat;
  }

  async updateKnowledgeBaseCategory(id: string, data: Partial<KnowledgeBaseCategory>): Promise<KnowledgeBaseCategory> {
    const [updated] = await db.update(knowledgeBaseCategories).set(data).where(eq(knowledgeBaseCategories.id, id)).returning();
    return updated;
  }

  async deleteKnowledgeBaseCategory(id: string): Promise<void> {
    await db.delete(knowledgeBaseCategories).where(eq(knowledgeBaseCategories.id, id));
  }

  async getKnowledgeBaseSubcategory(id: string): Promise<KnowledgeBaseSubcategory | undefined> {
    const [subcat] = await db.select().from(knowledgeBaseSubcategories).where(eq(knowledgeBaseSubcategories.id, id));
    return subcat || undefined;
  }

  async getKnowledgeBaseSubcategoriesByCategoryId(categoryId: string): Promise<KnowledgeBaseSubcategory[]> {
    return db.select().from(knowledgeBaseSubcategories).where(eq(knowledgeBaseSubcategories.categoryId, categoryId));
  }

  async createKnowledgeBaseSubcategory(subcategory: InsertKnowledgeBaseSubcategory): Promise<KnowledgeBaseSubcategory> {
    const [newSubcat] = await db.insert(knowledgeBaseSubcategories).values(subcategory).returning();
    return newSubcat;
  }

  async updateKnowledgeBaseSubcategory(id: string, data: Partial<KnowledgeBaseSubcategory>): Promise<KnowledgeBaseSubcategory> {
    const [updated] = await db.update(knowledgeBaseSubcategories).set(data).where(eq(knowledgeBaseSubcategories.id, id)).returning();
    return updated;
  }

  async deleteKnowledgeBaseSubcategory(id: string): Promise<void> {
    await db.delete(knowledgeBaseSubcategories).where(eq(knowledgeBaseSubcategories.id, id));
  }

  async getKnowledgeBaseItem(id: string): Promise<KnowledgeBaseItem | undefined> {
    const [item] = await db.select().from(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, id));
    return item || undefined;
  }

  async getKnowledgeBaseItemsByChatbotId(chatbotId: string): Promise<KnowledgeBaseItem[]> {
    return db.select().from(knowledgeBaseItems).where(eq(knowledgeBaseItems.chatbotId, chatbotId));
  }

  async getKnowledgeBaseItemsByCategoryId(categoryId: string): Promise<KnowledgeBaseItem[]> {
    return db.select().from(knowledgeBaseItems).where(eq(knowledgeBaseItems.categoryId, categoryId));
  }

  async createKnowledgeBaseItem(item: InsertKnowledgeBaseItem): Promise<KnowledgeBaseItem> {
    const [newItem] = await db.insert(knowledgeBaseItems).values(item).returning();
    return newItem;
  }

  async updateKnowledgeBaseItem(id: string, data: Partial<KnowledgeBaseItem>): Promise<KnowledgeBaseItem> {
    const [updated] = await db.update(knowledgeBaseItems).set(data).where(eq(knowledgeBaseItems.id, id)).returning();
    return updated;
  }

  async deleteKnowledgeBaseItem(id: string): Promise<void> {
    await db.delete(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, id));
  }

  async getSurvey(id: string): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    return survey || undefined;
  }

  async getSurveysByUserId(userId: string): Promise<Survey[]> {
    return db.select().from(surveys).where(eq(surveys.userId, userId)).orderBy(desc(surveys.createdAt));
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const [newSurvey] = await db.insert(surveys).values(survey).returning();
    return newSurvey;
  }

  async updateSurvey(id: string, data: Partial<Survey>): Promise<Survey> {
    const [updated] = await db.update(surveys).set(data).where(eq(surveys.id, id)).returning();
    return updated;
  }

  async deleteSurvey(id: string): Promise<void> {
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  async getSurveyQuestion(id: string): Promise<SurveyQuestion | undefined> {
    const [q] = await db.select().from(surveyQuestions).where(eq(surveyQuestions.id, id));
    return q || undefined;
  }

  async getSurveyQuestionsBySurveyId(surveyId: string): Promise<SurveyQuestion[]> {
    return db.select().from(surveyQuestions).where(eq(surveyQuestions.surveyId, surveyId)).orderBy(desc(surveyQuestions.order));
  }

  async createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion> {
    const [newQ] = await db.insert(surveyQuestions).values(question).returning();
    return newQ;
  }

  async updateSurveyQuestion(id: string, data: Partial<SurveyQuestion>): Promise<SurveyQuestion> {
    const [updated] = await db.update(surveyQuestions).set(data).where(eq(surveyQuestions.id, id)).returning();
    return updated;
  }

  async deleteSurveyQuestion(id: string): Promise<void> {
    await db.delete(surveyQuestions).where(eq(surveyQuestions.id, id));
  }

  async getSurveyResponse(id: string): Promise<SurveyResponse | undefined> {
    const [resp] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, id));
    return resp || undefined;
  }

  async getSurveyResponsesBySurveyId(surveyId: string): Promise<SurveyResponse[]> {
    return db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [newResp] = await db.insert(surveyResponses).values(response).returning();
    return newResp;
  }

  async updateSurveyResponse(id: string, data: Partial<SurveyResponse>): Promise<SurveyResponse> {
    const [updated] = await db.update(surveyResponses).set(data).where(eq(surveyResponses.id, id)).returning();
    return updated;
  }

  async deleteSurveyResponse(id: string): Promise<void> {
    await db.delete(surveyResponses).where(eq(surveyResponses.id, id));
  }

  async getChatbotActivities(chatbotId: string, limit = 100): Promise<ChatbotActivity[]> {
    return db.select().from(chatbotActivities).where(eq(chatbotActivities.chatbotId, chatbotId)).orderBy(desc(chatbotActivities.createdAt)).limit(limit);
  }

  async createChatbotActivity(activity: InsertChatbotActivity): Promise<ChatbotActivity> {
    const [newActivity] = await db.insert(chatbotActivities).values(activity).returning();
    return newActivity;
  }

  async getChatbotAIProviders(chatbotId: string): Promise<ChatbotAIProvider[]> {
    return db.select().from(chatbotAIProviders).where(eq(chatbotAIProviders.chatbotId, chatbotId));
  }

  async createChatbotAIProvider(provider: InsertChatbotAIProvider): Promise<ChatbotAIProvider> {
    const [newProvider] = await db.insert(chatbotAIProviders).values(provider).returning();
    return newProvider;
  }

  async deleteChatbotAIProvider(id: string): Promise<void> {
    await db.delete(chatbotAIProviders).where(eq(chatbotAIProviders.id, id));
  }

  async updateChatbotAIProvider(id: string, data: Partial<ChatbotAIProvider>): Promise<ChatbotAIProvider> {
    const [updated] = await db.update(chatbotAIProviders).set(data).where(eq(chatbotAIProviders.id, id)).returning();
    return updated;
  }

  async getChatbotStats(chatbotId: string): Promise<any | undefined> {
    const [stats] = await db.select().from(chatbotStats).where(eq(chatbotStats.chatbotId, chatbotId));
    return stats || undefined;
  }

  async createChatbotStats(chatbotId: string): Promise<any> {
    const [newStats] = await db.insert(chatbotStats).values({ chatbotId, totalMessages: 0, automatedResponses: 0 }).returning();
    return newStats;
  }

  async updateChatbotStats(chatbotId: string, data: Partial<any>): Promise<any> {
    const [updated] = await db.update(chatbotStats).set(data).where(eq(chatbotStats.chatbotId, chatbotId)).returning();
    return updated;
  }

  async incrementChatbotStats(chatbotId: string, field: 'totalMessages' | 'automatedResponses'): Promise<any> {
    const current = await this.getChatbotStats(chatbotId);
    if (!current) return this.createChatbotStats(chatbotId);
    return this.updateChatbotStats(chatbotId, { [field]: (current[field] || 0) + 1 });
  }

  async getBankAccount(id: string): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account || undefined;
  }

  async getBankAccountsByUserId(userId: string): Promise<BankAccount[]> {
    return db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const [newAccount] = await db.insert(bankAccounts).values(account).returning();
    return newAccount;
  }

  async updateBankAccount(id: string, data: Partial<BankAccount>): Promise<BankAccount> {
    const [updated] = await db.update(bankAccounts).set(data).where(eq(bankAccounts.id, id)).returning();
    return updated;
  }

  async deleteBankAccount(id: string): Promise<void> {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }

  async getBankTransaction(id: string): Promise<BankTransaction | undefined> {
    const [trans] = await db.select().from(bankTransactions).where(eq(bankTransactions.id, id));
    return trans || undefined;
  }

  async getBankTransactionsByAccountId(accountId: string): Promise<BankTransaction[]> {
    return db.select().from(bankTransactions).where(eq(bankTransactions.accountId, accountId)).orderBy(desc(bankTransactions.createdAt));
  }

  async createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction> {
    const [newTrans] = await db.insert(bankTransactions).values(transaction).returning();
    return newTrans;
  }

  async updateBankTransaction(id: string, data: Partial<BankTransaction>): Promise<BankTransaction> {
    const [updated] = await db.update(bankTransactions).set(data).where(eq(bankTransactions.id, id)).returning();
    return updated;
  }

  async deleteBankTransaction(id: string): Promise<void> {
    await db.delete(bankTransactions).where(eq(bankTransactions.id, id));
  }

  async getFacebookAccount(id: string): Promise<FacebookAccount | undefined> {
    const [account] = await db.select().from(facebookAccounts).where(eq(facebookAccounts.id, id));
    return account || undefined;
  }

  async getFacebookAccountsByUserId(userId: string): Promise<FacebookAccount[]> {
    return db.select().from(facebookAccounts).where(eq(facebookAccounts.userId, userId));
  }

  async createFacebookAccount(account: InsertFacebookAccount): Promise<FacebookAccount> {
    const [newAccount] = await db.insert(facebookAccounts).values(account).returning();
    return newAccount;
  }

  async updateFacebookAccount(id: string, data: Partial<FacebookAccount>): Promise<FacebookAccount> {
    const [updated] = await db.update(facebookAccounts).set(data).where(eq(facebookAccounts.id, id)).returning();
    return updated;
  }

  async deleteFacebookAccount(id: string): Promise<void> {
    await db.delete(facebookAccounts).where(eq(facebookAccounts.id, id));
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event || undefined;
  }

  async getCalendarEventsByUserId(userId: string): Promise<CalendarEvent[]> {
    return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(desc(calendarEvents.startTime));
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db.insert(calendarEvents).values(event).returning();
    return newEvent;
  }

  async updateCalendarEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const [updated] = await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id)).returning();
    return updated;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientsByUserId(userId: string): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const [updated] = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByUserId(userId: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    const [updated] = await db.update(leads).set(data).where(eq(leads.id, id)).returning();
    return updated;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async getCustomDomain(id: string): Promise<CustomDomain | undefined> {
    const [domain] = await db.select().from(customDomains).where(eq(customDomains.id, id));
    return domain || undefined;
  }

  async getCustomDomainsByUserId(userId: string): Promise<CustomDomain[]> {
    return db.select().from(customDomains).where(eq(customDomains.userId, userId)).orderBy(desc(customDomains.createdAt));
  }

  async getCustomDomainByDomain(domain: string): Promise<CustomDomain | undefined> {
    const [result] = await db.select().from(customDomains).where(eq(customDomains.domain, domain));
    return result || undefined;
  }

  async createCustomDomain(domain: InsertCustomDomain): Promise<CustomDomain> {
    const [newDomain] = await db.insert(customDomains).values(domain).returning();
    return newDomain;
  }

  async updateCustomDomain(id: string, data: Partial<CustomDomain>): Promise<CustomDomain> {
    const [updated] = await db.update(customDomains).set(data).where(eq(customDomains.id, id)).returning();
    return updated;
  }

  async deleteCustomDomain(id: string): Promise<void> {
    await db.delete(customDomains).where(eq(customDomains.id, id));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByUserId(userId: string): Promise<Product[]> {
