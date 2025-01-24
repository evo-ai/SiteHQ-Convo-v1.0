import { pgTable, text, serial, timestamp, jsonb, boolean, integer, real } from "drizzle-orm/pg-core";
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
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // in seconds
  totalTurns: integer("total_turns").default(0),
  interruptions: integer("interruptions").default(0),
  overallSentiment: real("overall_sentiment").default(0), // Average sentiment score
  sentimentTrend: jsonb("sentiment_trend").default([]), // Array of sentiment scores over time
  emotionalStates: jsonb("emotional_states").default([]), // Array of emotional states over time
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationMetrics = pgTable("conversation_metrics", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  avgResponseTime: integer("avg_response_time"), // in milliseconds
  userEngagementScore: integer("user_engagement_score"), // 1-100
  completionRate: integer("completion_rate"), // percentage
  successfulInterruptions: integer("successful_interruptions").default(0),
  failedInterruptions: integer("failed_interruptions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationFeedback = pgTable("conversation_feedback", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  rating: integer("rating"), // 1-5 stars
  feedback: text("feedback"),
  sentiment: text("sentiment"), // positive, negative, neutral
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  config: one(widgetConfigs, {
    fields: [conversations.configId],
    references: [widgetConfigs.id],
  }),
  metrics: many(conversationMetrics),
  feedback: many(conversationFeedback),
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

export const insertConversationMetricsSchema = createInsertSchema(conversationMetrics);
export const selectConversationMetricsSchema = createSelectSchema(conversationMetrics);
export type InsertConversationMetrics = typeof conversationMetrics.$inferInsert;
export type SelectConversationMetrics = typeof conversationMetrics.$inferSelect;

export const insertConversationFeedbackSchema = createInsertSchema(conversationFeedback);
export const selectConversationFeedbackSchema = createSelectSchema(conversationFeedback);
export type InsertConversationFeedback = typeof conversationFeedback.$inferInsert;
export type SelectConversationFeedback = typeof conversationFeedback.$inferSelect;