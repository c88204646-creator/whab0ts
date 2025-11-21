import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const whatsappAccounts = pgTable("whatsapp_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceName: text("device_name").notNull(),
  accountType: text("account_type").notNull(), // 'normal' | 'business'
  phoneNumber: text("phone_number"),
  status: text("status").notNull().default("disconnected"), // 'connected' | 'disconnected' | 'pending'
  qrCode: text("qr_code"),
  authState: jsonb("auth_state"), // Baileys auth state
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  whatsappAccountId: varchar("whatsapp_account_id").notNull().references(() => whatsappAccounts.id, { onDelete: "cascade" }),
  contactNumber: text("contact_number").notNull(),
  contactName: text("contact_name"),
  lastMessageText: text("last_message_text"),
  lastMessageTime: timestamp("last_message_time"),
  unreadCount: integer("unread_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  messageId: text("message_id").notNull(), // WhatsApp message ID
  direction: text("direction").notNull(), // 'incoming' | 'outgoing'
  content: text("content").notNull(),
  mediaType: text("media_type"), // 'text' | 'image' | 'video' | 'audio' | 'document'
  mediaUrl: text("media_url"),
  status: text("status").notNull().default("sent"), // 'sent' | 'delivered' | 'read'
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatbots = pgTable("chatbots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  whatsappAccountId: varchar("whatsapp_account_id").references(() => whatsappAccounts.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  welcomeMessage: text("welcome_message"),
  description: text("description"),
  responseMode: text("response_mode").default("rules").notNull(),
  language: text("language").default("es").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatbotRules = pgTable("chatbot_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  trigger: text("trigger").notNull(), // keyword to trigger
  response: text("response").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  tags: text("tags").array().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  views: integer("views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatbotStats = pgTable("chatbot_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  totalMessages: integer("total_messages").default(0).notNull(),
  automatedResponses: integer("automated_responses").default(0).notNull(),
  manualResponses: integer("manual_responses").default(0).notNull(),
  avgResponseTime: integer("avg_response_time").default(0).notNull(), // in milliseconds
  satisfactionRate: integer("satisfaction_rate").default(0).notNull(), // 0-100
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  whatsappAccounts: many(whatsappAccounts),
}));

export const whatsappAccountsRelations = relations(whatsappAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [whatsappAccounts.userId],
    references: [users.id],
  }),
  conversations: many(conversations),
  chatbots: many(chatbots),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  whatsappAccount: one(whatsappAccounts, {
    fields: [conversations.whatsappAccountId],
    references: [whatsappAccounts.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const chatbotsRelations = relations(chatbots, ({ one, many }) => ({
  user: one(users, {
    fields: [chatbots.userId],
    references: [users.id],
  }),
  whatsappAccount: one(whatsappAccounts, {
    fields: [chatbots.whatsappAccountId],
    references: [whatsappAccounts.id],
  }),
  rules: many(chatbotRules),
  knowledgeBase: many(knowledgeBase),
  stats: many(chatbotStats),
}));

export const chatbotRulesRelations = relations(chatbotRules, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [chatbotRules.chatbotId],
    references: [chatbots.id],
  }),
}));

export const knowledgeBaseRelations = relations(knowledgeBase, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [knowledgeBase.chatbotId],
    references: [chatbots.id],
  }),
}));

export const chatbotStatsRelations = relations(chatbotStats, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [chatbotStats.chatbotId],
    references: [chatbots.id],
  }),
}));

// Insert schemas - properly excluding server-generated fields
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
}).omit({
  id: true,
  createdAt: true,
});

export const insertWhatsappAccountSchema = createInsertSchema(whatsappAccounts).omit({
  id: true,
  createdAt: true,
  lastActive: true,
  phoneNumber: true,
  qrCode: true,
  authState: true,
  status: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertChatbotSchema = createInsertSchema(chatbots).omit({
  id: true,
  createdAt: true,
}).extend({
  whatsappAccountId: z.string().optional().nullable(),
});

export const insertChatbotRuleSchema = createInsertSchema(chatbotRules).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdAt: true,
  views: true,
});

export const insertChatbotStatsSchema = createInsertSchema(chatbotStats).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWhatsappAccount = z.infer<typeof insertWhatsappAccountSchema>;
export type WhatsappAccount = typeof whatsappAccounts.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type Chatbot = typeof chatbots.$inferSelect;

export type InsertChatbotRule = z.infer<typeof insertChatbotRuleSchema>;
export type ChatbotRule = typeof chatbotRules.$inferSelect;

export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;

export type InsertChatbotStats = z.infer<typeof insertChatbotStatsSchema>;
export type ChatbotStats = typeof chatbotStats.$inferSelect;
