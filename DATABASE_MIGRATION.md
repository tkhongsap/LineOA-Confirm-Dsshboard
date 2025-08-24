# Database Migration Guide

## From Mockup to PostgreSQL Implementation

### Table of Contents
- [Database Schema Overview](#database-schema-overview)
- [Complete Table Definitions](#complete-table-definitions)
- [Mock Data Patterns to Replicate](#mock-data-patterns-to-replicate)
- [Business Rules and Constraints](#business-rules-and-constraints)
- [Migration Strategy](#migration-strategy)
- [Implementation Steps](#implementation-steps)
- [SQL Migration Scripts](#sql-migration-scripts)
- [DatabaseStorage Implementation](#databasestorage-implementation)
- [Testing the Migration](#testing-the-migration)

## Database Schema Overview

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   customers  │         │    batches   │         │ daily_stats  │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ name         │         │ date         │         │ date (UNIQUE)│
│ phone(UNIQUE)│         │ type         │         │ totalSent    │
└──────────────┘         │ fileName     │         │ totalReceived│
                        │ channel      │         │ confirmed    │
                        │ customerCount│         │ notConfirmed │
                        │ confirmed    │         │ questions    │
                        │ notConfirmed │         │ other        │
                        │ questions    │         │ pending      │
                        │ other        │         └──────────────┘
                        │ createdAt    │
                        └──────────────┘
                        
┌──────────────────┐
│  system_config   │
├──────────────────┤
│ id (PK)          │
│ mode             │
│ retentionDays    │
│ mockDataSeed     │
│ updatedAt        │
└──────────────────┘
```

### Data Relationships

1. **Batches ↔ Daily Stats**: Batches are aggregated into daily_stats by date
2. **Customers**: Independent entity, referenced by batch processing
3. **System Config**: Singleton configuration table

## Complete Table Definitions

### 1. Customers Table

```sql
CREATE TABLE customers (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE
);

-- Indexes
CREATE INDEX idx_customers_phone ON customers(phone);
```

**Field Specifications:**
- `id`: UUID format, e.g., "customer-001"
- `name`: Japanese names (family + given), e.g., "田中 太郎"
- `phone`: International format, e.g., "+81-90-1234-5678"

### 2. Batches Table

```sql
CREATE TABLE batches (
    id VARCHAR(255) PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sent', 'received')),
    fileName TEXT,
    channel TEXT DEFAULT 'LINE OA',
    customerCount INTEGER NOT NULL DEFAULT 0,
    confirmed INTEGER NOT NULL DEFAULT 0,
    notConfirmed INTEGER NOT NULL DEFAULT 0,
    questions INTEGER NOT NULL DEFAULT 0,
    other INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_batches_date ON batches(date);
CREATE INDEX idx_batches_type ON batches(type);
CREATE INDEX idx_batches_date_type ON batches(date, type);
```

**Field Specifications:**
- `id`: UUID format, e.g., "batch-sent-2024-01-15"
- `date`: ISO date format "YYYY-MM-DD"
- `type`: Enum values "sent" or "received"
- `fileName`: Format "delivery_confirmations_YYYY-MM-DD.csv" or "delivery_responses_YYYY-MM-DD.csv"
- `channel`: Currently always "LINE OA"
- Response counts: Sum should equal customerCount for received batches

### 3. Daily Stats Table

```sql
CREATE TABLE daily_stats (
    id VARCHAR(255) PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    totalSent INTEGER NOT NULL DEFAULT 0,
    totalReceived INTEGER NOT NULL DEFAULT 0,
    confirmed INTEGER NOT NULL DEFAULT 0,
    notConfirmed INTEGER NOT NULL DEFAULT 0,
    questions INTEGER NOT NULL DEFAULT 0,
    other INTEGER NOT NULL DEFAULT 0,
    pending INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE UNIQUE INDEX idx_daily_stats_date ON daily_stats(date);
```

**Field Specifications:**
- `id`: UUID format, e.g., "stats-2024-01-15"
- `date`: ISO date format "YYYY-MM-DD", must be unique
- `pending`: Calculated as totalSent - totalReceived
- All counts are non-negative integers

### 4. System Config Table

```sql
CREATE TABLE system_config (
    id VARCHAR(255) PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('MOCKUP', 'DEV', 'PROD')),
    retentionDays INTEGER DEFAULT 30,
    mockDataSeed INTEGER DEFAULT 12345,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO system_config (id, mode, retentionDays, mockDataSeed)
VALUES ('default', 'DEV', 30, 12345);
```

## Mock Data Patterns to Replicate

### Data Generation Rules from MockupStorage

```typescript
// Key patterns from mock implementation
const DATA_PATTERNS = {
  // Time patterns
  BATCH_SENT_TIME: "09:00:00",      // Morning batch
  BATCH_RECEIVED_TIME: "18:00:00",   // Evening response
  
  // Volume patterns
  CUSTOMERS_PER_DAY: { min: 150, max: 200 },
  RESPONSE_RATE: { min: 0.65, max: 0.85 },  // 65-85%
  
  // Response distribution
  RESPONSE_CATEGORIES: {
    confirmed: 0.60,      // 60% of responses
    notConfirmed: 0.15,   // 15% of responses
    questions: 0.08,      // 8% of responses
    other: 0.17          // 17% of responses
  },
  
  // Data retention
  HISTORICAL_DAYS: 30,    // Generate 30 days of history
  
  // Japanese name patterns
  FAMILY_NAMES: ["田中", "鈴木", "高橋", "伊藤", "渡辺", ...],
  GIVEN_NAMES: ["太郎", "花子", "一郎", "美咲", "健太", ...]
};
```

### Sample Data Generation Logic

```sql
-- Generate 30 days of historical data
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '29 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  )::date AS batch_date
)
INSERT INTO batches (id, date, type, fileName, customerCount, ...)
SELECT 
  'batch-sent-' || batch_date AS id,
  batch_date::text AS date,
  'sent' AS type,
  'delivery_confirmations_' || batch_date || '.csv' AS fileName,
  150 + (RANDOM() * 50)::int AS customerCount,
  ...
FROM date_series;
```

## Business Rules and Constraints

### Core Business Logic

1. **Daily Batch Processing**
   - One "sent" batch per day (morning)
   - One "received" batch per day (evening)
   - Sent batch must exist before received batch

2. **Response Rate Calculation**
   ```sql
   response_rate = (totalReceived / totalSent) * 100
   ```

3. **Pending Calculation**
   ```sql
   pending = totalSent - totalReceived
   ```

4. **Response Category Validation**
   ```sql
   -- For received batches
   confirmed + notConfirmed + questions + other = customerCount
   ```

5. **Data Retention Policy**
   ```sql
   -- Delete data older than retention period
   DELETE FROM batches WHERE date < CURRENT_DATE - INTERVAL '30 days';
   DELETE FROM daily_stats WHERE date < CURRENT_DATE - INTERVAL '30 days';
   ```

### Data Integrity Constraints

```sql
-- Ensure one sent batch per day
ALTER TABLE batches 
ADD CONSTRAINT unique_sent_per_day 
UNIQUE (date, type) WHERE type = 'sent';

-- Ensure one received batch per day
ALTER TABLE batches 
ADD CONSTRAINT unique_received_per_day 
UNIQUE (date, type) WHERE type = 'received';

-- Ensure response counts are non-negative
ALTER TABLE batches
ADD CONSTRAINT positive_counts CHECK (
  customerCount >= 0 AND
  confirmed >= 0 AND
  notConfirmed >= 0 AND
  questions >= 0 AND
  other >= 0
);

-- Ensure daily stats are consistent
ALTER TABLE daily_stats
ADD CONSTRAINT consistent_totals CHECK (
  totalSent >= 0 AND
  totalReceived >= 0 AND
  totalReceived <= totalSent
);
```

## Migration Strategy

### Phase 1: Development Environment Setup

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql-15
   sudo systemctl start postgresql
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE lineoa_monitoring;
   CREATE USER lineoa_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE lineoa_monitoring TO lineoa_user;
   ```

3. **Configure Environment**
   ```bash
   # Copy dev environment template
   cp .env.example.dev .env
   
   # Update with your database credentials
   MODE=DEV
   DEV_DB_HOST=localhost
   DEV_DB_PORT=5432
   DEV_DB_NAME=lineoa_monitoring
   DEV_DB_USER=lineoa_user
   DEV_DB_PASSWORD=your_password
   ```

### Phase 2: Schema Migration

1. **Run Drizzle Migrations**
   ```bash
   # Generate migration files
   npm run db:generate
   
   # Apply migrations to database
   npm run db:push
   
   # Verify with Drizzle Studio
   npm run db:studio
   ```

2. **Verify Schema**
   ```sql
   -- Check all tables created
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Verify indexes
   SELECT indexname, tablename FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

### Phase 3: Data Migration

1. **Export Mock Data** (Optional - for testing)
   ```javascript
   // Script to export mock data to SQL
   const mockStorage = new MockupStorage(config);
   const data = await mockStorage.getAllData();
   // Convert to SQL INSERT statements
   ```

2. **Import Initial Data**
   ```sql
   -- Import customers
   INSERT INTO customers (id, name, phone) VALUES ...;
   
   -- Import historical batches
   INSERT INTO batches (...) VALUES ...;
   
   -- Calculate and import daily stats
   INSERT INTO daily_stats 
   SELECT ... FROM batches GROUP BY date;
   ```

## Implementation Steps

### Step 1: Complete DatabaseStorage Class

```typescript
// server/storage-database.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor(config: AppConfig) {
    // Initialize connection pool
    this.pool = new Pool({
      host: config[`${config.MODE}_DB_HOST`],
      port: config[`${config.MODE}_DB_PORT`],
      database: config[`${config.MODE}_DB_NAME`],
      user: config[`${config.MODE}_DB_USER`],
      password: config[`${config.MODE}_DB_PASSWORD`],
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize Drizzle ORM
    this.db = drizzle(this.pool, { schema });
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Get latest daily stats
    const latest = await this.db
      .select()
      .from(schema.dailyStats)
      .orderBy(desc(schema.dailyStats.date))
      .limit(1);

    if (!latest[0]) {
      return this.getEmptyMetrics();
    }

    const stats = latest[0];
    const responseRate = stats.totalSent > 0 
      ? (stats.totalReceived / stats.totalSent) * 100 
      : 0;

    return {
      date: stats.date,
      totalSent: stats.totalSent,
      totalReceived: stats.totalReceived,
      confirmed: stats.confirmed,
      notConfirmed: stats.notConfirmed,
      questions: stats.questions,
      other: stats.other,
      pending: stats.pending,
      responseRate: Math.round(responseRate)
    };
  }

  async getChartData(days: number): Promise<ChartData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const data = await this.db
      .select({
        date: schema.dailyStats.date,
        sent: schema.dailyStats.totalSent,
        received: schema.dailyStats.totalReceived
      })
      .from(schema.dailyStats)
      .where(gte(schema.dailyStats.date, startDate.toISOString().split('T')[0]))
      .orderBy(schema.dailyStats.date);

    return data;
  }

  async getCategoryData(): Promise<CategoryData[]> {
    const latest = await this.getDashboardMetrics();

    return [
      { name: '確認済み', value: latest.confirmed, color: '#10b981' },
      { name: '未確認', value: latest.notConfirmed, color: '#ef4444' },
      { name: '質問', value: latest.questions, color: '#f59e0b' },
      { name: 'その他', value: latest.other, color: '#6b7280' }
    ];
  }

  async getBatches(params: BatchQueryParams): Promise<BatchResponse> {
    const query = this.db.select().from(schema.batches);

    // Apply filters
    const conditions = [];
    if (params.type) {
      conditions.push(eq(schema.batches.type, params.type));
    }
    if (params.dateFrom) {
      conditions.push(gte(schema.batches.date, params.dateFrom));
    }
    if (params.dateTo) {
      conditions.push(lte(schema.batches.date, params.dateTo));
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: count() })
      .from(schema.batches)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    // Apply pagination
    const batches = await query
      .orderBy(desc(schema.batches.date))
      .limit(params.limit || 10)
      .offset(params.offset || 0);

    return { batches, total };
  }

  async getBatch(id: string): Promise<Batch | null> {
    const result = await this.db
      .select()
      .from(schema.batches)
      .where(eq(schema.batches.id, id))
      .limit(1);

    return result[0] || null;
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }
}
```

### Step 2: Update Storage Factory

```typescript
// server/storage.ts
export async function createStorage(config: AppConfig): Promise<IStorage> {
  switch (config.MODE) {
    case 'MOCKUP':
      console.log('[Storage] Using MockupStorage');
      return new MockupStorage(config);
    
    case 'DEV':
    case 'PROD':
      console.log(`[Storage] Using DatabaseStorage in ${config.MODE} mode`);
      const storage = new DatabaseStorage(config);
      
      // Test connection
      await storage.testConnection();
      
      return storage;
    
    default:
      throw new Error(`Unknown mode: ${config.MODE}`);
  }
}
```

### Step 3: Add Database Utilities

```typescript
// server/utils/db-utils.ts
export async function aggregateDailyStats(db: DrizzleDB, date: string) {
  // Get batches for the date
  const batches = await db
    .select()
    .from(schema.batches)
    .where(eq(schema.batches.date, date));

  const sentBatch = batches.find(b => b.type === 'sent');
  const receivedBatch = batches.find(b => b.type === 'received');

  const stats = {
    id: `stats-${date}`,
    date,
    totalSent: sentBatch?.customerCount || 0,
    totalReceived: receivedBatch?.customerCount || 0,
    confirmed: receivedBatch?.confirmed || 0,
    notConfirmed: receivedBatch?.notConfirmed || 0,
    questions: receivedBatch?.questions || 0,
    other: receivedBatch?.other || 0,
    pending: 0
  };

  stats.pending = stats.totalSent - stats.totalReceived;

  // Upsert daily stats
  await db
    .insert(schema.dailyStats)
    .values(stats)
    .onConflictDoUpdate({
      target: schema.dailyStats.date,
      set: stats
    });

  return stats;
}

export async function applyRetentionPolicy(db: DrizzleDB, retentionDays: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  // Delete old batches
  await db
    .delete(schema.batches)
    .where(lt(schema.batches.date, cutoffStr));

  // Delete old daily stats
  await db
    .delete(schema.dailyStats)
    .where(lt(schema.dailyStats.date, cutoffStr));

  console.log(`[Retention] Deleted data older than ${cutoffStr}`);
}
```

## SQL Migration Scripts

### Initial Schema Creation

```sql
-- migrations/001_initial_schema.sql

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(255) PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sent', 'received')),
    fileName TEXT,
    channel TEXT DEFAULT 'LINE OA',
    customerCount INTEGER NOT NULL DEFAULT 0,
    confirmed INTEGER NOT NULL DEFAULT 0,
    notConfirmed INTEGER NOT NULL DEFAULT 0,
    questions INTEGER NOT NULL DEFAULT 0,
    other INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batches_date ON batches(date);
CREATE INDEX IF NOT EXISTS idx_batches_type ON batches(type);
CREATE INDEX IF NOT EXISTS idx_batches_date_type ON batches(date, type);

-- Create daily_stats table
CREATE TABLE IF NOT EXISTS daily_stats (
    id VARCHAR(255) PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    totalSent INTEGER NOT NULL DEFAULT 0,
    totalReceived INTEGER NOT NULL DEFAULT 0,
    confirmed INTEGER NOT NULL DEFAULT 0,
    notConfirmed INTEGER NOT NULL DEFAULT 0,
    questions INTEGER NOT NULL DEFAULT 0,
    other INTEGER NOT NULL DEFAULT 0,
    pending INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
    id VARCHAR(255) PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('MOCKUP', 'DEV', 'PROD')),
    retentionDays INTEGER DEFAULT 30,
    mockDataSeed INTEGER DEFAULT 12345,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO system_config (id, mode, retentionDays, mockDataSeed)
VALUES ('default', 'DEV', 30, 12345)
ON CONFLICT (id) DO NOTHING;
```

### Sample Data Population

```sql
-- migrations/002_sample_data.sql

-- Insert sample customers
INSERT INTO customers (id, name, phone) VALUES
('customer-001', '田中 太郎', '+81-90-1234-5678'),
('customer-002', '鈴木 花子', '+81-90-2345-6789'),
('customer-003', '高橋 一郎', '+81-90-3456-7890'),
('customer-004', '伊藤 美咲', '+81-90-4567-8901'),
('customer-005', '渡辺 健太', '+81-90-5678-9012')
ON CONFLICT (phone) DO NOTHING;

-- Insert sample batches for today
INSERT INTO batches (
  id, date, type, fileName, channel, 
  customerCount, confirmed, notConfirmed, questions, other
) VALUES
(
  'batch-sent-' || CURRENT_DATE,
  CURRENT_DATE::text,
  'sent',
  'delivery_confirmations_' || CURRENT_DATE || '.csv',
  'LINE OA',
  175, 0, 0, 0, 0
),
(
  'batch-received-' || CURRENT_DATE,
  CURRENT_DATE::text,
  'received',
  'delivery_responses_' || CURRENT_DATE || '.csv',
  'LINE OA',
  140, 84, 21, 11, 24
)
ON CONFLICT (id) DO NOTHING;

-- Calculate daily stats from batches
INSERT INTO daily_stats (
  id, date, totalSent, totalReceived,
  confirmed, notConfirmed, questions, other, pending
)
SELECT
  'stats-' || date,
  date,
  SUM(CASE WHEN type = 'sent' THEN customerCount ELSE 0 END) as totalSent,
  SUM(CASE WHEN type = 'received' THEN customerCount ELSE 0 END) as totalReceived,
  SUM(CASE WHEN type = 'received' THEN confirmed ELSE 0 END) as confirmed,
  SUM(CASE WHEN type = 'received' THEN notConfirmed ELSE 0 END) as notConfirmed,
  SUM(CASE WHEN type = 'received' THEN questions ELSE 0 END) as questions,
  SUM(CASE WHEN type = 'received' THEN other ELSE 0 END) as other,
  SUM(CASE WHEN type = 'sent' THEN customerCount ELSE 0 END) - 
  SUM(CASE WHEN type = 'received' THEN customerCount ELSE 0 END) as pending
FROM batches
GROUP BY date
ON CONFLICT (date) DO UPDATE SET
  totalSent = EXCLUDED.totalSent,
  totalReceived = EXCLUDED.totalReceived,
  confirmed = EXCLUDED.confirmed,
  notConfirmed = EXCLUDED.notConfirmed,
  questions = EXCLUDED.questions,
  other = EXCLUDED.other,
  pending = EXCLUDED.pending;
```

### Stored Procedures for Batch Processing

```sql
-- migrations/003_stored_procedures.sql

-- Function to process a new sent batch
CREATE OR REPLACE FUNCTION process_sent_batch(
  p_date DATE,
  p_customer_count INTEGER
) RETURNS void AS $$
BEGIN
  -- Insert sent batch
  INSERT INTO batches (
    id, date, type, fileName, customerCount
  ) VALUES (
    'batch-sent-' || p_date,
    p_date::text,
    'sent',
    'delivery_confirmations_' || p_date || '.csv',
    p_customer_count
  );

  -- Update daily stats
  INSERT INTO daily_stats (id, date, totalSent, pending)
  VALUES (
    'stats-' || p_date,
    p_date::text,
    p_customer_count,
    p_customer_count
  )
  ON CONFLICT (date) DO UPDATE SET
    totalSent = EXCLUDED.totalSent,
    pending = daily_stats.totalSent - daily_stats.totalReceived;
END;
$$ LANGUAGE plpgsql;

-- Function to process a received batch
CREATE OR REPLACE FUNCTION process_received_batch(
  p_date DATE,
  p_customer_count INTEGER,
  p_confirmed INTEGER,
  p_not_confirmed INTEGER,
  p_questions INTEGER,
  p_other INTEGER
) RETURNS void AS $$
BEGIN
  -- Validate response counts
  IF p_confirmed + p_not_confirmed + p_questions + p_other != p_customer_count THEN
    RAISE EXCEPTION 'Response counts do not match customer count';
  END IF;

  -- Insert received batch
  INSERT INTO batches (
    id, date, type, fileName, customerCount,
    confirmed, notConfirmed, questions, other
  ) VALUES (
    'batch-received-' || p_date,
    p_date::text,
    'received',
    'delivery_responses_' || p_date || '.csv',
    p_customer_count,
    p_confirmed,
    p_not_confirmed,
    p_questions,
    p_other
  );

  -- Update daily stats
  UPDATE daily_stats SET
    totalReceived = p_customer_count,
    confirmed = p_confirmed,
    notConfirmed = p_not_confirmed,
    questions = p_questions,
    other = p_other,
    pending = totalSent - p_customer_count
  WHERE date = p_date::text;
END;
$$ LANGUAGE plpgsql;
```

## DatabaseStorage Implementation

### Complete Implementation Example

```typescript
// server/storage-database.ts - Full implementation
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, desc, gte, lte, and, sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import type { 
  IStorage, 
  DashboardMetrics, 
  ChartData, 
  CategoryData,
  Batch,
  BatchQueryParams,
  BatchResponse 
} from './storage';

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    
    // Initialize PostgreSQL connection pool
    const dbConfig = {
      host: config[`${config.MODE}_DB_HOST`],
      port: parseInt(config[`${config.MODE}_DB_PORT`]),
      database: config[`${config.MODE}_DB_NAME`],
      user: config[`${config.MODE}_DB_USER`],
      password: config[`${config.MODE}_DB_PASSWORD`],
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(dbConfig);
    this.db = drizzle(this.pool, { schema });
    
    console.log(`[DatabaseStorage] Connected to ${config.MODE} database`);
  }

  async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[DatabaseStorage] Connection test successful');
    } catch (error) {
      console.error('[DatabaseStorage] Connection test failed:', error);
      throw error;
    }
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get the latest daily stats
      const [latest] = await this.db
        .select()
        .from(schema.dailyStats)
        .orderBy(desc(schema.dailyStats.date))
        .limit(1);

      if (!latest) {
        // Return empty metrics if no data
        return {
          date: new Date().toISOString().split('T')[0],
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

      // Calculate response rate
      const responseRate = latest.totalSent > 0
        ? Math.round((latest.totalReceived / latest.totalSent) * 100)
        : 0;

      return {
        date: latest.date,
        totalSent: latest.totalSent,
        totalReceived: latest.totalReceived,
        confirmed: latest.confirmed,
        notConfirmed: latest.notConfirmed,
        questions: latest.questions,
        other: latest.other,
        pending: latest.pending,
        responseRate
      };
    } catch (error) {
      console.error('[DatabaseStorage] Error getting dashboard metrics:', error);
      throw error;
    }
  }

  async getChartData(days: number = 7): Promise<ChartData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      const startDateStr = startDate.toISOString().split('T')[0];

      const data = await this.db
        .select({
          date: schema.dailyStats.date,
          sent: schema.dailyStats.totalSent,
          received: schema.dailyStats.totalReceived
        })
        .from(schema.dailyStats)
        .where(gte(schema.dailyStats.date, startDateStr))
        .orderBy(schema.dailyStats.date);

      return data;
    } catch (error) {
      console.error('[DatabaseStorage] Error getting chart data:', error);
      throw error;
    }
  }

  async getCategoryData(): Promise<CategoryData[]> {
    try {
      const metrics = await this.getDashboardMetrics();

      return [
        { 
          name: '確認済み', 
          value: metrics.confirmed, 
          color: '#10b981' 
        },
        { 
          name: '未確認', 
          value: metrics.notConfirmed, 
          color: '#ef4444' 
        },
        { 
          name: '質問', 
          value: metrics.questions, 
          color: '#f59e0b' 
        },
        { 
          name: 'その他', 
          value: metrics.other, 
          color: '#6b7280' 
        }
      ];
    } catch (error) {
      console.error('[DatabaseStorage] Error getting category data:', error);
      throw error;
    }
  }

  async getBatches(params: BatchQueryParams): Promise<BatchResponse> {
    try {
      // Build where conditions
      const conditions = [];
      
      if (params.type) {
        conditions.push(eq(schema.batches.type, params.type));
      }
      
      if (params.dateFrom) {
        conditions.push(gte(schema.batches.date, params.dateFrom));
      }
      
      if (params.dateTo) {
        conditions.push(lte(schema.batches.date, params.dateTo));
      }

      const whereClause = conditions.length > 0 
        ? and(...conditions) 
        : undefined;

      // Get total count
      const [countResult] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.batches)
        .where(whereClause);

      const total = countResult?.count || 0;

      // Get paginated batches
      const batches = await this.db
        .select()
        .from(schema.batches)
        .where(whereClause)
        .orderBy(desc(schema.batches.date), desc(schema.batches.createdAt))
        .limit(params.limit || 10)
        .offset(params.offset || 0);

      // Transform to include summary
      const batchesWithSummary = batches.map(batch => ({
        ...batch,
        summary: batch.type === 'sent'
          ? `${batch.customerCount} 件の配送確認を送信`
          : `${batch.customerCount} 件の返信を受信 (確認済み: ${batch.confirmed})`
      }));

      return {
        batches: batchesWithSummary,
        total
      };
    } catch (error) {
      console.error('[DatabaseStorage] Error getting batches:', error);
      throw error;
    }
  }

  async getBatch(id: string): Promise<Batch | null> {
    try {
      const [batch] = await this.db
        .select()
        .from(schema.batches)
        .where(eq(schema.batches.id, id))
        .limit(1);

      return batch || null;
    } catch (error) {
      console.error('[DatabaseStorage] Error getting batch:', error);
      throw error;
    }
  }

  async processSentBatch(date: string, customerCount: number): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        // Insert sent batch
        await tx.insert(schema.batches).values({
          id: `batch-sent-${date}`,
          date,
          type: 'sent',
          fileName: `delivery_confirmations_${date}.csv`,
          channel: 'LINE OA',
          customerCount,
          confirmed: 0,
          notConfirmed: 0,
          questions: 0,
          other: 0
        });

        // Update or insert daily stats
        await tx
          .insert(schema.dailyStats)
          .values({
            id: `stats-${date}`,
            date,
            totalSent: customerCount,
            totalReceived: 0,
            confirmed: 0,
            notConfirmed: 0,
            questions: 0,
            other: 0,
            pending: customerCount
          })
          .onConflictDoUpdate({
            target: schema.dailyStats.date,
            set: {
              totalSent: customerCount,
              pending: sql`${schema.dailyStats.totalSent} - ${schema.dailyStats.totalReceived}`
            }
          });
      });
    } catch (error) {
      console.error('[DatabaseStorage] Error processing sent batch:', error);
      throw error;
    }
  }

  async processReceivedBatch(
    date: string, 
    customerCount: number,
    breakdown: {
      confirmed: number;
      notConfirmed: number;
      questions: number;
      other: number;
    }
  ): Promise<void> {
    try {
      // Validate breakdown
      const total = breakdown.confirmed + breakdown.notConfirmed + 
                   breakdown.questions + breakdown.other;
      
      if (total !== customerCount) {
        throw new Error('Response breakdown does not match customer count');
      }

      await this.db.transaction(async (tx) => {
        // Insert received batch
        await tx.insert(schema.batches).values({
          id: `batch-received-${date}`,
          date,
          type: 'received',
          fileName: `delivery_responses_${date}.csv`,
          channel: 'LINE OA',
          customerCount,
          ...breakdown
        });

        // Update daily stats
        await tx
          .update(schema.dailyStats)
          .set({
            totalReceived: customerCount,
            confirmed: breakdown.confirmed,
            notConfirmed: breakdown.notConfirmed,
            questions: breakdown.questions,
            other: breakdown.other,
            pending: sql`${schema.dailyStats.totalSent} - ${customerCount}`
          })
          .where(eq(schema.dailyStats.date, date));
      });
    } catch (error) {
      console.error('[DatabaseStorage] Error processing received batch:', error);
      throw error;
    }
  }

  async applyRetentionPolicy(): Promise<void> {
    try {
      const retentionDays = this.config.RETENTION_DAYS || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      await this.db.transaction(async (tx) => {
        // Delete old batches
        const deletedBatches = await tx
          .delete(schema.batches)
          .where(lte(schema.batches.date, cutoffStr))
          .returning({ id: schema.batches.id });

        // Delete old daily stats
        const deletedStats = await tx
          .delete(schema.dailyStats)
          .where(lte(schema.dailyStats.date, cutoffStr))
          .returning({ id: schema.dailyStats.id });

        console.log(
          `[DatabaseStorage] Retention policy applied: ` +
          `${deletedBatches.length} batches, ${deletedStats.length} stats deleted`
        );
      });
    } catch (error) {
      console.error('[DatabaseStorage] Error applying retention policy:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.pool.end();
      console.log('[DatabaseStorage] Connection pool closed');
    } catch (error) {
      console.error('[DatabaseStorage] Error during cleanup:', error);
      throw error;
    }
  }
}
```

## Testing the Migration

### Test Scripts

```typescript
// scripts/test-database.ts
import { config } from 'dotenv';
import { DatabaseStorage } from '../server/storage-database';
import { validateConfig } from '../server/config-validator';

