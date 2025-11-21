// Referencing javascript_database blueprint
import { 
  users, whatsappAccounts, conversations, messages, chatbots, chatbotRules,
  type User, type InsertUser,
  type WhatsappAccount, type InsertWhatsappAccount,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Chatbot, type InsertChatbot,
  type ChatbotRule, type InsertChatbotRule,
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
}

export const storage = new DatabaseStorage();
