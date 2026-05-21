import { pgTable, text, serial, integer, jsonb, timestamp, pgEnum, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotationStatusEnum = pgEnum("quotation_status", [
  "pending", "processing", "ready", "approved", "rejected", "expired", "paid"
]);

export const quotationsTable = pgTable("quotations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  serviceId: integer("service_id").notNull(),
  status: quotationStatusEnum("status").notNull().default("pending"),
  formData: jsonb("form_data").notNull().default({}),
  remarks: text("remarks"),
  documentUrl: text("document_url"),
  quotationRef: text("quotation_ref"),
  price: numeric("price", { precision: 10, scale: 2 }),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }),
  paymentProofUrl: text("payment_proof_url"),
  isGuest: boolean("is_guest").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuotationSchema = createInsertSchema(quotationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotationsTable.$inferSelect;