async function testDatabaseStorage() {
  // Load environment
  config();
  
  // Validate configuration
  const appConfig = validateConfig();
  
  // Create storage instance
  const storage = new DatabaseStorage(appConfig);
  
  try {
    // Test connection
    console.log('Testing connection...');
    await storage.testConnection();
    
    // Test dashboard metrics
    console.log('Testing dashboard metrics...');
    const metrics = await storage.getDashboardMetrics();
    console.log('Metrics:', metrics);
    
    // Test chart data
    console.log('Testing chart data...');
    const chartData = await storage.getChartData(7);
    console.log('Chart data points:', chartData.length);
    
    // Test batch query
    console.log('Testing batch query...');
    const batches = await storage.getBatches({
      type: 'sent',
      limit: 5
    });
    console.log('Batches found:', batches.total);
    
    // Test processing new batch
    console.log('Testing batch processing...');
    const today = new Date().toISOString().split('T')[0];
    await storage.processSentBatch(today, 150);
    console.log('Sent batch processed');
    
    await storage.processReceivedBatch(today, 120, {
      confirmed: 72,
      notConfirmed: 18,
      questions: 10,
      other: 20
    });
    console.log('Received batch processed');
    
    // Test retention policy
    console.log('Testing retention policy...');
    await storage.applyRetentionPolicy();
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await storage.cleanup();
  }
}

