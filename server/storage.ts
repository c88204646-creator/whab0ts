// Referencing javascript_database blueprint
import { 
  users, whatsappAccounts, conversations, messages, chatbots, chatbotRules, knowledgeBaseCategories, knowledgeBaseSubcategories, knowledgeBaseItems, surveys, surveyQuestions, surveyResponses, chatbotActivities, chatbotStats, chatbotAIProviders, bankAccounts, bankTransactions, facebookAccounts, calendarEvents, clients, leads, customDomains,
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
  async getMessagesByConversationId(conversationId: string) { return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt)); }
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

  // In-memory storage for raffles
  private raffles = new Map<string, Raffle>();
  private raffleTickets = new Map<string, RaffleTicket>();
  private rafflePurchases = new Map<string, RafflePurchase>();
  private raffleStories = new Map<string, RaffleStory>();
  private raffleBankAccounts = new Map<string, RaffleBankAccount>();

  async getRaffle(id: string) { return this.raffles.get(id); }
  async getRafflesByUserId(userId: string) { return Array.from(this.raffles.values()).filter(r => r.userId === userId).sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)); }
  async createRaffle(raffle: InsertRaffle) { const r = { ...raffle, id: Math.random().toString(36).substr(2, 9), createdAt: new Date() } as Raffle; this.raffles.set(r.id, r); return r; }
  async updateRaffle(id: string, data: Partial<Raffle>) { const r = this.raffles.get(id); if (r) { const updated = { ...r, ...data }; this.raffles.set(id, updated); return updated; } throw new Error('Raffle not found'); }
  async deleteRaffle(id: string) { this.raffles.delete(id); }

  async getRaffleTicketsByRaffleId(raffleId: string) { return Array.from(this.raffleTickets.values()).filter(t => t.raffleId === raffleId).sort((a, b) => (a.number || 0) - (b.number || 0)); }

  async getRafflePurchasesByRaffleId(raffleId: string) { return Array.from(this.rafflePurchases.values()).filter(p => p.raffleId === raffleId).sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)); }
  async createRafflePurchase(purchase: InsertRafflePurchase) { const p = { ...purchase, id: Math.random().toString(36).substr(2, 9), createdAt: new Date() } as RafflePurchase; this.rafflePurchases.set(p.id, p); return p; }

  async getRaffleStoriesByRaffleId(raffleId: string) { return Array.from(this.raffleStories.values()).filter(s => s.raffleId === raffleId).sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)); }
  async createRaffleStory(story: InsertRaffleStory) { const s = { ...story, id: Math.random().toString(36).substr(2, 9), createdAt: new Date() } as RaffleStory; this.raffleStories.set(s.id, s); return s; }

  async getRaffleBankAccountsByRaffleId(raffleId: string) { return Array.from(this.raffleBankAccounts.values()).filter(a => a.raffleId === raffleId); }
  async createRaffleBankAccount(account: InsertRaffleBankAccount) { const a = { ...account, id: Math.random().toString(36).substr(2, 9) } as RaffleBankAccount; this.raffleBankAccounts.set(a.id, a); return a; }
}

export const storage = new DatabaseStorage();
