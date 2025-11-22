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
  type: text("type").default("general").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  description: text("description"),
  responseMode: text("response_mode").default("rules").notNull(),
  language: text("language").default("es").notNull(),
  useAIResponses: boolean("use_ai_responses").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type ChatbotActivity = typeof chatbotActivities.$inferSelect;
export type InsertChatbotActivity = typeof chatbotActivities.$inferInsert;

export const chatbotRules = pgTable("chatbot_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  trigger: text("trigger").notNull(), // keyword to trigger
  response: text("response").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBaseCategories = pgTable("knowledge_base_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // icon name from lucide-react
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBaseSubcategories = pgTable("knowledge_base_subcategories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => knowledgeBaseCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBaseItems = pgTable("knowledge_base_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => knowledgeBaseCategories.id, { onDelete: "cascade" }),
  subcategoryId: varchar("subcategory_id").references(() => knowledgeBaseSubcategories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  keywords: text("keywords").array().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  views: integer("views").default(0).notNull(),
  order: integer("order").default(0).notNull(),
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

// CRM Module - Clients
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country"),
  notes: text("notes"),
  status: text("status").notNull().default("active"), // 'active' | 'inactive' | 'potential'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CRM Module - Leads
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  source: text("source"), // 'website' | 'referral' | 'whatsapp' | 'other'
  notes: text("notes"),
  status: text("status").notNull().default("new"), // 'new' | 'contacted' | 'qualified' | 'lost'
  value: integer("value"), // lead value in cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Calendar Module
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"), // WhatsApp phone number
  status: text("status").notNull().default("pending"), // 'pending' | 'confirmed' | 'cancelled'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveyQuestions = pgTable("survey_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  type: text("type").default("text").notNull(), // 'text' | 'date' | 'number' | 'textarea'
  isRequired: boolean("is_required").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveyResponses = pgTable("survey_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  respondentName: text("respondent_name"),
  respondentWhatsapp: text("respondent_whatsapp"),
  respondentCountry: text("respondent_country"),
  respondentCity: text("respondent_city"),
  answers: jsonb("answers").default({}).notNull(), // { questionId: answer }
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

export const chatbotAIProviders = pgTable("chatbot_ai_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'openai' | 'gemini' | 'other'
  apiKey: text("api_key").notNull(), // Encrypted in production
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChatbotAIProvider = typeof chatbotAIProviders.$inferSelect;
export type InsertChatbotAIProvider = typeof chatbotAIProviders.$inferInsert;

export const chatbotActivities = pgTable("chatbot_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'incoming_message' | 'automated_response' | 'rule_matched' | 'knowledge_matched'
  contactNumber: text("contact_number").notNull(),
  messageContent: text("message_content"),
  responseContent: text("response_content"),
  matchedRule: text("matched_rule"),
  matchedKnowledge: text("matched_knowledge"),
  status: text("status").notNull().default("success"), // 'success' | 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Banking Module
export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountName: text("account_name").notNull(), // e.g., "Cuenta Corriente Empresa", "Ahorro Personal"
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name").notNull(),
  accountType: text("account_type").notNull(), // 'corriente' | 'ahorro' | 'nomina'
  initialBalance: integer("initial_balance").default(0).notNull(), // stored in cents
  currency: text("currency").default("MXN").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bankTransactions = pgTable("bank_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => bankAccounts.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'deposito' | 'gasto' | 'transferencia'
  category: text("category").notNull(), // e.g., 'salarios', 'servicios', 'utiles', 'venta', etc.
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // stored in cents
  date: timestamp("date").notNull(),
  reference: text("reference"), // invoice number, check number, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  whatsappAccounts: many(whatsappAccounts),
  bankAccounts: many(bankAccounts),
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
  categories: many(knowledgeBaseCategories),
  items: many(knowledgeBaseItems),
  stats: many(chatbotStats),
}));

export const chatbotRulesRelations = relations(chatbotRules, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [chatbotRules.chatbotId],
    references: [chatbots.id],
  }),
}));

export const knowledgeBaseCategoriesRelations = relations(knowledgeBaseCategories, ({ one, many }) => ({
  chatbot: one(chatbots, {
    fields: [knowledgeBaseCategories.chatbotId],
    references: [chatbots.id],
  }),
  subcategories: many(knowledgeBaseSubcategories),
  items: many(knowledgeBaseItems),
}));

