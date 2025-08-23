import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
});

export const batches = pgTable("batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // YYYY-MM-DD format
  type: text("type").notNull(), // 'sent' | 'received'
  fileName: text("file_name").notNull(),
  channel: text("channel").notNull().default('LINE OA'),
  customerCount: integer("customer_count").notNull().default(0),
  // For received batches - response breakdown
  confirmed: integer("confirmed").notNull().default(0),
  notConfirmed: integer("not_confirmed").notNull().default(0),
  questions: integer("questions").notNull().default(0),
  other: integer("other").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
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

export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mode: text("mode").notNull(), // 'MOCKUP' | 'DEV' | 'PROD'
  retentionDays: integer("retention_days").notNull().default(30),
  mockDataSeed: integer("mock_data_seed").default(12345),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

export type Customer = typeof customers.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type DailyStats = typeof dailyStats.$inferSelect;

// Combined types for API responses
export type BatchWithSummary = Batch & {
  totalResponses?: number;
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

export type BatchHistoryFilters = {
  type?: 'sent' | 'received' | 'all';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
};

// Environment-specific types
export interface MockDataConfig {
  seed: number;
  daysOfHistory: number;
  customersPerDay: {
    min: number;
    max: number;
  };
  responseRate: {
    min: number;
    max: number;
  };
  categories: {
    confirmed: number;
    notConfirmed: number;
    questions: number;
    other: number;
  };
}

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;

// Environment modes
export type OperationMode = 'MOCKUP' | 'DEV' | 'PROD';

// Environment configuration
export interface EnvironmentConfig {
  mode: OperationMode;
  retentionDays: number;
  mockDataSeed?: number;
  database?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
}
