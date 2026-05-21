import { pgTable, text, serial, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cashbackTypeEnum = pgEnum("cashback_type", [
  "earned", "redeemed", "adjusted", "referral", "promotion"
]);

export const cashbackTransactionsTable = pgTable("cashback_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: cashbackTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceId: integer("reference_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCashbackTransactionSchema = createInsertSchema(cashbackTransactionsTable).omit({ id: true, createdAt: true });
export type InsertCashbackTransaction = z.infer<typeof insertCashbackTransactionSchema>;
export type CashbackTransaction = typeof cashbackTransactionsTable.$inferSelect;
