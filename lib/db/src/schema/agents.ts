import { pgTable, text, serial, integer, numeric, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentStatusEnum = pgEnum("agent_status", ["pending", "active", "suspended"]);
export const badgeLevelEnum = pgEnum("badge_level", ["bronze", "silver", "gold", "platinum", "elite"]);

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  agentId: text("agent_id").notNull().unique(),
  status: agentStatusEnum("status").notNull().default("pending"),
  badge: badgeLevelEnum("badge").notNull().default("bronze"),
  totalSales: integer("total_sales").notNull().default(0),
  totalCustomers: integer("total_customers").notNull().default(0),
  totalCommission: numeric("total_commission", { precision: 10, scale: 2 }).notNull().default("0"),
  commissionBalance: numeric("commission_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  points: integer("points").notNull().default(0),
  rankPosition: integer("rank_position"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const commissionsTable = pgTable("commissions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  quotationId: integer("quotation_id").notNull(),
  customerId: integer("customer_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agentBroadcastsTable = pgTable("agent_broadcasts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  sentBy: integer("sent_by").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
export type Commission = typeof commissionsTable.$inferSelect;
