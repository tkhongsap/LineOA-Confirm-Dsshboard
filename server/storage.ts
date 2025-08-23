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
  type OperationMode
} from "@shared/schema";
import { MockupStorage } from "./storage-mockup";
import { DatabaseStorage } from "./storage-database";
import { getEnvironmentConfig } from "./config";

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

// Factory function to create the appropriate storage implementation
export function createStorage(): IStorage {
  const config = getEnvironmentConfig();
  
  console.log(`[Storage] Initializing storage for mode: ${config.mode}`);
  
  switch (config.mode) {
    case 'MOCKUP':
      return new MockupStorage(config.mockDataSeed);
    
    case 'DEV':
    case 'PROD':
      return new DatabaseStorage(config);
    
    default:
      console.warn(`[Storage] Unknown mode ${config.mode}, falling back to MOCKUP`);
      return new MockupStorage(config.mockDataSeed);
  }
}

// Legacy MemStorage class for backward compatibility
export class MemStorage implements IStorage {
  private delegate: IStorage;

  constructor() {
    this.delegate = createStorage();
  }

  // Delegate all methods to the appropriate storage implementation
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.delegate.getCustomer(id);
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    return this.delegate.getCustomerByPhone(phone);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return this.delegate.createCustomer(customer);
  }

  async getBatch(id: string): Promise<Batch | undefined> {
    return this.delegate.getBatch(id);
  }

  async getBatches(filters?: BatchHistoryFilters): Promise<{ batches: BatchWithSummary[]; total: number }> {
    return this.delegate.getBatches(filters);
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    return this.delegate.createBatch(batch);
  }

  async deleteBatchesOlderThan(days: number): Promise<number> {
    return this.delegate.deleteBatchesOlderThan(days);
  }

  async getDailyStats(date: string): Promise<DailyStats | undefined> {
    return this.delegate.getDailyStats(date);
  }

  async getDailyStatsRange(startDate: string, endDate: string): Promise<DailyStats[]> {
    return this.delegate.getDailyStatsRange(startDate, endDate);
  }

  async createOrUpdateDailyStats(stats: InsertDailyStats): Promise<DailyStats> {
    return this.delegate.createOrUpdateDailyStats(stats);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.delegate.getDashboardMetrics();
  }

  async getChartData(days: number): Promise<ChartData[]> {
    return this.delegate.getChartData(days);
  }

  async getCategoryData(): Promise<CategoryData[]> {
    return this.delegate.getCategoryData();
  }

  private seedData() {
    // Legacy method - now handled by delegate
    // Data generation is handled by the appropriate storage implementation

    // Legacy method implementation - removed in favor of delegate pattern
    }
}

// Create storage instance based on environment
export const storage = createStorage();