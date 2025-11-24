// Minimal Schema for WhatsApp Module
// Contains only the essential tables for QR generation, connection, and messaging

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (already exists)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// CORE WHATSAPP MODULE TABLES
// ============================================

// WhatsApp Accounts - Main table for storing connections
export const whatsappAccounts = pgTable("whatsapp_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceName: text("device_name").notNull(), // User-friendly name: "WhatsApp Ventas"
  accountType: text("account_type").notNull(), // 'normal' | 'business'
  phoneNumber: text("phone_number"), // Extracted from WhatsApp after QR scan
  status: text("status").notNull().default("disconnected"), // 'connected' | 'disconnected' | 'pending'
  isActive: boolean("is_active").default(true).notNull(), // Allow pausing without disconnecting
  qrCode: text("qr_code"), // Base64 encoded PNG data URL
  authState: jsonb("auth_state"), // Baileys auth state (credentials)
  lastActive: timestamp("last_active"), // Last time this account was active
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Conversations - Individual chats with contacts
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  whatsappAccountId: varchar("whatsapp_account_id").notNull().references(() => whatsappAccounts.id, { onDelete: "cascade" }),
  contactNumber: text("contact_number").notNull(), // "5491234567890" (cleaned)
  contactName: text("contact_name"), // "Juan Pérez" or null
  lastMessageText: text("last_message_text"), // Preview of last message
  lastMessageTime: timestamp("last_message_time"), // When last message was sent/received
  unreadCount: integer("unread_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages - Individual messages in conversations
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  messageId: text("message_id").notNull(), // WhatsApp's unique message ID
  direction: text("direction").notNull(), // 'incoming' | 'outgoing'
  content: text("content").notNull(), // Message text
  mediaType: text("media_type"), // 'text' | 'image' | 'video' | 'audio' | 'document'
  mediaUrl: text("media_url"), // Base64 or URL for media
  transcription: text("transcription"), // For audio messages (optional)
  status: text("status").notNull().default("sent"), // 'sent' | 'delivered' | 'read'
  timestamp: timestamp("timestamp").notNull(), // When message was created
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  whatsappAccounts: many(whatsappAccounts),
}));

export const whatsappAccountsRelations = relations(whatsappAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [whatsappAccounts.userId],
    references: [users.id],
  }),
  conversations: many(conversations),
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

// ============================================
// SCHEMAS & TYPES
// ============================================

// Type exports
export type WhatsappAccount = typeof whatsappAccounts.$inferSelect;
export type InsertWhatsappAccount = typeof whatsappAccounts.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Insert schemas for validation
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
