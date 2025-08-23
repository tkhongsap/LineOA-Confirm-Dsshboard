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
  type CategoryData,
  type MockDataConfig
} from "@shared/schema";
import { IStorage } from "./storage";
import { randomUUID } from "crypto";

// Deterministic random number generator for consistent mockup data
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export class MockupStorage implements IStorage {
  private customers: Map<string, Customer>;
  private batches: Map<string, Batch>;
  private dailyStats: Map<string, DailyStats>;
  private config: MockDataConfig;
  private rng: SeededRandom;

  constructor(seed: number = 12345) {
    this.customers = new Map();
    this.batches = new Map();
    this.dailyStats = new Map();
    this.rng = new SeededRandom(seed);
    
    this.config = {
      seed,
      daysOfHistory: 30,
      customersPerDay: { min: 150, max: 200 },
      responseRate: { min: 0.65, max: 0.85 },
      categories: {
        confirmed: 0.60,    // 60% confirmed
        notConfirmed: 0.15, // 15% not confirmed  
        questions: 0.08,    // 8% questions
        other: 0.17         // 17% other
      }
    };
    
    this.generateMockData();
  }

  private generateMockData() {
    // Generate consistent Japanese customer names
    const familyNames = ['田中', '佐藤', '山田', '中村', '小林', '渡辺', '伊藤', '鈴木', '高橋', '松本'];
    const givenNames = ['太郎', '花子', '次郎', '美智子', '三郎', '恵子', '四郎', '由美子', '五郎', '真理子'];
    
    // Create customers with deterministic data
    for (let i = 0; i < 100; i++) {
      const familyName = familyNames[i % familyNames.length];
      const givenName = givenNames[i % givenNames.length];
      const id = `customer-${i.toString().padStart(3, '0')}`;
      
      const customer: Customer = {
        id,
        name: `${familyName} ${givenName}`,
        phone: `+81-${this.rng.nextInt(70, 90)}-${this.rng.nextInt(1000, 9999)}-${this.rng.nextInt(1000, 9999)}`
      };
      this.customers.set(id, customer);
    }

    // Generate batch data for the last 30 days
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < this.config.daysOfHistory; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Generate sent batch
      const customerCount = this.rng.nextInt(
        this.config.customersPerDay.min, 
        this.config.customersPerDay.max
      );
      
      const sentBatchId = `sent-${dateStr}`;
      const sentBatch: Batch = {
        id: sentBatchId,
        date: dateStr,
        type: 'sent',
        fileName: `delivery_confirmations_${dateStr}.csv`,
        channel: 'LINE OA',
        customerCount,
        confirmed: 0,
        notConfirmed: 0,
        questions: 0,
        other: 0,
        createdAt: new Date(date.getTime() + 9 * 60 * 60 * 1000) // 9 AM
      };
      this.batches.set(sentBatchId, sentBatch);

      // Generate received batch
      const responseRate = this.config.responseRate.min + 
        this.rng.next() * (this.config.responseRate.max - this.config.responseRate.min);
      const totalResponses = Math.floor(customerCount * responseRate);
      
      // Distribute responses across categories with deterministic proportions
      const confirmed = Math.floor(totalResponses * this.config.categories.confirmed);
      const notConfirmed = Math.floor(totalResponses * this.config.categories.notConfirmed);
      const questions = Math.floor(totalResponses * this.config.categories.questions);
      const other = totalResponses - confirmed - notConfirmed - questions;

      const receivedBatchId = `received-${dateStr}`;
      const receivedBatch: Batch = {
        id: receivedBatchId,
        date: dateStr,
        type: 'received',
        fileName: `delivery_responses_${dateStr}.csv`,
        channel: 'LINE OA',
        customerCount: totalResponses,
        confirmed,
        notConfirmed,
        questions,
        other,
        createdAt: new Date(date.getTime() + 18 * 60 * 60 * 1000) // 6 PM
      };
      this.batches.set(receivedBatchId, receivedBatch);

      // Generate daily stats
      const statsId = `stats-${dateStr}`;
      const stats: DailyStats = {
        id: statsId,
        date: dateStr,
        totalSent: customerCount,
        totalReceived: totalResponses,
        confirmed,
        notConfirmed,
        questions,
        other,
        pending: customerCount - totalResponses
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
    // Get the latest day's stats instead of totals
    const today = new Date().toISOString().split('T')[0];
    let latestStats = this.dailyStats.get(today);
    
    // If today's data doesn't exist, get the most recent day
    if (!latestStats) {
      const sortedDates = Array.from(this.dailyStats.keys()).sort().reverse();
      const latestDate = sortedDates[0];
      latestStats = this.dailyStats.get(latestDate);
    }
    
    if (!latestStats) {
      // Fallback if no data exists
      return {
        date: today,
        totalSent: 0,
        totalReceived: 0,
        confirmed: 0,
        notConfirmed: 0,
        questions: 0,
        other: 0,
        pending: 0,
        responseRate: 0
      };
    }

    const responseRate = latestStats.totalSent > 0 ? (latestStats.totalReceived / latestStats.totalSent) * 100 : 0;

    return {
      date: latestStats.date,
      totalSent: latestStats.totalSent,
      totalReceived: latestStats.totalReceived,
      confirmed: latestStats.confirmed,
      notConfirmed: latestStats.notConfirmed,
      questions: latestStats.questions,
      other: latestStats.other,
      pending: latestStats.pending,
      responseRate
    };
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