import { pgTable, text, serial, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from 'drizzle-orm';

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const widgetConfigs = pgTable("widget_configs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id).notNull(),
  name: text("name").notNull(),
  elevenlabsApiKey: text("elevenlabs_api_key").notNull(),
  agentId: text("agent_id").notNull(),
  theme: jsonb("theme").notNull().default({
    primary: '#0066cc',
    background: '#ffffff',
    text: '#ffffff'
  }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").references(() => widgetConfigs.id).notNull(),
  agentId: text("agent_id").notNull(),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const conversationsRelations = relations(conversations, ({ one }) => ({
  config: one(widgetConfigs, {
    fields: [conversations.configId],
    references: [widgetConfigs.id],
  }),
}));

export const widgetConfigsRelations = relations(widgetConfigs, ({ one, many }) => ({
  admin: one(admins, {
    fields: [widgetConfigs.adminId],
    references: [admins.id],
  }),
  conversations: many(conversations),
}));

// Schemas
export const insertAdminSchema = createInsertSchema(admins);
export const selectAdminSchema = createSelectSchema(admins);
export type InsertAdmin = typeof admins.$inferInsert;
export type SelectAdmin = typeof admins.$inferSelect;

export const insertWidgetConfigSchema = createInsertSchema(widgetConfigs);
export const selectWidgetConfigSchema = createSelectSchema(widgetConfigs);
export type InsertWidgetConfig = typeof widgetConfigs.$inferInsert;
export type SelectWidgetConfig = typeof widgetConfigs.$inferSelect;

export const insertConversationSchema = createInsertSchema(conversations);
export const selectConversationSchema = createSelectSchema(conversations);
export type InsertConversation = typeof conversations.$inferInsert;
export type SelectConversation = typeof conversations.$inferSelect;