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
  isActive: boolean("is_active").default(true).notNull(), // Allow pausing without disconnecting
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
  category: text("category").default("general"), // 'general' | 'sales' | 'support' | 'vip' | 'other'
  tags: text("tags").array().default([]).notNull(), // Array of tag strings
  priority: text("priority").default("normal"), // 'low' | 'normal' | 'high' | 'urgent'
  status: text("status").default("active"), // 'active' | 'archived' | 'spam' | 'blocked'
  notes: text("notes"), // Internal notes about the conversation
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
  transcription: text("transcription"), // Audio transcription using Whisper
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
  // Anti-detection settings
  minResponseDelay: integer("min_response_delay").default(2000).notNull(), // milliseconds - min delay between messages (default 2s)
  maxResponseDelay: integer("max_response_delay").default(8000).notNull(), // milliseconds - max delay between messages (default 8s)
  dailyMessageLimit: integer("daily_message_limit").default(100).notNull(), // max messages per day per contact (0 = unlimited)
  respectUserTypingTime: boolean("respect_user_typing_time").default(true).notNull(), // simulate typing based on message length
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
  currency: text("currency").notNull().default("USD"), // 'MXN' | 'USD' | 'ARS' | 'EUR' | 'COP' | 'CLP' | 'PEN' | 'BRL'
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
  currency: text("currency").notNull().default("USD"), // 'MXN' | 'USD' | 'ARS' | 'EUR' | 'COP' | 'CLP' | 'PEN' | 'BRL'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Calendar Module
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"), // WhatsApp phone number
  email: text("email"), // Email del cliente
  status: text("status").notNull().default("pending"), // 'pending' | 'confirmed' | 'cancelled'
  isActive: boolean("is_active").default(true).notNull(),
  isPublicBooking: boolean("is_public_booking").default(false).notNull(), // true if created from public booking link
  createdByUserId: varchar("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  lastModifiedByUserId: varchar("last_modified_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar Event Status Changes - Audit Log
export const calendarEventChanges = pgTable("calendar_event_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => calendarEvents.id, { onDelete: "cascade" }),
  oldStatus: text("old_status").notNull(),
  newStatus: text("new_status").notNull(),
  changedByUserId: varchar("changed_by_user_id").notNull().references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar Availability Configuration
export const calendarAvailability = pgTable("calendar_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // "09:00" format
  endTime: text("end_time").notNull(), // "17:00" format
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar Configuration
export const calendarConfig = pgTable("calendar_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPublicBookingEnabled: boolean("is_public_booking_enabled").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  eventDurationMinutes: integer("event_duration_minutes").default(60).notNull(),
  publicShareToken: text("public_share_token").notNull().unique(),
  businessName: text("business_name"),
  businessDescription: text("business_description"),
  timeZone: text("time_zone").default("America/Mexico_City").notNull(), // IANA timezone
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Calendar Link Statistics
export const calendarLinkStats = pgTable("calendar_link_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  publicShareToken: text("public_share_token").notNull().unique(),
  timesShared: integer("times_shared").default(0).notNull(),
  timesVisited: integer("times_visited").default(0).notNull(),
  bookingsCompleted: integer("bookings_completed").default(0).notNull(),
  totalMinutesBooked: integer("total_minutes_booked").default(0).notNull(),
  averageMinutesPerBooking: integer("average_minutes_per_booking").default(0).notNull(),
  peakBookingDay: text("peak_booking_day"), // 'Mon', 'Tue', etc
  returnVisitorCount: integer("return_visitor_count").default(0).notNull(),
  conversionRate: integer("conversion_rate").default(0).notNull(), // percentage 0-100
  lastSharedAt: timestamp("last_shared_at"),
  lastVisitedAt: timestamp("last_visited_at"),
  lastBookedAt: timestamp("last_booked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Calendar Analytics History - Snapshots for graphs (preserved before deleting old events)
export const calendarAnalyticsHistory = pgTable("calendar_analytics_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publicShareToken: text("public_share_token").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  visitas: integer("visitas").default(0).notNull(),
  reservas: integer("reservas").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  whatsappConfig: jsonb("whatsapp_config").default({}), // { enabled, senderId, message }
  customDomainId: varchar("custom_domain_id").references(() => customDomains.id, { onDelete: "set null" }), // Link to custom domain
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Custom Domains for Surveys
export const customDomains = pgTable("custom_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").notNull().unique(), // e.g., "encuestas.miempresa.com"
  status: text("status").notNull().default("pending"), // 'pending' | 'verified' | 'active' | 'failed'
  verificationToken: text("verification_token"), // Token for DNS verification
  lastVerifiedAt: timestamp("last_verified_at"),
  isActive: boolean("is_active").default(false).notNull(),
  description: text("description"),
  // Email configuration (NEW FIELDS - require BD migration)
  linkedEmail: text("linked_email"), // Email associated with this domain
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: text("email_verification_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveyQuestions = pgTable("survey_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  type: text("type").default("text").notNull(), // 'text' | 'textarea' | 'number' | 'email' | 'date' | 'select' | 'checkbox' | 'radio'
  isRequired: boolean("is_required").default(true).notNull(),
  options: jsonb("options").default([]).notNull(), // Array of options for select/checkbox/radio
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

// AI Providers - User-level configuration
export const aiProviders = pgTable("ai_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Mi OpenAI", "Gemini Producción"
  provider: text("provider").notNull(), // 'openai' | 'gemini' | 'anthropic' | 'other'
  apiKey: text("api_key").notNull(), // Encrypted in production
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AIProvider = typeof aiProviders.$inferSelect;
export type InsertAIProvider = typeof aiProviders.$inferInsert;

export const chatbotAIProviders = pgTable("chatbot_ai_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  aiProviderId: varchar("ai_provider_id").notNull().references(() => aiProviders.id, { onDelete: "cascade" }),
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
  aiProviders: many(aiProviders),
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
  client: one(clients, {
    fields: [calendarEvents.clientId],
    references: [clients.id],
  }),
  lead: one(leads, {
    fields: [calendarEvents.leadId],
    references: [leads.id],
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
  currency: z.string().default("MXN"),
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
}).extend({
  category: z.enum(["general", "sales", "support", "vip", "other"]).default("general"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  status: z.enum(["active", "archived", "spam", "blocked"]).default("active"),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// Type for updating conversation CRM fields
export const updateConversationCRMSchema = z.object({
  category: z.enum(["general", "sales", "support", "vip", "other"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  status: z.enum(["active", "archived", "spam", "blocked"]).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
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

// AI Provider Schemas
export const insertAIProviderSchema = createInsertSchema(aiProviders).omit({
  id: true,
  createdAt: true,
});

export type InsertAIProvider = z.infer<typeof insertAIProviderSchema>;

// Calendar Schemas
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true }).extend({
  createdByUserId: z.string().optional(),
  lastModifiedByUserId: z.string().optional(),
});

// Survey Schemas
export const insertSurveySchema = createInsertSchema(surveys).omit({ id: true, createdAt: true }).extend({
  whatsappConfig: z.object({
    enabled: z.boolean().optional(),
    senderId: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
});
export const insertSurveyQuestionSchema = createInsertSchema(surveyQuestions).omit({ id: true, createdAt: true });
export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({ id: true, createdAt: true });

// Custom Domain Schemas
export const insertCustomDomainSchema = createInsertSchema(customDomains).omit({ 
  id: true, 
  createdAt: true,
  verificationToken: true,
  lastVerifiedAt: true,
  emailVerificationToken: true,
  emailVerified: true,
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

export type InsertCustomDomain = z.infer<typeof insertCustomDomainSchema>;
export type CustomDomain = typeof customDomains.$inferSelect;

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
  sessionExpiry: true,
});

export type InsertFacebookAccount = z.infer<typeof insertFacebookAccountSchema>;
export type FacebookAccount = typeof facebookAccounts.$inferSelect;

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Calendar Availability Schemas
export const insertCalendarAvailabilitySchema = createInsertSchema(calendarAvailability).omit({
  id: true,
  createdAt: true,
});

export type InsertCalendarAvailability = z.infer<typeof insertCalendarAvailabilitySchema>;
export type CalendarAvailability = typeof calendarAvailability.$inferSelect;

// Calendar Config Schemas
export const insertCalendarConfigSchema = createInsertSchema(calendarConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publicShareToken: true,
});

export type InsertCalendarConfig = z.infer<typeof insertCalendarConfigSchema>;
export type CalendarConfig = typeof calendarConfig.$inferSelect;

// Client Types
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Lead Schemas
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "lost"]).default("new"),
  value: z.number().optional(),
  currency: z.string().default("MXN"),
});

// Lead Types
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;


// Web Chat Module (Live Chat Widget - Sales Funnel)
export const webChats = pgTable("web_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Widget name (e.g., "Lead Capture - Products")
  title: text("title").notNull().default("¿Cómo podemos ayudarte?"), // Welcome message title
  description: text("description").default("Somos especialistas en soluciones de negocio. Completa el formulario y nos pondremos en contacto."), // Welcome message
  websiteUrl: text("website_url"), // Domain where the chat will be embedded
  embedCode: text("embed_code"), // Auto-generated embed code
  isActive: boolean("is_active").default(true).notNull(),
  customColor: text("custom_color").default("#3b82f6").notNull(), // Primary color for widget
  position: text("position").default("bottom-right").notNull(), // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  // Sales funnel fields
  productIds: text("product_ids").array().default([]).notNull(), // Associated products/services
  acceptingBookings: boolean("accepting_bookings").default(true).notNull(), // Whether to accept appointment bookings
  availableHours: text("available_hours"), // JSON: {monday: [{start: "09:00", end: "17:00"}], ...}
  autoResponseTime: integer("auto_response_time").default(3000).notNull(), // Auto-response delay (ms)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const webChatSessions = pgTable("web_chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webChatId: varchar("web_chat_id").notNull().references(() => webChats.id, { onDelete: "cascade" }),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  visitorPhone: text("visitor_phone"),
  visitorIp: text("visitor_ip"),
  userAgent: text("user_agent"),
  interestedProducts: text("interested_products").array().default([]).notNull(), // Products visitor is interested in
  appointmentDate: timestamp("appointment_date"), // Scheduled appointment time
  appointmentStatus: text("appointment_status").default("pending"), // 'pending' | 'confirmed' | 'cancelled'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webChatMessages = pgTable("web_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => webChatSessions.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  direction: text("direction").notNull(), // 'incoming' | 'outgoing'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Web Chat Schemas
export const insertWebChatSchema = createInsertSchema(webChats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  embedCode: true,
});

export const insertWebChatSessionSchema = createInsertSchema(webChatSessions).omit({
  id: true,
  createdAt: true,
});

export const insertWebChatMessageSchema = createInsertSchema(webChatMessages).omit({
  id: true,
  createdAt: true,
});

// Web Chat Types
export type InsertWebChat = z.infer<typeof insertWebChatSchema>;
export type WebChat = typeof webChats.$inferSelect;

export type InsertWebChatSession = z.infer<typeof insertWebChatSessionSchema>;
export type WebChatSession = typeof webChatSessions.$inferSelect;

export type InsertWebChatMessage = z.infer<typeof insertWebChatMessageSchema>;
export type WebChatMessage = typeof webChatMessages.$inferSelect;

// Raffles (Rifas) Module
export const raffles = pgTable("raffles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  photoUrl: text("photo_url"), // Main raffle photo
  videoUrl: text("video_url"), // Promotional video
  totalTickets: integer("total_tickets").notNull(), // Max number of 6-digit tickets (000001-999999)
  ticketPrice: integer("ticket_price").notNull(), // Price in cents
  currency: text("currency").default("MXN").notNull(), // 'MXN' | 'USD'
  status: text("status").notNull().default("draft"), // 'draft' | 'active' | 'closed' | 'finished'
  drawDate: timestamp("draw_date"), // When the raffle will be drawn
  isPublished: boolean("is_published").default(false).notNull(),
  whatsappContactNumber: text("whatsapp_contact_number"), // Principal WhatsApp number for sending messages
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const raffleTickets = pgTable("raffle_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  ticketNumber: varchar("ticket_number").notNull(), // 6-digit number (000001-999999)
  status: text("status").notNull().default("available"), // 'available' | 'reserved' | 'sold'
  purchaseId: varchar("purchase_id").references(() => rafflePurchases.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rafflePurchases = pgTable("raffle_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  ticketNumbers: text("ticket_numbers").array().notNull(), // Array of reserved ticket numbers
  quantity: integer("quantity").notNull(),
  totalAmount: integer("total_amount").notNull(), // Total price in cents
  status: text("status").notNull().default("pending"), // 'pending' | 'paid' | 'cancelled'
  paymentProof: text("payment_proof"), // URL to payment proof
  paymentVerified: boolean("payment_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raffleStories = pgTable("raffle_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(), // Photo or video URL
  mediaType: text("media_type").notNull(), // 'photo' | 'video'
  caption: text("caption"),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raffleBankAccounts = pgTable("raffle_bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  accountHolder: text("account_holder").notNull(),
  accountNumber: text("account_number").notNull(),
  accountType: text("account_type").notNull(), // 'checking' | 'savings'
  currency: text("currency").default("MXN").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raffleCustomers = pgTable("raffle_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull(), // Unique identifier like "RFC-12345" or similar
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(), // WhatsApp number for receiving messages
  ticketNumbers: text("ticket_numbers").array().default([]).notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'verified' | 'paid' | 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Classification for Sales Funnel
export const chatClassificationRules = pgTable("chat_classification_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  whatsappAccountId: varchar("whatsapp_account_id").notNull().references(() => whatsappAccounts.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // 'sales' | 'support' | 'vip' | 'inquiry' | 'complaint' | 'other'
  keywords: text("keywords").array().notNull(), // Array of keywords to match
  patterns: text("patterns").array().default([]).notNull(), // Array of regex patterns
  priority: integer("priority").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatClassificationResults = pgTable("chat_classification_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  detectedCategory: text("detected_category").notNull(),
  detectedPriority: text("detected_priority").notNull(),
  confidence: integer("confidence").default(0).notNull(), // 0-100 confidence score
  matchedRuleId: varchar("matched_rule_id").references(() => chatClassificationRules.id, { onDelete: "set null" }),
  lastClassifiedAt: timestamp("last_classified_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Raffle Schemas
export const insertRaffleSchema = createInsertSchema(raffles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRaffleTicketSchema = createInsertSchema(raffleTickets).omit({
  id: true,
  createdAt: true,
});

export const insertRafflePurchaseSchema = createInsertSchema(rafflePurchases).omit({
  id: true,
  createdAt: true,
});

export const insertRaffleStorySchema = createInsertSchema(raffleStories).omit({
  id: true,
  createdAt: true,
});

export const insertRaffleBankAccountSchema = createInsertSchema(raffleBankAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertRaffleCustomerSchema = createInsertSchema(raffleCustomers).omit({
  id: true,
  createdAt: true,
});

// Raffle Types
export type InsertRaffle = z.infer<typeof insertRaffleSchema>;
export type Raffle = typeof raffles.$inferSelect;

export type InsertRafflePurchase = z.infer<typeof insertRafflePurchaseSchema>;
export type RafflePurchase = typeof rafflePurchases.$inferSelect;

export type InsertRaffleStory = z.infer<typeof insertRaffleStorySchema>;
export type RaffleStory = typeof raffleStories.$inferSelect;

export type InsertRaffleBankAccount = z.infer<typeof insertRaffleBankAccountSchema>;
export type RaffleBankAccount = typeof raffleBankAccounts.$inferSelect;

export type InsertRaffleCustomer = z.infer<typeof insertRaffleCustomerSchema>;
export type RaffleCustomer = typeof raffleCustomers.$inferSelect;

// Chat Classification Types
export type ChatClassificationRule = typeof chatClassificationRules.$inferSelect;
export type ChatClassificationResult = typeof chatClassificationResults.$inferSelect;

export const insertChatClassificationRuleSchema = createInsertSchema(chatClassificationRules).omit({
  id: true,
  createdAt: true,
});
export type InsertChatClassificationRule = z.infer<typeof insertChatClassificationRuleSchema>;

// Teams Module - Team is an independent user account
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // 'admin' | 'member' | 'viewer'
  isActive: boolean("is_active").default(true).notNull(), // Pause/unpause access
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamActivityLogs = pgTable("team_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // 'login' | 'logout' | 'edit' | 'delete' | 'create'
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Auto-delete after 24hrs
});

export const teamModuleAccess = pgTable("team_module_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  memberId: varchar("member_id").references(() => teamMembers.id, { onDelete: "cascade" }), // Per-member permissions
  module: text("module").notNull(), // 'whatsapp' | 'chatbots' | 'calendar' | 'surveys' | 'raffles' | 'crm' | 'facebook'
  canRead: boolean("can_read").default(true).notNull(),
  canCreate: boolean("can_create").default(false).notNull(),
  canEdit: boolean("can_edit").default(false).notNull(),
  canDelete: boolean("can_delete").default(false).notNull(),
  assignedResourceIds: text("assigned_resource_ids").array().default([]).notNull(), // Specific WhatsApp/Chatbot IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Help Articles / Knowledge Base for Platform
export const helpArticles = pgTable("help_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // 'conversations' | 'chatbots' | 'calendar' | 'surveys' | 'raffles' | 'crm' | 'analytics' | 'general'
  keywords: text("keywords").array().notNull(), // For search
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Teams Schemas - Team creator sends email/password (new user creation)
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
}).extend({
  // Frontend will send email and password, backend creates user
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

// Teams Types
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamActivityLog = typeof teamActivityLogs.$inferSelect;
export type TeamModuleAccess = typeof teamModuleAccess.$inferSelect;

export const insertTeamActivityLogSchema = createInsertSchema(teamActivityLogs).omit({
  id: true,
});
export type InsertTeamActivityLog = z.infer<typeof insertTeamActivityLogSchema>;

export const insertTeamModuleAccessSchema = createInsertSchema(teamModuleAccess).omit({
  id: true,
  createdAt: true,
});
export type InsertTeamModuleAccess = z.infer<typeof insertTeamModuleAccessSchema>;

export type HelpArticle = typeof helpArticles.$inferSelect;

// E-Commerce Module - Stores (similar to chatbots and surveys, but for product sales)
export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"), // Image URL
  bannerImage: text("banner_image"), // Image URL
  isActive: boolean("is_active").default(true).notNull(),
  customUrl: text("custom_url").unique(), // URL personalizado: midominio.com/store/custom-url
  currency: text("currency").default("MXN").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeProductCategories = pgTable("store_product_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeProductSubcategories = pgTable("store_product_subcategories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => storeProductCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeProducts = pgTable("store_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => storeProductCategories.id, { onDelete: "set null" }),
  subcategoryId: varchar("subcategory_id").references(() => storeProductSubcategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"), // Image URL
  price: integer("price").notNull(), // In cents
  originalPrice: integer("original_price"), // For discounts
  stock: integer("stock").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Services Catalog - Linked to AI Voice Agents for service recommendations
export const storeServices = pgTable("store_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"), // Image URL
  durationMinutes: integer("duration_minutes").default(60).notNull(), // Service duration
  price: integer("price").notNull(), // In cents
  originalPrice: integer("original_price"), // For discounts
  isActive: boolean("is_active").default(true).notNull(),
  bookingLink: text("booking_link"), // Link to calendar booking or external booking system
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeCoupons = pgTable("store_coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  discountType: text("discount_type").notNull(), // 'percentage' | 'fixed'
  discountValue: integer("discount_value").notNull(),
  maxUses: integer("max_uses"), // null = unlimited
  currentUses: integer("current_uses").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeOrders = pgTable("store_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }), // Can be null if anonymous
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerCity: text("customer_city"),
  customerCountry: text("customer_country"),
  status: text("status").default("pending").notNull(), // 'pending' | 'processing' | 'completed' | 'cancelled'
  totalAmount: integer("total_amount").notNull(),
  discountAmount: integer("discount_amount").default(0).notNull(),
  finalAmount: integer("final_amount").notNull(),
  couponCode: text("coupon_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeOrderItems = pgTable("store_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => storeOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => storeProducts.id, { onDelete: "restrict" }),
  productName: text("product_name").notNull(),
  productPrice: integer("product_price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  subtotal: integer("subtotal").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeCustomDomains = pgTable("store_custom_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  customUrl: text("custom_url").unique(),
  domain: text("domain").unique(),
  status: text("status").default("pending").notNull(), // 'pending' | 'active' | 'failed'
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// E-Commerce Schemas
export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export const insertStoreProductCategorySchema = createInsertSchema(storeProductCategories).omit({
  id: true,
  createdAt: true,
});
export type StoreProductCategory = typeof storeProductCategories.$inferSelect;
export type InsertStoreProductCategory = z.infer<typeof insertStoreProductCategorySchema>;

export const insertStoreProductSubcategorySchema = createInsertSchema(storeProductSubcategories).omit({
  id: true,
  createdAt: true,
});
export type StoreProductSubcategory = typeof storeProductSubcategories.$inferSelect;
export type InsertStoreProductSubcategory = z.infer<typeof insertStoreProductSubcategorySchema>;

export const insertStoreProductSchema = createInsertSchema(storeProducts).omit({
  id: true,
  createdAt: true,
});
export type StoreProduct = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;

export const insertStoreServiceSchema = createInsertSchema(storeServices).omit({
  id: true,
  createdAt: true,
});
export type StoreService = typeof storeServices.$inferSelect;
export type InsertStoreService = z.infer<typeof insertStoreServiceSchema>;

export const insertStoreCouponSchema = createInsertSchema(storeCoupons).omit({
  id: true,
  createdAt: true,
});
export type StoreCoupon = typeof storeCoupons.$inferSelect;
export type InsertStoreCoupon = z.infer<typeof insertStoreCouponSchema>;

export const insertStoreOrderSchema = createInsertSchema(storeOrders).omit({
  id: true,
  createdAt: true,
});
export type StoreOrder = typeof storeOrders.$inferSelect;
export type InsertStoreOrder = z.infer<typeof insertStoreOrderSchema>;

export const insertStoreOrderItemSchema = createInsertSchema(storeOrderItems).omit({
  id: true,
  createdAt: true,
});
export type StoreOrderItem = typeof storeOrderItems.$inferSelect;
export type InsertStoreOrderItem = z.infer<typeof insertStoreOrderItemSchema>;

export const insertStoreCustomDomainSchema = createInsertSchema(storeCustomDomains).omit({
  id: true,
  createdAt: true,
});
export type StoreCustomDomain = typeof storeCustomDomains.$inferSelect;
export type InsertStoreCustomDomain = z.infer<typeof insertStoreCustomDomainSchema>;

// Tasks Schema
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("todo").notNull(), // 'todo' | 'in_progress' | 'done'
  priority: text("priority").default("normal").notNull(), // 'low' | 'normal' | 'high' | 'urgent'
  dueDate: timestamp("due_date"),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  createdByUserId: varchar("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  lastModifiedByUserId: varchar("last_modified_by_user_id").references(() => users.id, { onDelete: "set null" }),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Task Status Changes - Audit Log
export const taskStatusChanges = pgTable("task_status_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  oldStatus: text("old_status").notNull(),
  newStatus: text("new_status").notNull(),
  changedByUserId: varchar("changed_by_user_id").notNull().references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.union([z.string(), z.date()]).transform(val => {
    if (!val) return null;
    return typeof val === 'string' ? new Date(val) : val;
  }).nullable().optional(),
});
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export const insertTaskStatusChangeSchema = createInsertSchema(taskStatusChanges).omit({
  id: true,
  createdAt: true,
});
export type TaskStatusChange = typeof taskStatusChanges.$inferSelect;
export type InsertTaskStatusChange = z.infer<typeof insertTaskStatusChangeSchema>;

// Roles Schema
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("bg-purple-500").notNull(),
  permissions: jsonb("permissions").default({}).notNull(),
  usersCount: integer("users_count").default(0).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

// Notifications Schema
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'order' | 'message' | 'alert' | 'reminder' | 'info'
  relatedId: varchar("related_id"), // ID of related entity (order, message, etc)
  isViewed: boolean("is_viewed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Kanban Board Schema
export const kanbanBoards = pgTable("kanban_boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kanbanColumns = pgTable("kanban_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => kanbanBoards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kanbanCards = pgTable("kanban_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  columnId: varchar("column_id").notNull().references(() => kanbanColumns.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertKanbanBoardSchema = createInsertSchema(kanbanBoards).omit({
  id: true,
  createdAt: true,
});
export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type InsertKanbanBoard = z.infer<typeof insertKanbanBoardSchema>;

export const insertKanbanColumnSchema = createInsertSchema(kanbanColumns).omit({
  id: true,
  createdAt: true,
});
export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type InsertKanbanColumn = z.infer<typeof insertKanbanColumnSchema>;

export const insertKanbanCardSchema = createInsertSchema(kanbanCards).omit({
  id: true,
  createdAt: true,
});
export type KanbanCard = typeof kanbanCards.$inferSelect;
export type InsertKanbanCard = z.infer<typeof insertKanbanCardSchema>;

// Task Metrics Schema - Auto-cleanup after 60 days
export const taskMetrics = pgTable("task_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  hour: integer("hour"), // 0-23 for hourly metrics, null for daily
  totalTasks: integer("total_tasks").default(0).notNull(),
  completedTasks: integer("completed_tasks").default(0).notNull(),
  inProgressTasks: integer("in_progress_tasks").default(0).notNull(),
  todoTasks: integer("todo_tasks").default(0).notNull(),
  lowPriority: integer("low_priority").default(0).notNull(),
  normalPriority: integer("normal_priority").default(0).notNull(),
  highPriority: integer("high_priority").default(0).notNull(),
  urgentPriority: integer("urgent_priority").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskMetricsSchema = createInsertSchema(taskMetrics).omit({
  id: true,
  createdAt: true,
});
export type TaskMetrics = typeof taskMetrics.$inferSelect;
export type InsertTaskMetrics = z.infer<typeof insertTaskMetricsSchema>;

// AI Voice Agents Module - Twilio + Elevenlabs + OpenAI Conversational Integration
export const aiVoiceAgents = pgTable("ai_voice_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  voiceId: text("voice_id").notNull(), // Elevenlabs voice ID
  voiceName: text("voice_name").notNull(), // Display name
  language: text("language").default("es").notNull(), // 'es' | 'en'
  allowLanguageAutoSwitch: boolean("allow_language_auto_switch").default(false).notNull(),
  fallbackLanguage: text("fallback_language").default("es").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  flowNodes: jsonb("flow_nodes").default([]).notNull(), // Flow builder nodes
  status: text("status").default("draft").notNull(), // 'draft' | 'published' | 'archived'
  callsCount: integer("calls_count").default(0).notNull(),
  
  // Company Profile - Business information the agent represents
  companyProfile: jsonb("company_profile").default({
    businessName: "",
    industry: "",
    about: "",
    phones: [],
    addresses: [],
    workingHours: "",
    website: "",
    socialMedia: {}
  }).notNull(),
  
  // Link to store for products and services
  linkedStoreId: varchar("linked_store_id").references(() => stores.id, { onDelete: "set null" }),
  
  // Legacy: Products catalog (deprecated - use linkedStoreId instead)
  products: jsonb("products").default([]).notNull(), // [{id, name, shortDesc, price, upsellHints, tags, inStock}]
  
  // Legacy: Services the agent can offer (deprecated - use calendar/store instead)
  services: jsonb("services").default([]).notNull(), // [{id, name, description, durationMinutes, price, bookingRules, tags}]
  
  // FAQs - Knowledge base for common questions
  faqs: jsonb("faqs").default([]).notNull(), // [{id, question, answer, category, tags}]
  
  // Calendar booking policies
  calendarPolicy: jsonb("calendar_policy").default({
    defaultDurationMinutes: 60,
    minNoticeMinutes: 60,
    maxBookingDaysAhead: 30,
    requireContactInfo: true,
    confirmationMessage: "Su cita ha sido agendada exitosamente.",
    linkedCalendarUserId: null
  }).notNull(),
  
  // Agent permissions and capabilities
  toolPermissions: jsonb("tool_permissions").default({
    canBookAppointments: true,
    canCheckAvailability: true,
    canCreateLead: true,
    canTakeOrders: false,
    canTransferCall: false,
    canAccessClientData: true
  }).notNull(),
  
  // Agent personality and behavior settings
  personality: jsonb("personality").default({
    greeting: "Hola, gracias por llamar. ¿En qué puedo ayudarle?",
    farewell: "Gracias por su llamada. ¡Que tenga un excelente día!",
    tone: "professional", // 'professional' | 'friendly' | 'formal'
    salesApproach: "consultative", // 'consultative' | 'direct' | 'passive'
    handlingObjections: true,
    maxResponseLength: "medium" // 'short' | 'medium' | 'long'
  }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiVoiceCalls = pgTable("ai_voice_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => aiVoiceAgents.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentName: text("agent_name"), // Cached agent name for display
  phoneNumber: text("phone_number").notNull(),
  callSid: text("call_sid"), // Twilio call ID
  duration: integer("duration").default(0).notNull(), // seconds
  status: text("status").default("pending").notNull(), // 'pending' | 'ringing' | 'in-progress' | 'completed' | 'failed'
  transcript: text("transcript"), // Call transcript
  summary: text("summary"), // AI-generated call summary
  recordingUrl: text("recording_url"), // Twilio recording URL
  failureReason: text("failure_reason"),
  // Booking/lead created during call
  appointmentCreated: boolean("appointment_created").default(false).notNull(),
  leadCreated: boolean("lead_created").default(false).notNull(),
  callerLanguage: text("caller_language"), // Detected language during call
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TypeScript interfaces for JSONB fields
export interface CompanyProfile {
  businessName: string;
  industry: string;
  about: string;
  phones: string[];
  addresses: string[];
  workingHours: string;
  website: string;
  socialMedia: Record<string, string>;
}

export interface AgentProduct {
  id: string;
  name: string;
  shortDesc: string;
  price: number;
  currency: string;
  upsellHints: string[];
  tags: string[];
  inStock: boolean;
}

export interface AgentService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  currency: string;
  bookingRules: string;
  tags: string[];
}

export interface AgentFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

export interface CalendarPolicy {
  defaultDurationMinutes: number;
  minNoticeMinutes: number;
  maxBookingDaysAhead: number;
  requireContactInfo: boolean;
  confirmationMessage: string;
  linkedCalendarUserId: string | null;
}

export interface ToolPermissions {
  canBookAppointments: boolean;
  canCheckAvailability: boolean;
  canCreateLead: boolean;
  canTakeOrders: boolean;
  canTransferCall: boolean;
  canAccessClientData: boolean;
}

export interface AgentPersonality {
  greeting: string;
  farewell: string;
  tone: 'professional' | 'friendly' | 'formal';
  salesApproach: 'consultative' | 'direct' | 'passive';
  handlingObjections: boolean;
  maxResponseLength: 'short' | 'medium' | 'long';
}

export const insertAIVoiceAgentSchema = createInsertSchema(aiVoiceAgents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type AIVoiceAgent = typeof aiVoiceAgents.$inferSelect;
export type InsertAIVoiceAgent = z.infer<typeof insertAIVoiceAgentSchema>;

export const insertAIVoiceCallSchema = createInsertSchema(aiVoiceCalls).omit({
  id: true,
  createdAt: true,
});
export type AIVoiceCall = typeof aiVoiceCalls.$inferSelect;
export type InsertAIVoiceCall = z.infer<typeof insertAIVoiceCallSchema>;
