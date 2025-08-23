import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  type: text("type").notNull(), // 'sent' | 'received'
  content: text("content").notNull(),
  status: text("status").notNull(), // 'pending' | 'confirmed' | 'not-confirmed' | 'question' | 'other'
  sentAt: timestamp("sent_at").notNull(),
  receivedAt: timestamp("received_at"),
  responseTime: integer("response_time"), // in minutes
});

export const dailyStats = pgTable("daily_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull().unique(), // YYYY-MM-DD format
  totalSent: integer("total_sent").notNull().default(0),
  totalReceived: integer("total_received").notNull().default(0),
  confirmed: integer("confirmed").notNull().default(0),
  notConfirmed: integer("not_confirmed").notNull().default(0),
  questions: integer("questions").notNull().default(0),
  other: integer("other").notNull().default(0),
  pending: integer("pending").notNull().default(0),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

export type Customer = typeof customers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type DailyStats = typeof dailyStats.$inferSelect;

// Combined types for API responses
export type MessageWithCustomer = Message & {
  customer: Customer;
};

export type DashboardMetrics = {
  totalSent: number;
  totalReceived: number;
  confirmed: number;
  notConfirmed: number;
  questions: number;
  other: number;
  pending: number;
  responseRate: number;
};

export type ChartData = {
  date: string;
  sent: number;
  received: number;
};

export type CategoryData = {
  name: string;
  value: number;
  color: string;
};