// Run tests
testDatabaseStorage();
```

### Verification Queries

```sql
-- Verify data integrity
SELECT 
  date,
  totalSent,
  totalReceived,
  pending,
  CASE 
    WHEN totalSent > 0 THEN ROUND((totalReceived::numeric / totalSent) * 100, 2)
    ELSE 0
  END as response_rate
FROM daily_stats
ORDER BY date DESC
LIMIT 10;

-- Check batch consistency
SELECT 
  date,
  COUNT(CASE WHEN type = 'sent' THEN 1 END) as sent_batches,
  COUNT(CASE WHEN type = 'received' THEN 1 END) as received_batches
FROM batches
GROUP BY date
ORDER BY date DESC;

-- Verify response breakdown
SELECT 
  date,
  customerCount,
  confirmed + notConfirmed + questions + other as total_responses,
  CASE 
    WHEN customerCount = confirmed + notConfirmed + questions + other THEN 'Valid'
    ELSE 'Invalid'
  END as validation
FROM batches
WHERE type = 'received'
ORDER BY date DESC;
```

## Migration Checklist

### Pre-Migration
- [ ] PostgreSQL installed and running
- [ ] Database created with proper user permissions
- [ ] Environment variables configured
- [ ] Backup of any existing data

### Migration Steps
- [ ] Run schema migration scripts
- [ ] Verify all tables and indexes created
- [ ] Implement DatabaseStorage class
- [ ] Update storage factory
- [ ] Run test scripts
- [ ] Import initial/sample data
- [ ] Verify data integrity

### Post-Migration
- [ ] Test all API endpoints
- [ ] Verify dashboard displays correctly
- [ ] Test CSV export functionality
- [ ] Set up automated backups
- [ ] Configure monitoring
- [ ] Document any custom procedures

### Rollback Plan
- [ ] Keep MOCKUP mode available
- [ ] Database backup before migration
- [ ] Schema rollback scripts prepared
- [ ] Environment variable quick switch

## Common Issues and Solutions

### Issue 1: Connection Timeout
```typescript
// Solution: Increase connection timeout
const pool = new Pool({
  connectionTimeoutMillis: 5000,  // Increase from 2000
  // ... other config
});
```

### Issue 2: Timezone Issues
```sql
-- Ensure consistent timezone handling
SET timezone = 'Asia/Tokyo';

-- Or in connection string
postgresql://user:pass@host/db?timezone=Asia/Tokyo
```

### Issue 3: Large Data Import
```bash
# Use COPY for bulk imports
psql -d lineoa_monitoring -c "\COPY batches FROM 'batches.csv' CSV HEADER"
```

### Issue 4: Performance Issues
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_batches_created_at ON batches(createdAt);

-- Analyze tables after bulk import
ANALYZE batches;
ANALYZE daily_stats;
```

## Conclusion

This migration guide provides a complete path from the mockup implementation to a production-ready PostgreSQL database. The key aspects are:

1. **Schema Design**: Matches the mock data structure exactly
2. **Business Logic**: Preserves all rules from the mock implementation
3. **Data Patterns**: Replicates the mock data generation patterns
4. **Implementation**: Complete DatabaseStorage class ready for use
5. **Testing**: Comprehensive test scripts and verification queries
6. **Migration Path**: Step-by-step process with rollback options

Follow this guide carefully, test thoroughly at each step, and maintain the ability to switch back to MOCKUP mode if needed during development.