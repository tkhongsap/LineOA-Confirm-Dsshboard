import { 
  type Customer, 
  type Message, 
  type DailyStats,
  type InsertCustomer, 
  type InsertMessage, 
  type InsertDailyStats,
  type MessageWithCustomer,
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
  
  // Message operations
  getMessage(id: string): Promise<Message | undefined>;
  getMessages(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ messages: MessageWithCustomer[]; total: number }>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined>;
  
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
  private messages: Map<string, Message>;
  private dailyStats: Map<string, DailyStats>;

  constructor() {
    this.customers = new Map();
    this.messages = new Map();
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

    const customers: Customer[] = [];
    sampleCustomers.forEach(customerData => {
      const id = randomUUID();
      const customer: Customer = { id, ...customerData };
      this.customers.set(id, customer);
      customers.push(customer);
    });

    // Create sample messages for the last 7 days
    const today = new Date();
    const statuses = ['confirmed', 'not-confirmed', 'pending', 'question', 'other'];
    const statusWeights = [0.6, 0.15, 0.15, 0.08, 0.02]; // Probability distribution

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      let dailySent = 0;
      let dailyReceived = 0;
      let dailyConfirmed = 0;
      let dailyNotConfirmed = 0;
      let dailyQuestions = 0;
      let dailyOther = 0;
      let dailyPending = 0;

      // Generate 150-200 messages per day
      const messagesPerDay = Math.floor(Math.random() * 51) + 150;
      
      for (let i = 0; i < messagesPerDay; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        // Sent message
        const sentTime = new Date(date);
        sentTime.setHours(9, Math.floor(Math.random() * 60), 0, 0);
        
        const sentMessageId = randomUUID();
        const sentMessage: Message = {
          id: sentMessageId,
          customerId: customer.id,
          type: 'sent',
          content: 'お客様への配送確認をお願いいたします。商品は本日配送予定です。受け取り可能でしょうか？',
          status: 'pending',
          sentAt: sentTime,
          receivedAt: null,
          responseTime: null
        };
        this.messages.set(sentMessageId, sentMessage);
        dailySent++;

        // 70% chance of receiving a response
        if (Math.random() < 0.715) {
          const responseDelay = Math.floor(Math.random() * 480) + 30; // 30 minutes to 8 hours
          const receivedTime = new Date(sentTime.getTime() + responseDelay * 60000);
          
          // Select status based on weights
          let status = 'pending';
          const rand = Math.random();
          let cumulativeWeight = 0;
          for (let j = 0; j < statuses.length; j++) {
            cumulativeWeight += statusWeights[j];
            if (rand < cumulativeWeight) {
              status = statuses[j];
              break;
            }
          }

          const receivedMessageId = randomUUID();
          const receivedMessage: Message = {
            id: receivedMessageId,
            customerId: customer.id,
            type: 'received',
            content: this.getResponseContent(status),
            status: status,
            sentAt: sentTime,
            receivedAt: receivedTime,
            responseTime: responseDelay
          };
          this.messages.set(receivedMessageId, receivedMessage);
          dailyReceived++;

          // Update counters
          switch (status) {
            case 'confirmed': dailyConfirmed++; break;
            case 'not-confirmed': dailyNotConfirmed++; break;
            case 'question': dailyQuestions++; break;
            case 'other': dailyOther++; break;
          }

          // Update the sent message status
          sentMessage.status = status;
          sentMessage.receivedAt = receivedTime;
          sentMessage.responseTime = responseDelay;
        } else {
          dailyPending++;
        }
      }

      // Create daily stats
      const dailyStatsId = randomUUID();
      const stats: DailyStats = {
        id: dailyStatsId,
        date: dateStr,
        totalSent: dailySent,
        totalReceived: dailyReceived,
        confirmed: dailyConfirmed,
        notConfirmed: dailyNotConfirmed,
        questions: dailyQuestions,
        other: dailyOther,
        pending: dailyPending
      };
      this.dailyStats.set(dateStr, stats);
    }
  }

  private getResponseContent(status: string): string {
    const responses = {
      confirmed: ['はい、受け取れます', '大丈夫です', 'お願いします', 'はい'],
      'not-confirmed': ['今日は受け取れません', 'いません', 'また後日', '不在です'],
      question: ['何時頃ですか？', '時間の変更は可能ですか？', '場所はどちらですか？', '連絡先を教えてください'],
      other: ['ありがとうございます', '了解しました', 'よろしく', 'OK']
    };
    const options = responses[status as keyof typeof responses] || ['その他の返信'];
    return options[Math.floor(Math.random() * options.length)];
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

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessages(filters: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ messages: MessageWithCustomer[]; total: number }> {
    let allMessages = Array.from(this.messages.values());
    
    // Filter by status
    if (filters.status && filters.status !== 'all') {
      allMessages = allMessages.filter(m => m.status === filters.status);
    }

    // Filter by search term (customer name or phone)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      allMessages = allMessages.filter(message => {
        const customer = this.customers.get(message.customerId);
        if (!customer) return false;
        return customer.name.toLowerCase().includes(searchLower) ||
               customer.phone.includes(filters.search!);
      });
    }

    // Sort by sentAt descending
    allMessages.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    const total = allMessages.length;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    const paginatedMessages = allMessages.slice(offset, offset + limit);
    
    // Join with customer data
    const messagesWithCustomer: MessageWithCustomer[] = paginatedMessages.map(message => {
      const customer = this.customers.get(message.customerId)!;
      return { ...message, customer };
    });

    return { messages: messagesWithCustomer, total };
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { ...insertMessage, id };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, ...updates };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
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
      const stats: DailyStats = { ...insertStats, id };
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
