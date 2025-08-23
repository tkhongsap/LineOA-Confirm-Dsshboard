import { 
  type Customer, 
  type Batch, 
  type DailyStats,
  type InsertCustomer, 
  type InsertBatch, 
  type InsertDailyStats,
  type BatchWithSummary,
  type BatchHistoryFilters,
  type DashboardMetrics,
  type ChartData,
  type CategoryData
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Batch operations
  getBatch(id: string): Promise<Batch | undefined>;
  getBatches(filters?: BatchHistoryFilters): Promise<{ batches: BatchWithSummary[]; total: number }>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  deleteBatchesOlderThan(days: number): Promise<number>;
  
  // Daily stats operations
  getDailyStats(date: string): Promise<DailyStats | undefined>;
  getDailyStatsRange(startDate: string, endDate: string): Promise<DailyStats[]>;
  createOrUpdateDailyStats(stats: InsertDailyStats): Promise<DailyStats>;
  
  // Dashboard operations
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getChartData(days: number): Promise<ChartData[]>;
  getCategoryData(): Promise<CategoryData[]>;
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private batches: Map<string, Batch>;
  private dailyStats: Map<string, DailyStats>;

  constructor() {
    this.customers = new Map();
    this.batches = new Map();
    this.dailyStats = new Map();
    this.seedData();
  }

  private seedData() {
    // Create sample customers
    const sampleCustomers = [
      { name: "Tanaka Hiroshi", phone: "+81-90-1234-5678" },
      { name: "Sato Yuki", phone: "+81-80-9876-5432" },
      { name: "Yamada Kenji", phone: "+81-70-2468-1357" },
      { name: "Nakamura Emi", phone: "+81-90-3691-2580" },
      { name: "Kobayashi Takeshi", phone: "+81-80-7531-9642" },
      { name: "Watanabe Akiko", phone: "+81-90-1597-3684" },
      { name: "Ito Daisuke", phone: "+81-70-8529-6174" },
      { name: "Suzuki Mayumi", phone: "+81-80-4173-9258" }
    ];

    sampleCustomers.forEach(customerData => {
      const id = randomUUID();
      const customer: Customer = { id, ...customerData };
      this.customers.set(id, customer);
    });

    // Create sample batches for the last 7 days
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Create sent batch for this day
      const sentCustomerCount = Math.floor(Math.random() * 51) + 150; // 150-200 customers
      const sentBatchId = randomUUID();
      const sentBatch: Batch = {
        id: sentBatchId,
        date: dateStr,
        type: 'sent',
        fileName: `delivery_confirmations_${dateStr}.csv`,
        channel: 'LINE OA',
        customerCount: sentCustomerCount,
        confirmed: 0,
        notConfirmed: 0,
        questions: 0,
        other: 0,
        createdAt: new Date(date.getTime() + 9 * 60 * 60 * 1000) // 9 AM
      };
      this.batches.set(sentBatchId, sentBatch);

      // Create received batch for this day
      const responseRate = 0.7 + Math.random() * 0.15; // 70-85% response rate
      const totalResponses = Math.floor(sentCustomerCount * responseRate);
      
      // Distribute responses across categories
      const confirmed = Math.floor(totalResponses * 0.6);
      const notConfirmed = Math.floor(totalResponses * 0.15);
      const questions = Math.floor(totalResponses * 0.08);
      const other = totalResponses - confirmed - notConfirmed - questions;

      const receivedBatchId = randomUUID();
      const receivedBatch: Batch = {
        id: receivedBatchId,
        date: dateStr,
        type: 'received',
        fileName: `delivery_responses_${dateStr}.csv`,
        channel: 'LINE OA',
        customerCount: totalResponses,
        confirmed: confirmed,
        notConfirmed: notConfirmed,
        questions: questions,
        other: other,
        createdAt: new Date(date.getTime() + 18 * 60 * 60 * 1000) // 6 PM
      };
      this.batches.set(receivedBatchId, receivedBatch);

      // Create daily stats
      const dailyStatsId = randomUUID();
      const stats: DailyStats = {
        id: dailyStatsId,
        date: dateStr,
        totalSent: sentCustomerCount,
        totalReceived: totalResponses,
        confirmed: confirmed,
        notConfirmed: notConfirmed,
        questions: questions,
        other: other,
        pending: sentCustomerCount - totalResponses
      };
      this.dailyStats.set(dateStr, stats);
    }
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => c.phone === phone);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }

  async getBatch(id: string): Promise<Batch | undefined> {
    return this.batches.get(id);
  }

  async getBatches(filters: BatchHistoryFilters = {}): Promise<{ batches: BatchWithSummary[]; total: number }> {
    let allBatches = Array.from(this.batches.values());
    
    // Filter by type
    if (filters.type && filters.type !== 'all') {
      allBatches = allBatches.filter(b => b.type === filters.type);
    }

    // Filter by date range
    if (filters.dateFrom) {
      allBatches = allBatches.filter(b => b.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      allBatches = allBatches.filter(b => b.date <= filters.dateTo!);
    }

    // Sort by date descending (newest first)
    allBatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = allBatches.length;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    const paginatedBatches = allBatches.slice(offset, offset + limit);
    
    // Add summary data for received batches
    const batchesWithSummary: BatchWithSummary[] = paginatedBatches.map(batch => {
      if (batch.type === 'received') {
        return {
          ...batch,
          totalResponses: batch.confirmed + batch.notConfirmed + batch.questions + batch.other
        };
      }
      return batch;
    });

    return { batches: batchesWithSummary, total };
  }

  async createBatch(insertBatch: InsertBatch): Promise<Batch> {
    const id = randomUUID();
    const batch: Batch = { 
      id,
      date: insertBatch.date,
      type: insertBatch.type,
      fileName: insertBatch.fileName,
      channel: insertBatch.channel || 'LINE OA',
      customerCount: insertBatch.customerCount || 0,
      confirmed: insertBatch.confirmed || 0,
      notConfirmed: insertBatch.notConfirmed || 0,
      questions: insertBatch.questions || 0,
      other: insertBatch.other || 0,
      createdAt: new Date()
    };
    this.batches.set(id, batch);
    return batch;
  }

  async deleteBatchesOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    let deletedCount = 0;
    const entriesToDelete: string[] = [];
    
    this.batches.forEach((batch, id) => {
      if (batch.date < cutoffStr) {
        entriesToDelete.push(id);
      }
    });
    
    entriesToDelete.forEach(id => {
      this.batches.delete(id);
      deletedCount++;
    });
    
    return deletedCount;
  }

  async getDailyStats(date: string): Promise<DailyStats | undefined> {
    return this.dailyStats.get(date);
  }

  async getDailyStatsRange(startDate: string, endDate: string): Promise<DailyStats[]> {
    return Array.from(this.dailyStats.values())
      .filter(stats => stats.date >= startDate && stats.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async createOrUpdateDailyStats(insertStats: InsertDailyStats): Promise<DailyStats> {
    const existing = this.dailyStats.get(insertStats.date);
    if (existing) {
      const updated = { ...existing, ...insertStats };
      this.dailyStats.set(insertStats.date, updated);
      return updated;
    } else {
      const id = randomUUID();
      const stats: DailyStats = { 
        id,
        date: insertStats.date,
        totalSent: insertStats.totalSent || 0,
        totalReceived: insertStats.totalReceived || 0,
        confirmed: insertStats.confirmed || 0,
        notConfirmed: insertStats.notConfirmed || 0,
        questions: insertStats.questions || 0,
        other: insertStats.other || 0,
        pending: insertStats.pending || 0
      };
      this.dailyStats.set(insertStats.date, stats);
      return stats;
    }
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const allStats = Array.from(this.dailyStats.values());
    const totals = allStats.reduce(
      (acc, stats) => ({
        totalSent: acc.totalSent + stats.totalSent,
        totalReceived: acc.totalReceived + stats.totalReceived,
        confirmed: acc.confirmed + stats.confirmed,
        notConfirmed: acc.notConfirmed + stats.notConfirmed,
        questions: acc.questions + stats.questions,
        other: acc.other + stats.other,
        pending: acc.pending + stats.pending,
      }),
      { totalSent: 0, totalReceived: 0, confirmed: 0, notConfirmed: 0, questions: 0, other: 0, pending: 0 }
    );

    const responseRate = totals.totalSent > 0 ? (totals.totalReceived / totals.totalSent) * 100 : 0;

    return { ...totals, responseRate };
  }

  async getChartData(days: number = 7): Promise<ChartData[]> {
    const today = new Date();
    const chartData: ChartData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const stats = this.dailyStats.get(dateStr);
      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: stats?.totalSent || 0,
        received: stats?.totalReceived || 0,
      });
    }

    return chartData;
  }

  async getCategoryData(): Promise<CategoryData[]> {
    const metrics = await this.getDashboardMetrics();
    
    return [
      { name: 'Confirmed', value: metrics.confirmed, color: '#10b981' },
      { name: 'Not Confirmed', value: metrics.notConfirmed, color: '#ef4444' },
      { name: 'Question', value: metrics.questions, color: '#8b5cf6' },
      { name: 'Other', value: metrics.other, color: '#6b7280' },
    ];
  }
}

export const storage = new MemStorage();