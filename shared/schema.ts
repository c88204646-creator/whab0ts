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
  linkedStoreIds: text("linked_store_ids").array().default([]).notNull(), // IDs de tiendas vinculadas para vender sus productos
  // Anti-detection settings
  minResponseDelay: integer("min_response_delay").default(2000).notNull(), // milliseconds - min delay between messages (default 2s)
  maxResponseDelay: integer("max_response_delay").default(8000).notNull(), // milliseconds - max delay between messages (default 8s)
  dailyMessageLimit: integer("daily_message_limit").default(100).notNull(), // max messages per day per contact (0 = unlimited)
  respectUserTypingTime: boolean("respect_user_typing_time").default(true).notNull(), // simulate typing based on message length
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phoneNumber: text("phone_number"),
  email: text("email"),
  address: text("address"),
  status: text("status").default("active").notNull(),
  tags: text("tags").array().default([]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phoneNumber: text("phone_number"),
  email: text("email"),
  source: text("source").default("whatsapp").notNull(),
  status: text("status").default("new").notNull(),
  value: integer("value"),
  tags: text("tags").array().default([]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  type: text("type").default("event").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhoneNumber: text("client_phone_number"),
  whatsappPhoneNumber: text("whatsapp_phone_number"),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").default("pending").notNull(), // pending | confirmed | cancelled | completed
  location: text("location"),
  meetingLink: text("meeting_link"),
  confirmationToken: varchar("confirmation_token").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointmentSettings = pgTable("appointment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  appointmentDuration: integer("appointment_duration").default(30).notNull(), // minutes
  bufferTime: integer("buffer_time").default(0).notNull(), // minutes between appointments
  maximumDaysInAdvance: integer("maximum_days_in_advance").default(30).notNull(),
  minimumDaysInAdvance: integer("minimum_days_in_advance").default(0).notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  allowMultipleAppointmentsPerDay: boolean("allow_multiple_per_day").default(true).notNull(),
  requirePhoneNumber: boolean("require_phone_number").default(true).notNull(),
  requireWhatsapp: boolean("require_whatsapp").default(true).notNull(),
  customUrl: varchar("custom_url").unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointmentSlots = pgTable("appointment_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingsId: varchar("settings_id").notNull().references(() => appointmentSettings.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // HH:mm format
  endTime: text("end_time").notNull(), // HH:mm format
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBaseCategoryTable = pgTable("knowledge_base_category", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBaseSubcategoryTable = pgTable("knowledge_base_subcategory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => knowledgeBaseCategoryTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBaseItemTable = pgTable("knowledge_base_item", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => knowledgeBaseCategoryTable.id, { onDelete: "cascade" }),
  subcategoryId: varchar("subcategory_id").references(() => knowledgeBaseSubcategoryTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords").array().default([]).notNull(),
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatbotRules = pgTable("chatbot_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  priority: integer("priority").default(0).notNull(),
  triggers: text("triggers").array().notNull(),
  response: text("response").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatbotAIProviders = pgTable("chatbot_ai_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id").notNull().references(() => aiProviders.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const aiProviders = pgTable("ai_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'openai' | 'anthropic' | 'others'
  apiKey: text("api_key").notNull(),
  model: text("model").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  customUrl: varchar("custom_url").unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveyQuestions = pgTable("survey_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // 'text' | 'multiple' | 'rating'
  options: text("options").array(),
  order: integer("order").default(0).notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
});

export const surveyResponses = pgTable("survey_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  respondentEmail: text("respondent_email"),
  respondentPhoneNumber: text("respondent_phone_number"),
  responses: jsonb("responses").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountHolder: text("account_holder").notNull(),
  balance: integer("balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bankTransactions = pgTable("bank_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankAccountId: varchar("bank_account_id").notNull().references(() => bankAccounts.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'deposit' | 'withdrawal'
  amount: integer("amount").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const facebookAccounts = pgTable("facebook_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  facebookPageId: text("facebook_page_id").notNull(),
  facebookPageName: text("facebook_page_name").notNull(),
  accessToken: text("access_token").notNull(),
  cookieData: text("cookie_data"),
  isActive: boolean("is_active").default(true).notNull(),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customDomains = pgTable("custom_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  domain: varchar("domain").unique().notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  dnsRecords: jsonb("dns_records"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raffles = pgTable("raffles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  customUrl: varchar("custom_url").unique(),
  totalTickets: integer("total_tickets").notNull(),
  pricePerTicket: integer("price_per_ticket").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raffleTickets = pgTable("raffle_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  ticketNumber: integer("ticket_number").notNull(),
  isSold: boolean("is_sold").default(false).notNull(),
  customerId: varchar("customer_id").references(() => raffleCustomers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rafflePurchases = pgTable("raffle_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => raffleCustomers.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raffleStories = pgTable("raffle_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raffleBankAccounts = pgTable("raffle_bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  bankAccountId: varchar("bank_account_id").notNull().references(() => bankAccounts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raffleCustomers = pgTable("raffle_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleId: varchar("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'admin' | 'member' | 'viewer'
  permissions: text("permissions").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  customUrl: varchar("custom_url").unique(),
  isActive: boolean("is_active").default(true).notNull(),
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
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  image: text("image"),
  stock: integer("stock").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeOrders = pgTable("store_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  status: text("status").default("pending").notNull(),
  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeOrderItems = pgTable("store_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => storeOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeCustomDomains = pgTable("store_custom_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  domain: varchar("domain").unique().notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("normal").notNull(),
  status: text("status").default("todo").notNull(),
  dueDate: timestamp("due_date"),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kanbanBoards = pgTable("kanban_boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const kanbanColumns = pgTable("kanban_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => kanbanBoards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull(),
});

export const kanbanCards = pgTable("kanban_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  columnId: varchar("column_id").notNull().references(() => kanbanColumns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
});

// Zod Schemas
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const insertWhatsappAccountSchema = z.object({
  userId: z.string(),
  deviceName: z.string(),
  accountType: z.string(),
  phoneNumber: z.string().optional(),
});

export const insertChatbotSchema = z.object({
  userId: z.string(),
  whatsappAccountId: z.string().optional(),
  name: z.string(),
  type: z.string().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
  responseMode: z.string().optional(),
  language: z.string().optional(),
  useAIResponses: z.boolean().optional(),
  linkedStoreIds: z.array(z.string()).optional(),
});

export const insertChatbotRuleSchema = z.object({
  chatbotId: z.string(),
  name: z.string(),
  priority: z.number().optional(),
  triggers: z.array(z.string()),
  response: z.string(),
  isActive: z.boolean().optional(),
});

export const insertKnowledgeBaseCategorySchema = z.object({
  chatbotId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const insertKnowledgeBaseSubcategorySchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const insertKnowledgeBaseItemSchema = z.object({
  categoryId: z.string(),
  subcategoryId: z.string().optional(),
  question: z.string(),
  answer: z.string(),
  keywords: z.array(z.string()).optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const insertSurveySchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  customUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertSurveyQuestionSchema = z.object({
  surveyId: z.string(),
  questionText: z.string(),
  questionType: z.string(),
  options: z.array(z.string()).optional(),
  order: z.number().optional(),
  isRequired: z.boolean().optional(),
});

export const insertSurveyResponseSchema = z.object({
  surveyId: z.string(),
  respondentEmail: z.string().optional(),
  respondentPhoneNumber: z.string().optional(),
  responses: z.record(z.any()),
});

export const insertBankAccountSchema = z.object({
  userId: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  accountHolder: z.string(),
  balance: z.number().optional(),
});

export const insertBankTransactionSchema = z.object({
  bankAccountId: z.string(),
  type: z.string(),
  amount: z.number(),
  description: z.string().optional(),
});

export const insertFacebookAccountSchema = z.object({
  userId: z.string(),
  facebookPageId: z.string(),
  facebookPageName: z.string(),
  accessToken: z.string(),
  cookieData: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertClientSchema = z.object({
  userId: z.string(),
  name: z.string(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const insertCalendarEventSchema = z.object({
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().optional(),
  type: z.string().optional(),
});

export const insertLeadSchema = z.object({
  userId: z.string(),
  name: z.string(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  value: z.number().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const insertCustomDomainSchema = z.object({
  userId: z.string(),
  domain: z.string(),
  isVerified: z.boolean().optional(),
  dnsRecords: z.record(z.any()).optional(),
});

export const insertRaffleSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  customUrl: z.string().optional(),
  totalTickets: z.number(),
  pricePerTicket: z.number(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean().optional(),
});

export const insertRaffleTicketSchema = z.object({
  raffleId: z.string(),
  ticketNumber: z.number(),
  isSold: z.boolean().optional(),
  customerId: z.string().optional(),
});

export const insertRafflePurchaseSchema = z.object({
  raffleId: z.string(),
  customerId: z.string(),
  quantity: z.number(),
  totalAmount: z.number(),
});

export const insertRaffleStorySchema = z.object({
  raffleId: z.string(),
  title: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(),
  order: z.number().optional(),
});

export const insertRaffleBankAccountSchema = z.object({
  raffleId: z.string(),
  bankAccountId: z.string(),
});

export const insertRaffleCustomerSchema = z.object({
  raffleId: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export const insertAIProviderSchema = z.object({
  userId: z.string(),
  provider: z.string(),
  apiKey: z.string(),
  model: z.string(),
  name: z.string(),
  isActive: z.boolean().optional(),
});

export const insertTaskSchema = z.object({
  userId: z.string(),
  clientId: z.string().optional(),
  conversationId: z.string().optional(),
  leadId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  dueDate: z.date().optional(),
  order: z.number().optional(),
});

export const insertNotificationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.string().optional(),
  isRead: z.boolean().optional(),
});

export const insertStoreProductCategorySchema = z.object({
  storeId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const insertStoreProductSubcategorySchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const insertStoreProductSchema = z.object({
  storeId: z.string(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  originalPrice: z.number().optional(),
  image: z.string().optional(),
  stock: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const insertStoreOrderSchema = z.object({
  storeId: z.string(),
  clientId: z.string().optional(),
  status: z.string().optional(),
  totalAmount: z.number(),
});

export const insertStoreOrderItemSchema = z.object({
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const insertAppointmentSchema = z.object({
  userId: z.string(),
  clientName: z.string(),
  clientEmail: z.string().optional(),
  clientPhoneNumber: z.string().optional(),
  whatsappPhoneNumber: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  status: z.string().optional(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
});

export const insertAppointmentSettingsSchema = z.object({
  userId: z.string(),
  appointmentDuration: z.number().optional(),
  bufferTime: z.number().optional(),
  maximumDaysInAdvance: z.number().optional(),
  minimumDaysInAdvance: z.number().optional(),
  timezone: z.string().optional(),
  allowMultipleAppointmentsPerDay: z.boolean().optional(),
  requirePhoneNumber: z.boolean().optional(),
  requireWhatsapp: z.boolean().optional(),
  customUrl: z.string().optional(),
  description: z.string().optional(),
});

export const insertAppointmentSlotSchema = z.object({
  settingsId: z.string(),
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.boolean().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type WhatsappAccount = typeof whatsappAccounts.$inferSelect;
export type InsertWhatsappAccount = z.infer<typeof insertWhatsappAccountSchema>;

export type Conversation = typeof conversations.$inferSelect;

export type Message = typeof messages.$inferSelect;

export type Chatbot = typeof chatbots.$inferSelect;
export type InsertChatbot = z.infer<typeof insertChatbotSchema>;

export type ChatbotRule = typeof chatbotRules.$inferSelect;
export type InsertChatbotRule = z.infer<typeof insertChatbotRuleSchema>;

export type KnowledgeBaseCategory = typeof knowledgeBaseCategoryTable.$inferSelect;
export type InsertKnowledgeBaseCategory = z.infer<typeof insertKnowledgeBaseCategorySchema>;

export type KnowledgeBaseSubcategory = typeof knowledgeBaseSubcategoryTable.$inferSelect;
export type InsertKnowledgeBaseSubcategory = z.infer<typeof insertKnowledgeBaseSubcategorySchema>;

export type KnowledgeBaseItem = typeof knowledgeBaseItemTable.$inferSelect;
export type InsertKnowledgeBaseItem = z.infer<typeof insertKnowledgeBaseItemSchema>;

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = z.infer<typeof insertSurveyQuestionSchema>;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;

export type FacebookAccount = typeof facebookAccounts.$inferSelect;
export type InsertFacebookAccount = z.infer<typeof insertFacebookAccountSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type CustomDomain = typeof customDomains.$inferSelect;
export type InsertCustomDomain = z.infer<typeof insertCustomDomainSchema>;

export type Raffle = typeof raffles.$inferSelect;
export type InsertRaffle = z.infer<typeof insertRaffleSchema>;

export type RaffleTicket = typeof raffleTickets.$inferSelect;
export type InsertRaffleTicket = z.infer<typeof insertRaffleTicketSchema>;

export type RafflePurchase = typeof rafflePurchases.$inferSelect;
export type InsertRafflePurchase = z.infer<typeof insertRafflePurchaseSchema>;

export type RaffleStory = typeof raffleStories.$inferSelect;
export type InsertRaffleStory = z.infer<typeof insertRaffleStorySchema>;

export type RaffleBankAccount = typeof raffleBankAccounts.$inferSelect;
export type InsertRaffleBankAccount = z.infer<typeof insertRaffleBankAccountSchema>;

export type RaffleCustomer = typeof raffleCustomers.$inferSelect;
export type InsertRaffleCustomer = z.infer<typeof insertRaffleCustomerSchema>;

export type AIProvider = typeof aiProviders.$inferSelect;
export type InsertAIProvider = z.infer<typeof insertAIProviderSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type StoreProductCategory = typeof storeProductCategories.$inferSelect;
export type InsertStoreProductCategory = z.infer<typeof insertStoreProductCategorySchema>;

export type StoreProductSubcategory = typeof storeProductSubcategories.$inferSelect;
export type InsertStoreProductSubcategory = z.infer<typeof insertStoreProductSubcategorySchema>;

export type StoreProduct = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;

export type StoreOrder = typeof storeOrders.$inferSelect;
export type InsertStoreOrder = z.infer<typeof insertStoreOrderSchema>;

export type StoreOrderItem = typeof storeOrderItems.$inferSelect;
export type InsertStoreOrderItem = z.infer<typeof insertStoreOrderItemSchema>;

export type StoreCustomDomain = typeof storeCustomDomains.$inferSelect;
export type InsertStoreCustomDomain = z.object({
  storeId: z.string(),
  domain: z.string(),
  isVerified: z.boolean().optional(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type AppointmentSettings = typeof appointmentSettings.$inferSelect;
export type InsertAppointmentSettings = z.infer<typeof insertAppointmentSettingsSchema>;

export type AppointmentSlot = typeof appointmentSlots.$inferSelect;
export type InsertAppointmentSlot = z.infer<typeof insertAppointmentSlotSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  customUrl: z.string().optional(),
  isActive: z.boolean().optional(),
};

export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;

export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type InsertKanbanBoard = z.object({
  userId: z.string(),
  name: z.string(),
};

export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type InsertKanbanColumn = z.object({
  boardId: z.string(),
  name: z.string(),
  order: z.number(),
};

export type KanbanCard = typeof kanbanCards.$inferSelect;
export type InsertKanbanCard = z.object({
  columnId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number(),
};
