// Referencing javascript_database blueprint
import { 
  users, whatsappAccounts, conversations, messages, chatbots, chatbotRules, knowledgeBaseCategories, knowledgeBaseSubcategories, knowledgeBaseItems, surveys, surveyQuestions, surveyResponses, chatbotActivities, chatbotStats, chatbotAIProviders, bankAccounts, bankTransactions, facebookAccounts, calendarEvents, clients, leads, customDomains, raffles, raffleTickets, rafflePurchases, raffleStories, raffleBankAccounts, chatClassificationRules, chatClassificationResults, teams, teamMembers, teamActivityLogs, teamModuleAccess, stores, storeProductCategories, storeProductSubcategories, storeProducts, storeServices, storeCoupons, storeOrders, storeOrderItems, storeCustomDomains, tasks, notifications,
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
  type ChatClassificationRule, type InsertChatClassificationRule,
  type ChatClassificationResult,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember,
  type TeamActivityLog, type InsertTeamActivityLog,
  type TeamModuleAccess, type InsertTeamModuleAccess,
  type Store, type InsertStore,
  type StoreProduct, type InsertStoreProduct,
  type StoreService, type InsertStoreService,
  type StoreCoupon, type InsertStoreCoupon,
  type StoreOrder, type InsertStoreOrder,
  type StoreOrderItem, type InsertStoreOrderItem,
  type StoreProductCategory, type InsertStoreProductCategory,
  type StoreProductSubcategory, type InsertStoreProductSubcategory,
  type StoreCustomDomain, type InsertStoreCustomDomain,
  type Task, type InsertTask,
  type Notification, type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  getWhatsappAccount(id: string): Promise<WhatsappAccount | undefined>;
  getWhatsappAccountsByUserId(userId: string): Promise<WhatsappAccount[]>;
  getAllWhatsappAccounts(): Promise<WhatsappAccount[]>;
  createWhatsappAccount(account: InsertWhatsappAccount): Promise<WhatsappAccount>;
  updateWhatsappAccount(id: string, data: Partial<WhatsappAccount>): Promise<WhatsappAccount>;
  deleteWhatsappAccount(id: string): Promise<void>;
  
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByAccountId(accountId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation>;
  
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  getChatbot(id: string): Promise<Chatbot | undefined>;
  getChatbotsByUserId(userId: string): Promise<Chatbot[]>;
  getChatbotsByAccountId(accountId: string): Promise<Chatbot[]>;
  createChatbot(chatbot: InsertChatbot): Promise<Chatbot>;
  updateChatbot(id: string, data: Partial<Chatbot>): Promise<Chatbot>;
  deleteChatbot(id: string): Promise<void>;
  
  getChatbotRule(id: string): Promise<ChatbotRule | undefined>;
  getChatbotRulesByChatbotId(chatbotId: string): Promise<ChatbotRule[]>;
  createChatbotRule(rule: InsertChatbotRule): Promise<ChatbotRule>;
  updateChatbotRule(id: string, data: Partial<ChatbotRule>): Promise<ChatbotRule>;
  deleteChatbotRule(id: string): Promise<void>;

  getKnowledgeBaseCategory(id: string): Promise<KnowledgeBaseCategory | undefined>;
  getKnowledgeBaseCategoriesByChatbotId(chatbotId: string): Promise<KnowledgeBaseCategory[]>;
  createKnowledgeBaseCategory(category: InsertKnowledgeBaseCategory): Promise<KnowledgeBaseCategory>;
  updateKnowledgeBaseCategory(id: string, data: Partial<KnowledgeBaseCategory>): Promise<KnowledgeBaseCategory>;
  deleteKnowledgeBaseCategory(id: string): Promise<void>;

  getKnowledgeBaseSubcategory(id: string): Promise<KnowledgeBaseSubcategory | undefined>;
  getKnowledgeBaseSubcategoriesByCategoryId(categoryId: string): Promise<KnowledgeBaseSubcategory[]>;
  createKnowledgeBaseSubcategory(subcategory: InsertKnowledgeBaseSubcategory): Promise<KnowledgeBaseSubcategory>;
  updateKnowledgeBaseSubcategory(id: string, data: Partial<KnowledgeBaseSubcategory>): Promise<KnowledgeBaseSubcategory>;
  deleteKnowledgeBaseSubcategory(id: string): Promise<void>;

  getKnowledgeBaseItem(id: string): Promise<KnowledgeBaseItem | undefined>;
  getKnowledgeBaseItemsByChatbotId(chatbotId: string): Promise<KnowledgeBaseItem[]>;
  getKnowledgeBaseItemsByCategoryId(categoryId: string): Promise<KnowledgeBaseItem[]>;
  createKnowledgeBaseItem(item: InsertKnowledgeBaseItem): Promise<KnowledgeBaseItem>;
  updateKnowledgeBaseItem(id: string, data: Partial<KnowledgeBaseItem>): Promise<KnowledgeBaseItem>;
  deleteKnowledgeBaseItem(id: string): Promise<void>;

  getSurvey(id: string): Promise<Survey | undefined>;
  getSurveysByUserId(userId: string): Promise<Survey[]>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: string, data: Partial<Survey>): Promise<Survey>;
  deleteSurvey(id: string): Promise<void>;

  getSurveyQuestion(id: string): Promise<SurveyQuestion | undefined>;
  getSurveyQuestionsBySurveyId(surveyId: string): Promise<SurveyQuestion[]>;
  createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion>;
  updateSurveyQuestion(id: string, data: Partial<SurveyQuestion>): Promise<SurveyQuestion>;
  deleteSurveyQuestion(id: string): Promise<void>;

  getSurveyResponse(id: string): Promise<SurveyResponse | undefined>;
  getSurveyResponsesBySurveyId(surveyId: string): Promise<SurveyResponse[]>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  updateSurveyResponse(id: string, data: Partial<SurveyResponse>): Promise<SurveyResponse>;
  deleteSurveyResponse(id: string): Promise<void>;

  getChatbotActivities(chatbotId: string, limit?: number): Promise<ChatbotActivity[]>;
  createChatbotActivity(activity: InsertChatbotActivity): Promise<ChatbotActivity>;

  getChatbotAIProviders(chatbotId: string): Promise<ChatbotAIProvider[]>;
  createChatbotAIProvider(provider: InsertChatbotAIProvider): Promise<ChatbotAIProvider>;
  deleteChatbotAIProvider(id: string): Promise<void>;
  updateChatbotAIProvider(id: string, data: Partial<ChatbotAIProvider>): Promise<ChatbotAIProvider>;

  getChatbotStats(chatbotId: string): Promise<any | undefined>;
  createChatbotStats(chatbotId: string): Promise<any>;
  updateChatbotStats(chatbotId: string, data: Partial<any>): Promise<any>;
  incrementChatbotStats(chatbotId: string, field: 'totalMessages' | 'automatedResponses'): Promise<any>;

  getBankAccount(id: string): Promise<BankAccount | undefined>;
  getBankAccountsByUserId(userId: string): Promise<BankAccount[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: string, data: Partial<BankAccount>): Promise<BankAccount>;
  deleteBankAccount(id: string): Promise<void>;

  getBankTransaction(id: string): Promise<BankTransaction | undefined>;
  getBankTransactionsByAccountId(accountId: string): Promise<BankTransaction[]>;
  createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction>;
  updateBankTransaction(id: string, data: Partial<BankTransaction>): Promise<BankTransaction>;
  deleteBankTransaction(id: string): Promise<void>;

  getFacebookAccount(id: string): Promise<FacebookAccount | undefined>;
  getFacebookAccountsByUserId(userId: string): Promise<FacebookAccount[]>;
  createFacebookAccount(account: InsertFacebookAccount): Promise<FacebookAccount>;
  updateFacebookAccount(id: string, data: Partial<FacebookAccount>): Promise<FacebookAccount>;
  deleteFacebookAccount(id: string): Promise<void>;

  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  getCalendarEventsByUserId(userId: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;

  getClient(id: string): Promise<Client | undefined>;
  getClientsByUserId(userId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, data: Partial<Client>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByUserId(userId: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, data: Partial<Lead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  getCustomDomain(id: string): Promise<CustomDomain | undefined>;
  getCustomDomainsByUserId(userId: string): Promise<CustomDomain[]>;
  getCustomDomainByDomain(domain: string): Promise<CustomDomain | undefined>;
  createCustomDomain(domain: InsertCustomDomain): Promise<CustomDomain>;
  updateCustomDomain(id: string, data: Partial<CustomDomain>): Promise<CustomDomain>;
  deleteCustomDomain(id: string): Promise<void>;

  getRaffle(id: string): Promise<Raffle | undefined>;
  getRafflesByUserId(userId: string): Promise<Raffle[]>;
  createRaffle(raffle: InsertRaffle): Promise<Raffle>;
  updateRaffle(id: string, data: Partial<Raffle>): Promise<Raffle>;
  deleteRaffle(id: string): Promise<void>;

  getRaffleTicket(id: string): Promise<RaffleTicket | undefined>;
  getRaffleTicketsByRaffleId(raffleId: string): Promise<RaffleTicket[]>;
  createRaffleTicket(ticket: InsertRaffleTicket): Promise<RaffleTicket>;
  updateRaffleTicket(id: string, data: Partial<RaffleTicket>): Promise<RaffleTicket>;
  deleteRaffleTicket(id: string): Promise<void>;

  getRafflePurchase(id: string): Promise<RafflePurchase | undefined>;
  getRafflePurchasesByRaffleId(raffleId: string): Promise<RafflePurchase[]>;
  createRafflePurchase(purchase: InsertRafflePurchase): Promise<RafflePurchase>;
  updateRafflePurchase(id: string, data: Partial<RafflePurchase>): Promise<RafflePurchase>;
  deleteRafflePurchase(id: string): Promise<void>;

  getRaffleStory(id: string): Promise<RaffleStory | undefined>;
  getRaffleStoriesByRaffleId(raffleId: string): Promise<RaffleStory[]>;
  createRaffleStory(story: InsertRaffleStory): Promise<RaffleStory>;
  updateRaffleStory(id: string, data: Partial<RaffleStory>): Promise<RaffleStory>;
  deleteRaffleStory(id: string): Promise<void>;

  getRaffleBankAccount(id: string): Promise<RaffleBankAccount | undefined>;
  getRaffleBankAccountsByRaffleId(raffleId: string): Promise<RaffleBankAccount[]>;
  createRaffleBankAccount(account: InsertRaffleBankAccount): Promise<RaffleBankAccount>;
  updateRaffleBankAccount(id: string, data: Partial<RaffleBankAccount>): Promise<RaffleBankAccount>;
  deleteRaffleBankAccount(id: string): Promise<void>;

  getRaffleCustomer(id: string): Promise<RaffleCustomer | undefined>;
  getRaffleCustomersByRaffleId(raffleId: string): Promise<RaffleCustomer[]>;
  createRaffleCustomer(customer: InsertRaffleCustomer): Promise<RaffleCustomer>;
  updateRaffleCustomer(id: string, data: Partial<RaffleCustomer>): Promise<RaffleCustomer>;
  deleteRaffleCustomer(id: string): Promise<void>;

  // Chat Classification
  getChatClassificationRules(whatsappAccountId: string): Promise<ChatClassificationRule[]>;
  createChatClassificationRule(rule: InsertChatClassificationRule): Promise<ChatClassificationRule>;
  getChatClassificationResult(conversationId: string): Promise<ChatClassificationResult | undefined>;
  createChatClassificationResult(result: any): Promise<ChatClassificationResult>;
  updateChatClassificationResult(id: string, data: any): Promise<ChatClassificationResult>;

  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  getUnviewedNotificationsByUserId(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsViewed(id: string): Promise<Notification>;
  deleteNotification(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) { const [u] = await db.select().from(users).where(eq(users.id, id)); return u; }
  async getUserByEmail(email: string) { const [u] = await db.select().from(users).where(eq(users.email, email)); return u; }
  async createUser(user: InsertUser) { const [u] = await db.insert(users).values(user).returning(); return u; }
  async updateUser(id: string, data: Partial<User>) { const [u] = await db.update(users).set(data).where(eq(users.id, id)).returning(); return u; }

  async getWhatsappAccount(id: string) { const [a] = await db.select().from(whatsappAccounts).where(eq(whatsappAccounts.id, id)); return a; }
  async getWhatsappAccountsByUserId(userId: string) { return db.select().from(whatsappAccounts).where(eq(whatsappAccounts.userId, userId)); }
  async getAllWhatsappAccounts() { return db.select().from(whatsappAccounts); }
  async createWhatsappAccount(account: InsertWhatsappAccount) { const [a] = await db.insert(whatsappAccounts).values(account).returning(); return a; }
  async updateWhatsappAccount(id: string, data: Partial<WhatsappAccount>) { const [a] = await db.update(whatsappAccounts).set(data).where(eq(whatsappAccounts.id, id)).returning(); return a; }
  async deleteWhatsappAccount(id: string) { await db.delete(whatsappAccounts).where(eq(whatsappAccounts.id, id)); }

  async getConversation(id: string) { const [c] = await db.select().from(conversations).where(eq(conversations.id, id)); return c; }
  async getConversationsByAccountId(accountId: string) { return db.select().from(conversations).where(eq(conversations.whatsappAccountId, accountId)).orderBy(desc(conversations.lastMessageText)); }
  async createConversation(conversation: InsertConversation) { const [c] = await db.insert(conversations).values(conversation).returning(); return c; }
  async updateConversation(id: string, data: Partial<Conversation>) { const [c] = await db.update(conversations).set(data).where(eq(conversations.id, id)).returning(); return c; }

  async getMessage(id: string) { const [m] = await db.select().from(messages).where(eq(messages.id, id)); return m; }
  async getMessagesByConversationId(conversationId: string) { return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.timestamp); }
  async createMessage(message: InsertMessage) { const [m] = await db.insert(messages).values(message).returning(); return m; }

  async getChatbot(id: string) { const [b] = await db.select().from(chatbots).where(eq(chatbots.id, id)); return b; }
  async getChatbotsByUserId(userId: string) { return db.select().from(chatbots).where(eq(chatbots.userId, userId)).orderBy(desc(chatbots.createdAt)); }
  async getChatbotsByAccountId(accountId: string) { return db.select().from(chatbots).where(eq(chatbots.whatsappAccountId, accountId)); }
  async createChatbot(chatbot: InsertChatbot) { const [b] = await db.insert(chatbots).values(chatbot).returning(); return b; }
  async updateChatbot(id: string, data: Partial<Chatbot>) { const [b] = await db.update(chatbots).set(data).where(eq(chatbots.id, id)).returning(); return b; }
  async deleteChatbot(id: string) { await db.delete(chatbots).where(eq(chatbots.id, id)); }

  async getChatbotRule(id: string) { const [r] = await db.select().from(chatbotRules).where(eq(chatbotRules.id, id)); return r; }
  async getChatbotRulesByChatbotId(chatbotId: string) { return db.select().from(chatbotRules).where(eq(chatbotRules.chatbotId, chatbotId)); }
  async createChatbotRule(rule: InsertChatbotRule) { const [r] = await db.insert(chatbotRules).values(rule).returning(); return r; }
  async updateChatbotRule(id: string, data: Partial<ChatbotRule>) { const [r] = await db.update(chatbotRules).set(data).where(eq(chatbotRules.id, id)).returning(); return r; }
  async deleteChatbotRule(id: string) { await db.delete(chatbotRules).where(eq(chatbotRules.id, id)); }

  async getKnowledgeBaseCategory(id: string) { const [c] = await db.select().from(knowledgeBaseCategories).where(eq(knowledgeBaseCategories.id, id)); return c; }
  async getKnowledgeBaseCategoriesByChatbotId(chatbotId: string) { return db.select().from(knowledgeBaseCategories).where(eq(knowledgeBaseCategories.chatbotId, chatbotId)); }
  async createKnowledgeBaseCategory(category: InsertKnowledgeBaseCategory) { const [c] = await db.insert(knowledgeBaseCategories).values(category).returning(); return c; }
  async updateKnowledgeBaseCategory(id: string, data: Partial<KnowledgeBaseCategory>) { const [c] = await db.update(knowledgeBaseCategories).set(data).where(eq(knowledgeBaseCategories.id, id)).returning(); return c; }
  async deleteKnowledgeBaseCategory(id: string) { await db.delete(knowledgeBaseCategories).where(eq(knowledgeBaseCategories.id, id)); }

  async getKnowledgeBaseSubcategory(id: string) { const [s] = await db.select().from(knowledgeBaseSubcategories).where(eq(knowledgeBaseSubcategories.id, id)); return s; }
  async getKnowledgeBaseSubcategoriesByCategoryId(categoryId: string) { return db.select().from(knowledgeBaseSubcategories).where(eq(knowledgeBaseSubcategories.categoryId, categoryId)); }
  async createKnowledgeBaseSubcategory(subcategory: InsertKnowledgeBaseSubcategory) { const [s] = await db.insert(knowledgeBaseSubcategories).values(subcategory).returning(); return s; }
  async updateKnowledgeBaseSubcategory(id: string, data: Partial<KnowledgeBaseSubcategory>) { const [s] = await db.update(knowledgeBaseSubcategories).set(data).where(eq(knowledgeBaseSubcategories.id, id)).returning(); return s; }
  async deleteKnowledgeBaseSubcategory(id: string) { await db.delete(knowledgeBaseSubcategories).where(eq(knowledgeBaseSubcategories.id, id)); }

  async getKnowledgeBaseItem(id: string) { const [i] = await db.select().from(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, id)); return i; }
  async getKnowledgeBaseItemsByChatbotId(chatbotId: string) { return db.select().from(knowledgeBaseItems).where(eq(knowledgeBaseItems.chatbotId, chatbotId)); }
  async getKnowledgeBaseItemsByCategoryId(categoryId: string) { return db.select().from(knowledgeBaseItems).where(eq(knowledgeBaseItems.categoryId, categoryId)); }
  async createKnowledgeBaseItem(item: InsertKnowledgeBaseItem) { const [i] = await db.insert(knowledgeBaseItems).values(item).returning(); return i; }
  async updateKnowledgeBaseItem(id: string, data: Partial<KnowledgeBaseItem>) { const [i] = await db.update(knowledgeBaseItems).set(data).where(eq(knowledgeBaseItems.id, id)).returning(); return i; }
  async deleteKnowledgeBaseItem(id: string) { await db.delete(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, id)); }

  async getSurvey(id: string) { const [s] = await db.select().from(surveys).where(eq(surveys.id, id)); return s; }
  async getSurveysByUserId(userId: string) { return db.select().from(surveys).where(eq(surveys.userId, userId)).orderBy(desc(surveys.createdAt)); }
  async createSurvey(survey: InsertSurvey) { const [s] = await db.insert(surveys).values(survey).returning(); return s; }
  async updateSurvey(id: string, data: Partial<Survey>) { const [s] = await db.update(surveys).set(data).where(eq(surveys.id, id)).returning(); return s; }
  async deleteSurvey(id: string) { await db.delete(surveys).where(eq(surveys.id, id)); }

  async getSurveyQuestion(id: string) { const [q] = await db.select().from(surveyQuestions).where(eq(surveyQuestions.id, id)); return q; }
  async getSurveyQuestionsBySurveyId(surveyId: string) { return db.select().from(surveyQuestions).where(eq(surveyQuestions.surveyId, surveyId)); }
  async createSurveyQuestion(question: InsertSurveyQuestion) { const [q] = await db.insert(surveyQuestions).values(question).returning(); return q; }
  async updateSurveyQuestion(id: string, data: Partial<SurveyQuestion>) { const [q] = await db.update(surveyQuestions).set(data).where(eq(surveyQuestions.id, id)).returning(); return q; }
  async deleteSurveyQuestion(id: string) { await db.delete(surveyQuestions).where(eq(surveyQuestions.id, id)); }

  async getSurveyResponse(id: string) { const [r] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, id)); return r; }
  async getSurveyResponsesBySurveyId(surveyId: string) { return db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId)); }
  async createSurveyResponse(response: InsertSurveyResponse) { const [r] = await db.insert(surveyResponses).values(response).returning(); return r; }
  async updateSurveyResponse(id: string, data: Partial<SurveyResponse>) { const [r] = await db.update(surveyResponses).set(data).where(eq(surveyResponses.id, id)).returning(); return r; }
  async deleteSurveyResponse(id: string) { await db.delete(surveyResponses).where(eq(surveyResponses.id, id)); }

  async getChatbotActivities(chatbotId: string, limit = 100) { return db.select().from(chatbotActivities).where(eq(chatbotActivities.chatbotId, chatbotId)).orderBy(desc(chatbotActivities.createdAt)).limit(limit); }
  async createChatbotActivity(activity: InsertChatbotActivity) { const [a] = await db.insert(chatbotActivities).values(activity).returning(); return a; }

  async getChatbotAIProviders(chatbotId: string) { return db.select().from(chatbotAIProviders).where(eq(chatbotAIProviders.chatbotId, chatbotId)); }
  async createChatbotAIProvider(provider: InsertChatbotAIProvider) { const [p] = await db.insert(chatbotAIProviders).values(provider).returning(); return p; }
  async deleteChatbotAIProvider(id: string) { await db.delete(chatbotAIProviders).where(eq(chatbotAIProviders.id, id)); }
  async updateChatbotAIProvider(id: string, data: Partial<ChatbotAIProvider>) { const [p] = await db.update(chatbotAIProviders).set(data).where(eq(chatbotAIProviders.id, id)).returning(); return p; }

  async getChatbotStats(chatbotId: string) { const [s] = await db.select().from(chatbotStats).where(eq(chatbotStats.chatbotId, chatbotId)); return s; }
  async createChatbotStats(chatbotId: string) { const [s] = await db.insert(chatbotStats).values({ chatbotId, totalMessages: 0, automatedResponses: 0 }).returning(); return s; }
  async updateChatbotStats(chatbotId: string, data: Partial<any>) { const [s] = await db.update(chatbotStats).set(data).where(eq(chatbotStats.chatbotId, chatbotId)).returning(); return s; }
  async incrementChatbotStats(chatbotId: string, field: 'totalMessages' | 'automatedResponses') { const cur = await this.getChatbotStats(chatbotId); if (!cur) return this.createChatbotStats(chatbotId); return this.updateChatbotStats(chatbotId, { [field]: (cur[field] || 0) + 1 }); }

  async getBankAccount(id: string) { const [a] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id)); return a; }
  async getBankAccountsByUserId(userId: string) { return db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId)); }
  async createBankAccount(account: InsertBankAccount) { const [a] = await db.insert(bankAccounts).values(account).returning(); return a; }
  async updateBankAccount(id: string, data: Partial<BankAccount>) { const [a] = await db.update(bankAccounts).set(data).where(eq(bankAccounts.id, id)).returning(); return a; }
  async deleteBankAccount(id: string) { await db.delete(bankAccounts).where(eq(bankAccounts.id, id)); }

  async getBankTransaction(id: string) { const [t] = await db.select().from(bankTransactions).where(eq(bankTransactions.id, id)); return t; }
  async getBankTransactionsByAccountId(accountId: string) { return db.select().from(bankTransactions).where(eq(bankTransactions.accountId, accountId)).orderBy(desc(bankTransactions.createdAt)); }
  async createBankTransaction(transaction: InsertBankTransaction) { const [t] = await db.insert(bankTransactions).values(transaction).returning(); return t; }
  async updateBankTransaction(id: string, data: Partial<BankTransaction>) { const [t] = await db.update(bankTransactions).set(data).where(eq(bankTransactions.id, id)).returning(); return t; }
  async deleteBankTransaction(id: string) { await db.delete(bankTransactions).where(eq(bankTransactions.id, id)); }

  async getFacebookAccount(id: string) { const [a] = await db.select().from(facebookAccounts).where(eq(facebookAccounts.id, id)); return a; }
  async getFacebookAccountsByUserId(userId: string) { return db.select().from(facebookAccounts).where(eq(facebookAccounts.userId, userId)); }
  async createFacebookAccount(account: InsertFacebookAccount) { const [a] = await db.insert(facebookAccounts).values(account).returning(); return a; }
  async updateFacebookAccount(id: string, data: Partial<FacebookAccount>) { const [a] = await db.update(facebookAccounts).set(data).where(eq(facebookAccounts.id, id)).returning(); return a; }
  async deleteFacebookAccount(id: string) { await db.delete(facebookAccounts).where(eq(facebookAccounts.id, id)); }

  async getCalendarEvent(id: string) { const [e] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)); return e; }
  async getCalendarEventsByUserId(userId: string) { return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(desc(calendarEvents.startTime)); }
  async createCalendarEvent(event: InsertCalendarEvent) { const [e] = await db.insert(calendarEvents).values(event).returning(); return e; }
  async updateCalendarEvent(id: string, data: Partial<CalendarEvent>) { const [e] = await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id)).returning(); return e; }
  async deleteCalendarEvent(id: string) { await db.delete(calendarEvents).where(eq(calendarEvents.id, id)); }

  async getClient(id: string) { const [c] = await db.select().from(clients).where(eq(clients.id, id)); return c; }
  async getClientsByUserId(userId: string) { return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt)); }
  async createClient(client: InsertClient) { const [c] = await db.insert(clients).values(client).returning(); return c; }
  async updateClient(id: string, data: Partial<Client>) { const [c] = await db.update(clients).set(data).where(eq(clients.id, id)).returning(); return c; }
  async deleteClient(id: string) { await db.delete(clients).where(eq(clients.id, id)); }

  async getLead(id: string) { const [l] = await db.select().from(leads).where(eq(leads.id, id)); return l; }
  async getLeadsByUserId(userId: string) { return db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt)); }
  async createLead(lead: InsertLead) { const [l] = await db.insert(leads).values(lead).returning(); return l; }
  async updateLead(id: string, data: Partial<Lead>) { const [l] = await db.update(leads).set(data).where(eq(leads.id, id)).returning(); return l; }
  async deleteLead(id: string) { await db.delete(leads).where(eq(leads.id, id)); }

  async getCustomDomain(id: string) { const [d] = await db.select().from(customDomains).where(eq(customDomains.id, id)); return d; }
  async getCustomDomainsByUserId(userId: string) { return db.select().from(customDomains).where(eq(customDomains.userId, userId)).orderBy(desc(customDomains.createdAt)); }
  async getCustomDomainByDomain(domain: string) { const [d] = await db.select().from(customDomains).where(eq(customDomains.domain, domain)); return d; }
  async createCustomDomain(domain: InsertCustomDomain) { const [d] = await db.insert(customDomains).values(domain).returning(); return d; }
  async updateCustomDomain(id: string, data: Partial<CustomDomain>) { const [d] = await db.update(customDomains).set(data).where(eq(customDomains.id, id)).returning(); return d; }
  async deleteCustomDomain(id: string) { await db.delete(customDomains).where(eq(customDomains.id, id)); }

  // Raffles - using PostgreSQL
  async getRaffle(id: string) { const [r] = await db.select().from(raffles).where(eq(raffles.id, id)); return r; }
  async getRafflesByUserId(userId: string) { return db.select().from(raffles).where(eq(raffles.userId, userId)).orderBy(desc(raffles.createdAt)); }
  async createRaffle(raffle: InsertRaffle) { const [r] = await db.insert(raffles).values(raffle).returning(); return r; }
  async updateRaffle(id: string, data: Partial<Raffle>) { const [r] = await db.update(raffles).set(data).where(eq(raffles.id, id)).returning(); return r; }
  async deleteRaffle(id: string) { await db.delete(raffles).where(eq(raffles.id, id)); }

  async getRaffleTicket(id: string) { const [t] = await db.select().from(raffleTickets).where(eq(raffleTickets.id, id)); return t; }
  async getRaffleTicketsByRaffleId(raffleId: string) { return db.select().from(raffleTickets).where(eq(raffleTickets.raffleId, raffleId)).orderBy(asc(raffleTickets.ticketNumber)); }
  async createRaffleTicket(ticket: InsertRaffleTicket) { const [t] = await db.insert(raffleTickets).values(ticket).returning(); return t; }
  async updateRaffleTicket(id: string, data: Partial<RaffleTicket>) { const [t] = await db.update(raffleTickets).set(data).where(eq(raffleTickets.id, id)).returning(); return t; }
  async deleteRaffleTicket(id: string) { await db.delete(raffleTickets).where(eq(raffleTickets.id, id)); }

  async getRafflePurchase(id: string) { const [p] = await db.select().from(rafflePurchases).where(eq(rafflePurchases.id, id)); return p; }
  async getRafflePurchasesByRaffleId(raffleId: string) { return db.select().from(rafflePurchases).where(eq(rafflePurchases.raffleId, raffleId)).orderBy(desc(rafflePurchases.createdAt)); }
  async createRafflePurchase(purchase: InsertRafflePurchase) { const [p] = await db.insert(rafflePurchases).values(purchase).returning(); return p; }
  async updateRafflePurchase(id: string, data: Partial<RafflePurchase>) { const [p] = await db.update(rafflePurchases).set(data).where(eq(rafflePurchases.id, id)).returning(); return p; }
  async deleteRafflePurchase(id: string) { await db.delete(rafflePurchases).where(eq(rafflePurchases.id, id)); }

  async getRaffleStory(id: string) { const [s] = await db.select().from(raffleStories).where(eq(raffleStories.id, id)); return s; }
  async getRaffleStoriesByRaffleId(raffleId: string) { return db.select().from(raffleStories).where(eq(raffleStories.raffleId, raffleId)).orderBy(asc(raffleStories.order)); }
  async createRaffleStory(story: InsertRaffleStory) { const [s] = await db.insert(raffleStories).values(story).returning(); return s; }
  async updateRaffleStory(id: string, data: Partial<RaffleStory>) { const [s] = await db.update(raffleStories).set(data).where(eq(raffleStories.id, id)).returning(); return s; }
  async deleteRaffleStory(id: string) { await db.delete(raffleStories).where(eq(raffleStories.id, id)); }

  async getRaffleBankAccount(id: string) { const [a] = await db.select().from(raffleBankAccounts).where(eq(raffleBankAccounts.id, id)); return a; }
  async getRaffleBankAccountsByRaffleId(raffleId: string) { return db.select().from(raffleBankAccounts).where(eq(raffleBankAccounts.raffleId, raffleId)); }
  async createRaffleBankAccount(account: InsertRaffleBankAccount) { const [a] = await db.insert(raffleBankAccounts).values(account).returning(); return a; }
  async updateRaffleBankAccount(id: string, data: Partial<RaffleBankAccount>) { const [a] = await db.update(raffleBankAccounts).set(data).where(eq(raffleBankAccounts.id, id)).returning(); return a; }
  async deleteRaffleBankAccount(id: string) { await db.delete(raffleBankAccounts).where(eq(raffleBankAccounts.id, id)); }

  async getRaffleCustomer(id: string) { const [c] = await db.select().from(raffleCustomers).where(eq(raffleCustomers.id, id)); return c; }
  async getRaffleCustomersByRaffleId(raffleId: string) { return db.select().from(raffleCustomers).where(eq(raffleCustomers.raffleId, raffleId)).orderBy(desc(raffleCustomers.createdAt)); }
  async createRaffleCustomer(customer: InsertRaffleCustomer) { const [c] = await db.insert(raffleCustomers).values(customer).returning(); return c; }
  async updateRaffleCustomer(id: string, data: Partial<RaffleCustomer>) { const [c] = await db.update(raffleCustomers).set(data).where(eq(raffleCustomers.id, id)).returning(); return c; }
  async deleteRaffleCustomer(id: string) { await db.delete(raffleCustomers).where(eq(raffleCustomers.id, id)); }

  // Chat Classification
  async getChatClassificationRules(whatsappAccountId: string) { return db.select().from(chatClassificationRules).where(eq(chatClassificationRules.whatsappAccountId, whatsappAccountId)); }
  async createChatClassificationRule(rule: InsertChatClassificationRule) { const [r] = await db.insert(chatClassificationRules).values(rule).returning(); return r; }
  async getChatClassificationResult(conversationId: string) { const [r] = await db.select().from(chatClassificationResults).where(eq(chatClassificationResults.conversationId, conversationId)).orderBy(desc(chatClassificationResults.lastClassifiedAt)).limit(1); return r; }
  async createChatClassificationResult(result: any) { const [r] = await db.insert(chatClassificationResults).values(result).returning(); return r; }
  async updateChatClassificationResult(id: string, data: any) { const [r] = await db.update(chatClassificationResults).set(data).where(eq(chatClassificationResults.id, id)).returning(); return r; }

  // Teams
  async getTeam(id: string): Promise<Team | undefined> { const [t] = await db.select().from(teams).where(eq(teams.id, id)); return t; }
  async getTeamsCreatedByUser(userId: string): Promise<Team[]> {
    return db.select().from(teams).innerJoin(users, eq(teams.userId, users.id)).where(eq(users.id, userId)).then(result => result.map(r => r.teams));
  }
  async getTeamsByUserId(userId: string): Promise<Team[]> {
    // Teams where user is a member
    const memberTeams = await db.select().from(teams).innerJoin(teamMembers, eq(teams.id, teamMembers.teamId)).where(eq(teamMembers.userId, userId));
    return memberTeams.map(mt => mt.teams);
  }
  async createTeam(team: InsertTeam): Promise<Team> { const [t] = await db.insert(teams).values(team).returning(); return t; }
  async updateTeam(id: string, data: Partial<Team>): Promise<Team> { const [t] = await db.update(teams).set(data).where(eq(teams.id, id)).returning(); return t; }
  async deleteTeam(id: string): Promise<void> { await db.delete(teams).where(eq(teams.id, id)); }

  async getTeamMember(id: string): Promise<TeamMember | undefined> { const [m] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)); return m; }
  async getTeamMembersByTeamId(teamId: string): Promise<TeamMember[]> { return db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId)); }
  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> { const [m] = await db.insert(teamMembers).values(member).returning(); return m; }
  async deleteTeamMember(id: string): Promise<void> { await db.delete(teamMembers).where(eq(teamMembers.id, id)); }
  async updateTeamMember(id: string, data: Partial<TeamMember>): Promise<TeamMember> { const [m] = await db.update(teamMembers).set(data).where(eq(teamMembers.id, id)).returning(); return m; }

  // Team Activity Logs
  async createActivityLog(log: InsertTeamActivityLog): Promise<TeamActivityLog> { const [l] = await db.insert(teamActivityLogs).values(log).returning(); return l; }
  async getActivityLogsByTeamId(teamId: string): Promise<TeamActivityLog[]> { return db.select().from(teamActivityLogs).where(eq(teamActivityLogs.teamId, teamId)).orderBy(desc(teamActivityLogs.createdAt)).limit(100); }
  async deleteExpiredActivityLogs(): Promise<void> { await db.delete(teamActivityLogs).where(eq(teamActivityLogs.expiresAt, sql`NOW()`)); }

  // Team Module Access
  async getTeamModuleAccess(teamId: string): Promise<TeamModuleAccess[]> { return db.select().from(teamModuleAccess).where(eq(teamModuleAccess.teamId, teamId)); }
  async getTeamModuleAccessByModule(teamId: string, module: string): Promise<TeamModuleAccess | undefined> { const [m] = await db.select().from(teamModuleAccess).where(and(eq(teamModuleAccess.teamId, teamId), eq(teamModuleAccess.module, module))); return m; }
  async createTeamModuleAccess(access: InsertTeamModuleAccess): Promise<TeamModuleAccess> { const [a] = await db.insert(teamModuleAccess).values(access).returning(); return a; }
  async updateTeamModuleAccess(id: string, data: Partial<TeamModuleAccess>): Promise<TeamModuleAccess> { const [a] = await db.update(teamModuleAccess).set(data).where(eq(teamModuleAccess.id, id)).returning(); return a; }

  // E-Commerce Stores
  async getStore(id: string): Promise<Store | undefined> { const [s] = await db.select().from(stores).where(eq(stores.id, id)); return s; }
  async getStoresByUserId(userId: string): Promise<Store[]> { return db.select().from(stores).where(eq(stores.userId, userId)).orderBy(desc(stores.createdAt)); }
  async getStoreByCustomUrl(customUrl: string): Promise<Store | undefined> { const [s] = await db.select().from(stores).where(eq(stores.customUrl, customUrl)); return s; }
  async createStore(store: InsertStore): Promise<Store> { const [s] = await db.insert(stores).values(store).returning(); return s; }
  async updateStore(id: string, data: Partial<Store>): Promise<Store> { const [s] = await db.update(stores).set(data).where(eq(stores.id, id)).returning(); return s; }
  async deleteStore(id: string): Promise<void> { await db.delete(stores).where(eq(stores.id, id)); }

  // E-Commerce Categories
  async getStoreProductCategory(id: string): Promise<StoreProductCategory | undefined> { const [c] = await db.select().from(storeProductCategories).where(eq(storeProductCategories.id, id)); return c; }
  async getStoreProductCategoriesByStoreId(storeId: string): Promise<StoreProductCategory[]> { return db.select().from(storeProductCategories).where(eq(storeProductCategories.storeId, storeId)).orderBy(asc(storeProductCategories.order)); }
  async createStoreProductCategory(category: InsertStoreProductCategory): Promise<StoreProductCategory> { const [c] = await db.insert(storeProductCategories).values(category).returning(); return c; }
  async updateStoreProductCategory(id: string, data: Partial<StoreProductCategory>): Promise<StoreProductCategory> { const [c] = await db.update(storeProductCategories).set(data).where(eq(storeProductCategories.id, id)).returning(); return c; }
  async deleteStoreProductCategory(id: string): Promise<void> { await db.delete(storeProductCategories).where(eq(storeProductCategories.id, id)); }

  // E-Commerce Subcategories
  async getStoreProductSubcategory(id: string): Promise<StoreProductSubcategory | undefined> { const [s] = await db.select().from(storeProductSubcategories).where(eq(storeProductSubcategories.id, id)); return s; }
  async getStoreProductSubcategoriesByCategoryId(categoryId: string): Promise<StoreProductSubcategory[]> { return db.select().from(storeProductSubcategories).where(eq(storeProductSubcategories.categoryId, categoryId)).orderBy(asc(storeProductSubcategories.order)); }
  async createStoreProductSubcategory(subcategory: InsertStoreProductSubcategory): Promise<StoreProductSubcategory> { const [s] = await db.insert(storeProductSubcategories).values(subcategory).returning(); return s; }
  async updateStoreProductSubcategory(id: string, data: Partial<StoreProductSubcategory>): Promise<StoreProductSubcategory> { const [s] = await db.update(storeProductSubcategories).set(data).where(eq(storeProductSubcategories.id, id)).returning(); return s; }
  async deleteStoreProductSubcategory(id: string): Promise<void> { await db.delete(storeProductSubcategories).where(eq(storeProductSubcategories.id, id)); }

  // E-Commerce Products
  async getStoreProduct(id: string): Promise<StoreProduct | undefined> { const [p] = await db.select().from(storeProducts).where(eq(storeProducts.id, id)); return p; }
  async getStoreProductsByStoreId(storeId: string): Promise<StoreProduct[]> { return db.select().from(storeProducts).where(eq(storeProducts.storeId, storeId)).orderBy(asc(storeProducts.order)); }
  async createStoreProduct(product: InsertStoreProduct): Promise<StoreProduct> { const [p] = await db.insert(storeProducts).values(product).returning(); return p; }
  async updateStoreProduct(id: string, data: Partial<StoreProduct>): Promise<StoreProduct> { const [p] = await db.update(storeProducts).set(data).where(eq(storeProducts.id, id)).returning(); return p; }
  async deleteStoreProduct(id: string): Promise<void> { await db.delete(storeProducts).where(eq(storeProducts.id, id)); }

  // E-Commerce Services
  async getStoreService(id: string): Promise<StoreService | undefined> { const [s] = await db.select().from(storeServices).where(eq(storeServices.id, id)); return s; }
  async getStoreServicesByStoreId(storeId: string): Promise<StoreService[]> { return db.select().from(storeServices).where(eq(storeServices.storeId, storeId)).orderBy(asc(storeServices.order)); }
  async createStoreService(service: InsertStoreService): Promise<StoreService> { const [s] = await db.insert(storeServices).values(service).returning(); return s; }
  async updateStoreService(id: string, data: Partial<StoreService>): Promise<StoreService> { const [s] = await db.update(storeServices).set(data).where(eq(storeServices.id, id)).returning(); return s; }
  async deleteStoreService(id: string): Promise<void> { await db.delete(storeServices).where(eq(storeServices.id, id)); }

  // E-Commerce Coupons
  async getStoreCoupon(id: string): Promise<StoreCoupon | undefined> { const [c] = await db.select().from(storeCoupons).where(eq(storeCoupons.id, id)); return c; }
  async getStoreCouponByCode(storeId: string, code: string): Promise<StoreCoupon | undefined> { const [c] = await db.select().from(storeCoupons).where(and(eq(storeCoupons.storeId, storeId), eq(storeCoupons.code, code))); return c; }
  async getStoreCouponsByStoreId(storeId: string): Promise<StoreCoupon[]> { return db.select().from(storeCoupons).where(eq(storeCoupons.storeId, storeId)).orderBy(desc(storeCoupons.createdAt)); }
  async createStoreCoupon(coupon: InsertStoreCoupon): Promise<StoreCoupon> { const [c] = await db.insert(storeCoupons).values(coupon).returning(); return c; }
  async updateStoreCoupon(id: string, data: Partial<StoreCoupon>): Promise<StoreCoupon> { const [c] = await db.update(storeCoupons).set(data).where(eq(storeCoupons.id, id)).returning(); return c; }
  async deleteStoreCoupon(id: string): Promise<void> { await db.delete(storeCoupons).where(eq(storeCoupons.id, id)); }

  // E-Commerce Orders
  async getStoreOrder(id: string): Promise<StoreOrder | undefined> { const [o] = await db.select().from(storeOrders).where(eq(storeOrders.id, id)); return o; }
  async getStoreOrdersByStoreId(storeId: string): Promise<StoreOrder[]> { return db.select().from(storeOrders).where(eq(storeOrders.storeId, storeId)).orderBy(desc(storeOrders.createdAt)); }
  async getStoreOrdersByClientId(clientId: string): Promise<StoreOrder[]> { return db.select().from(storeOrders).where(eq(storeOrders.clientId, clientId)).orderBy(desc(storeOrders.createdAt)); }
  async createStoreOrder(order: InsertStoreOrder): Promise<StoreOrder> { const [o] = await db.insert(storeOrders).values(order).returning(); return o; }
  async updateStoreOrder(id: string, data: Partial<StoreOrder>): Promise<StoreOrder> { const [o] = await db.update(storeOrders).set(data).where(eq(storeOrders.id, id)).returning(); return o; }
  async deleteStoreOrder(id: string): Promise<void> { await db.delete(storeOrders).where(eq(storeOrders.id, id)); }

  // E-Commerce Order Items
  async getStoreOrderItem(id: string): Promise<StoreOrderItem | undefined> { const [oi] = await db.select().from(storeOrderItems).where(eq(storeOrderItems.id, id)); return oi; }
  async getStoreOrderItemsByOrderId(orderId: string): Promise<StoreOrderItem[]> { return db.select().from(storeOrderItems).where(eq(storeOrderItems.orderId, orderId)); }
  async createStoreOrderItem(item: InsertStoreOrderItem): Promise<StoreOrderItem> { const [oi] = await db.insert(storeOrderItems).values(item).returning(); return oi; }
  async updateStoreOrderItem(id: string, data: Partial<StoreOrderItem>): Promise<StoreOrderItem> { const [oi] = await db.update(storeOrderItems).set(data).where(eq(storeOrderItems.id, id)).returning(); return oi; }
  async deleteStoreOrderItem(id: string): Promise<void> { await db.delete(storeOrderItems).where(eq(storeOrderItems.id, id)); }

  // E-Commerce Custom Domains
  async getStoreCustomDomain(id: string): Promise<StoreCustomDomain | undefined> { const [d] = await db.select().from(storeCustomDomains).where(eq(storeCustomDomains.id, id)); return d; }
  async getStoreCustomDomainsByStoreId(storeId: string): Promise<StoreCustomDomain[]> { return db.select().from(storeCustomDomains).where(eq(storeCustomDomains.storeId, storeId)); }
  async createStoreCustomDomain(domain: InsertStoreCustomDomain): Promise<StoreCustomDomain> { const [d] = await db.insert(storeCustomDomains).values(domain).returning(); return d; }
  async updateStoreCustomDomain(id: string, data: Partial<StoreCustomDomain>): Promise<StoreCustomDomain> { const [d] = await db.update(storeCustomDomains).set(data).where(eq(storeCustomDomains.id, id)).returning(); return d; }
  async deleteStoreCustomDomain(id: string): Promise<void> { await db.delete(storeCustomDomains).where(eq(storeCustomDomains.id, id)); }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> { const [t] = await db.select().from(tasks).where(eq(tasks.id, id)); return t; }
  async getTasksByUserId(userId: string): Promise<Task[]> { return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.order)); }
  async getTasksByStatus(userId: string, status: string): Promise<Task[]> { return db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, status))).orderBy(asc(tasks.order)); }
  async getTasksByConversationId(conversationId: string): Promise<Task[]> { return db.select().from(tasks).where(eq(tasks.conversationId, conversationId)).orderBy(asc(tasks.order)); }
  async getTasksByClientId(clientId: string): Promise<Task[]> { return db.select().from(tasks).where(eq(tasks.clientId, clientId)).orderBy(asc(tasks.order)); }
  async getTasksByLeadId(leadId: string): Promise<Task[]> { return db.select().from(tasks).where(eq(tasks.leadId, leadId)).orderBy(asc(tasks.order)); }
  async createTask(task: InsertTask): Promise<Task> { const [t] = await db.insert(tasks).values(task).returning(); return t; }
  async updateTask(id: string, data: Partial<Task>): Promise<Task> { const [t] = await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id)).returning(); return t; }
  async deleteTask(id: string): Promise<void> { await db.delete(tasks).where(eq(tasks.id, id)); }

  // Notifications
  async getNotification(id: string) { const [n] = await db.select().from(notifications).where(eq(notifications.id, id)); return n; }
  async getNotificationsByUserId(userId: string) { return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)); }
  async getUnviewedNotificationsByUserId(userId: string) { return db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isViewed, false))).orderBy(desc(notifications.createdAt)); }
  async createNotification(notification: InsertNotification) { const [n] = await db.insert(notifications).values(notification).returning(); return n; }
  async markNotificationAsViewed(id: string) { const [n] = await db.update(notifications).set({ isViewed: true }).where(eq(notifications.id, id)).returning(); return n; }
  async deleteNotification(id: string): Promise<void> { await db.delete(notifications).where(eq(notifications.id, id)); }
}

export const storage = new DatabaseStorage();