export const knowledgeBaseSubcategoriesRelations = relations(knowledgeBaseSubcategories, ({ one, many }) => ({
  category: one(knowledgeBaseCategories, {
    fields: [knowledgeBaseSubcategories.categoryId],
    references: [knowledgeBaseCategories.id],
  }),
  items: many(knowledgeBaseItems),
}));

export const knowledgeBaseItemsRelations = relations(knowledgeBaseItems, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [knowledgeBaseItems.chatbotId],
    references: [chatbots.id],
  }),
  category: one(knowledgeBaseCategories, {
    fields: [knowledgeBaseItems.categoryId],
    references: [knowledgeBaseCategories.id],
  }),
  subcategory: one(knowledgeBaseSubcategories, {
    fields: [knowledgeBaseItems.subcategoryId],
    references: [knowledgeBaseSubcategories.id],
  }),
}));

export const knowledgeBaseRelations = relations(knowledgeBase, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [knowledgeBase.chatbotId],
    references: [chatbots.id],
  }),
}));

export const chatbotActivitiesRelations = relations(chatbotActivities, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [chatbotActivities.chatbotId],
    references: [chatbots.id],
  }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [bankAccounts.userId],
    references: [users.id],
  }),
  transactions: many(bankTransactions),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  account: one(bankAccounts, {
    fields: [bankTransactions.accountId],
    references: [bankAccounts.id],
  }),
}));

export const facebookAccounts = pgTable("facebook_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  password: text("password").notNull(),
  accountName: text("account_name").notNull(),
  facebookId: text("facebook_id"),
  profilePicture: text("profile_picture"),
  status: text("status").notNull().default("disconnected"),
  sessionToken: text("session_token"),
  sessionExpiry: timestamp("session_expiry"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const facebookAccountsRelations = relations(facebookAccounts, ({ one }) => ({
  user: one(users, {
    fields: [facebookAccounts.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
}));

export const chatbotStatsRelations = relations(chatbotStats, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [chatbotStats.chatbotId],
    references: [chatbots.id],
  }),
}));

// CRM Client Schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "potential"]).default("active"),
});

// Insert schemas
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
  type: z.enum(["general", "ventas", "soporte", "asistencia", "atencion", "marketing", "recursos_humanos"]).default("general"),
});

export const insertChatbotRuleSchema = createInsertSchema(chatbotRules).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseCategorySchema = createInsertSchema(knowledgeBaseCategories).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseSubcategorySchema = createInsertSchema(knowledgeBaseSubcategories).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseItemSchema = createInsertSchema(knowledgeBaseItems).omit({
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

// Calendar Schemas
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true });

// Survey Schemas
export const insertSurveySchema = createInsertSchema(surveys).omit({ id: true, createdAt: true });
export const insertSurveyQuestionSchema = createInsertSchema(surveyQuestions).omit({ id: true, createdAt: true });
export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({ id: true, createdAt: true });

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

export type InsertKnowledgeBaseCategory = z.infer<typeof insertKnowledgeBaseCategorySchema>;
export type KnowledgeBaseCategory = typeof knowledgeBaseCategories.$inferSelect;

export type InsertKnowledgeBaseSubcategory = z.infer<typeof insertKnowledgeBaseSubcategorySchema>;
export type KnowledgeBaseSubcategory = typeof knowledgeBaseSubcategories.$inferSelect;

export type InsertKnowledgeBaseItem = z.infer<typeof insertKnowledgeBaseItemSchema>;
export type KnowledgeBaseItem = typeof knowledgeBaseItems.$inferSelect;

export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;

export type InsertChatbotStats = z.infer<typeof insertChatbotStatsSchema>;
export type ChatbotStats = typeof chatbotStats.$inferSelect;

export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type Survey = typeof surveys.$inferSelect;

export type InsertSurveyQuestion = z.infer<typeof insertSurveyQuestionSchema>;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;

export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;
export type SurveyResponse = typeof surveyResponses.$inferSelect;

// Bank Schemas
export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({
  id: true,
  createdAt: true,
});

// Bank Types
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type BankTransaction = typeof bankTransactions.$inferSelect;

// Facebook Schemas
export const insertFacebookAccountSchema = createInsertSchema(facebookAccounts).omit({
  id: true,
  createdAt: true,
  facebookId: true,
  profilePicture: true,
  sessionToken: true,
  sessionExpiry: true,
  lastLogin: true,
  status: true,
});

export type InsertFacebookAccount = z.infer<typeof insertFacebookAccountSchema>;
export type FacebookAccount = typeof facebookAccounts.$inferSelect;

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Client Types
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Lead Schemas
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Lead Types
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
