// Referencing javascript_database blueprint
import { 
  users, whatsappAccounts, conversations, messages, chatbots, chatbotRules, knowledgeBaseCategories, knowledgeBaseSubcategories, knowledgeBaseItems, surveys, surveyQuestions, surveyResponses, chatbotActivities,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

  // Chatbot Activities
  getChatbotActivities(chatbotId: string, limit?: number): Promise<ChatbotActivity[]>;
  createChatbotActivity(activity: InsertChatbotActivity): Promise<ChatbotActivity>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // WhatsApp Accounts
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
    const [updated] = await db
      .update(whatsappAccounts)
      .set(data)
      .where(eq(whatsappAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteWhatsappAccount(id: string): Promise<void> {
    await db.delete(whatsappAccounts).where(eq(whatsappAccounts.id, id));
  }

  // Conversations
  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationsByAccountId(accountId: string): Promise<Conversation[]> {
    return db.select()
      .from(conversations)
      .where(eq(conversations.whatsappAccountId, accountId))
      .orderBy(desc(conversations.lastMessageTime));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set(data)
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Chatbots
  async getChatbot(id: string): Promise<Chatbot | undefined> {
    const [chatbot] = await db.select().from(chatbots).where(eq(chatbots.id, id));
    return chatbot || undefined;
  }

  async getChatbotsByUserId(userId: string): Promise<Chatbot[]> {
    return db.select().from(chatbots).where(eq(chatbots.userId, userId));
  }

  async getChatbotsByAccountId(accountId: string): Promise<Chatbot[]> {
    return db.select().from(chatbots).where(eq(chatbots.whatsappAccountId, accountId));
  }

  async createChatbot(chatbot: InsertChatbot): Promise<Chatbot> {
    const [newChatbot] = await db.insert(chatbots).values(chatbot).returning();
    return newChatbot;
  }

  async updateChatbot(id: string, data: Partial<Chatbot>): Promise<Chatbot> {
    const [updated] = await db
      .update(chatbots)
      .set(data)
      .where(eq(chatbots.id, id))
      .returning();
    return updated;
  }

  async deleteChatbot(id: string): Promise<void> {
    await db.delete(chatbots).where(eq(chatbots.id, id));
  }

  // Chatbot Rules
  async getChatbotRule(id: string): Promise<ChatbotRule | undefined> {
    const [rule] = await db.select().from(chatbotRules).where(eq(chatbotRules.id, id));
    return rule || undefined;
  }

  async getChatbotRulesByChatbotId(chatbotId: string): Promise<ChatbotRule[]> {
    return db.select()
      .from(chatbotRules)
      .where(eq(chatbotRules.chatbotId, chatbotId))
      .orderBy(desc(chatbotRules.priority));
  }

  async createChatbotRule(rule: InsertChatbotRule): Promise<ChatbotRule> {
    const [newRule] = await db.insert(chatbotRules).values(rule).returning();
    return newRule;
  }

  async updateChatbotRule(id: string, data: Partial<ChatbotRule>): Promise<ChatbotRule> {
    const [updated] = await db
      .update(chatbotRules)
      .set(data)
      .where(eq(chatbotRules.id, id))
      .returning();
    return updated;
  }

  async deleteChatbotRule(id: string): Promise<void> {
    await db.delete(chatbotRules).where(eq(chatbotRules.id, id));
  }

  // Knowledge Base Categories
  async getKnowledgeBaseCategory(id: string): Promise<KnowledgeBaseCategory | undefined> {
    const [category] = await db.select().from(knowledgeBaseCategories).where(eq(knowledgeBaseCategories.id, id));
    return category || undefined;
  }

  async getKnowledgeBaseCategoriesByChatbotId(chatbotId: string): Promise<KnowledgeBaseCategory[]> {
    return db.select()
      .from(knowledgeBaseCategories)
      .where(eq(knowledgeBaseCategories.chatbotId, chatbotId))
      .orderBy(knowledgeBaseCategories.order);
  }

  async createKnowledgeBaseCategory(category: InsertKnowledgeBaseCategory): Promise<KnowledgeBaseCategory> {
    const [newCategory] = await db.insert(knowledgeBaseCategories).values(category).returning();
    return newCategory;
  }

  async updateKnowledgeBaseCategory(id: string, data: Partial<KnowledgeBaseCategory>): Promise<KnowledgeBaseCategory> {
    const [updated] = await db
      .update(knowledgeBaseCategories)
      .set(data)
      .where(eq(knowledgeBaseCategories.id, id))
      .returning();
    return updated;
  }

  async deleteKnowledgeBaseCategory(id: string): Promise<void> {
    await db.delete(knowledgeBaseCategories).where(eq(knowledgeBaseCategories.id, id));
  }

  // Knowledge Base Subcategories
  async getKnowledgeBaseSubcategory(id: string): Promise<KnowledgeBaseSubcategory | undefined> {
    const [subcategory] = await db.select().from(knowledgeBaseSubcategories).where(eq(knowledgeBaseSubcategories.id, id));
    return subcategory || undefined;
  }

  async getKnowledgeBaseSubcategoriesByCategoryId(categoryId: string): Promise<KnowledgeBaseSubcategory[]> {
    return db.select()
      .from(knowledgeBaseSubcategories)
      .where(eq(knowledgeBaseSubcategories.categoryId, categoryId))
      .orderBy(knowledgeBaseSubcategories.order);
  }

  async createKnowledgeBaseSubcategory(subcategory: InsertKnowledgeBaseSubcategory): Promise<KnowledgeBaseSubcategory> {
    const [newSubcategory] = await db.insert(knowledgeBaseSubcategories).values(subcategory).returning();
    return newSubcategory;
  }

  async updateKnowledgeBaseSubcategory(id: string, data: Partial<KnowledgeBaseSubcategory>): Promise<KnowledgeBaseSubcategory> {
    const [updated] = await db
      .update(knowledgeBaseSubcategories)
      .set(data)
      .where(eq(knowledgeBaseSubcategories.id, id))
      .returning();
    return updated;
  }

  async deleteKnowledgeBaseSubcategory(id: string): Promise<void> {
    await db.delete(knowledgeBaseSubcategories).where(eq(knowledgeBaseSubcategories.id, id));
  }

  // Knowledge Base Items
  async getKnowledgeBaseItem(id: string): Promise<KnowledgeBaseItem | undefined> {
    const [item] = await db.select().from(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, id));
    return item || undefined;
  }

  async getKnowledgeBaseItemsByChatbotId(chatbotId: string): Promise<KnowledgeBaseItem[]> {
    return db.select()
      .from(knowledgeBaseItems)
      .where(eq(knowledgeBaseItems.chatbotId, chatbotId))
      .orderBy(knowledgeBaseItems.order);
  }

  async getKnowledgeBaseItemsByCategoryId(categoryId: string): Promise<KnowledgeBaseItem[]> {
    return db.select()
      .from(knowledgeBaseItems)
      .where(eq(knowledgeBaseItems.categoryId, categoryId))
      .orderBy(knowledgeBaseItems.order);
  }

  async createKnowledgeBaseItem(item: InsertKnowledgeBaseItem): Promise<KnowledgeBaseItem> {
    const [newItem] = await db.insert(knowledgeBaseItems).values(item).returning();
    return newItem;
  }

  async updateKnowledgeBaseItem(id: string, data: Partial<KnowledgeBaseItem>): Promise<KnowledgeBaseItem> {
    const [updated] = await db
      .update(knowledgeBaseItems)
      .set(data)
      .where(eq(knowledgeBaseItems.id, id))
      .returning();
    return updated;
  }

  async deleteKnowledgeBaseItem(id: string): Promise<void> {
    await db.delete(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, id));
  }

  // Surveys
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

  // Survey Questions
  async getSurveyQuestion(id: string): Promise<SurveyQuestion | undefined> {
    const [question] = await db.select().from(surveyQuestions).where(eq(surveyQuestions.id, id));
    return question || undefined;
  }

  async getSurveyQuestionsBySurveyId(surveyId: string): Promise<SurveyQuestion[]> {
    return db.select().from(surveyQuestions).where(eq(surveyQuestions.surveyId, surveyId)).orderBy(surveyQuestions.order);
  }

  async createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion> {
    const [newQuestion] = await db.insert(surveyQuestions).values(question).returning();
    return newQuestion;
  }

  async updateSurveyQuestion(id: string, data: Partial<SurveyQuestion>): Promise<SurveyQuestion> {
    const [updated] = await db.update(surveyQuestions).set(data).where(eq(surveyQuestions.id, id)).returning();
    return updated;
  }

  async deleteSurveyQuestion(id: string): Promise<void> {
    await db.delete(surveyQuestions).where(eq(surveyQuestions.id, id));
  }

  // Survey Responses
  async getSurveyResponse(id: string): Promise<SurveyResponse | undefined> {
    const [response] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, id));
    return response || undefined;
  }

  async getSurveyResponsesBySurveyId(surveyId: string): Promise<SurveyResponse[]> {
    return db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId)).orderBy(desc(surveyResponses.createdAt));
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [newResponse] = await db.insert(surveyResponses).values(response).returning();
    return newResponse;
  }

  // Chatbot Activities
  async getChatbotActivities(chatbotId: string, limit = 50): Promise<ChatbotActivity[]> {
    return db.select()
      .from(chatbotActivities)
      .where(eq(chatbotActivities.chatbotId, chatbotId))
      .orderBy(desc(chatbotActivities.createdAt))
      .limit(limit);
  }

  async createChatbotActivity(activity: InsertChatbotActivity): Promise<ChatbotActivity> {
    const [newActivity] = await db.insert(chatbotActivities).values(activity).returning();
    return newActivity;
  }
}

export const storage = new DatabaseStorage();
