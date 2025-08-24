# Development Guide

## Complete Setup and Development Instructions

### Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Development Workflow](#development-workflow)
- [Mode-Specific Development](#mode-specific-development)
- [Database Development](#database-development)
- [Frontend Development](#frontend-development)
- [Backend Development](#backend-development)
- [Testing Strategies](#testing-strategies)
- [Debugging Guide](#debugging-guide)
- [Common Tasks](#common-tasks)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.0.0+ | JavaScript runtime |
| npm | 10.0.0+ | Package manager |
| PostgreSQL | 15.0+ | Database (DEV/PROD modes) |
| Git | 2.0+ | Version control |
| VS Code | Latest | Recommended IDE |

### Optional Software

| Software | Purpose |
|----------|---------|
| Docker | Container development |
| pgAdmin | PostgreSQL GUI |
| Postman | API testing |
| TablePlus | Database client |

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "mikestead.dotenv"
  ]
}
```

## Initial Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/lineoa-monitoring.git
cd lineoa-monitoring

# Or if you have an existing fork
git clone https://github.com/your-username/lineoa-monitoring.git
cd lineoa-monitoring
git remote add upstream https://github.com/your-org/lineoa-monitoring.git
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm run check
```

### 3. Setup Environment

```bash
# For MOCKUP mode (default, no database needed)
cp .env.example.mockup .env

# For DEV mode (requires PostgreSQL)
cp .env.example.dev .env

# For PROD mode (production database)
cp .env.example.prod .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

### 4. Quick Start

```bash
# Start in MOCKUP mode (no database required)
npm run dev

# Application will be available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

## Environment Configuration

### MOCKUP Mode Configuration

```bash
# .env for MOCKUP mode
MODE=MOCKUP
MOCK_DATA_SEED=12345
RETENTION_DAYS=30
```

**Use Cases:**
- UI development
- Demonstrations
- Testing without database
- Quick prototyping

### DEV Mode Configuration

```bash
# .env for DEV mode
MODE=DEV
RETENTION_DAYS=30

# Development Database
DEV_DB_HOST=localhost
DEV_DB_PORT=5432
DEV_DB_NAME=lineoa_dev
DEV_DB_USER=dev_user
DEV_DB_PASSWORD=dev_password
```

**Setup PostgreSQL for Development:**

```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-client-15
sudo systemctl start postgresql

# Create development database
sudo -u postgres psql
```

```sql
-- In PostgreSQL
CREATE DATABASE lineoa_dev;
CREATE USER dev_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE lineoa_dev TO dev_user;
\q
```

### PROD Mode Configuration

```bash
# .env for PROD mode
MODE=PROD
RETENTION_DAYS=30

# Production Database (use environment variables in production)
PROD_DB_HOST=${DATABASE_HOST}
PROD_DB_PORT=${DATABASE_PORT}
PROD_DB_NAME=${DATABASE_NAME}
PROD_DB_USER=${DATABASE_USER}
PROD_DB_PASSWORD=${DATABASE_PASSWORD}
```

**Security Notes:**
- Never commit `.env` files with real credentials
- Use environment variables in production
- Rotate credentials regularly
- Use SSL/TLS for database connections

## Development Workflow

### Standard Development Flow

```bash
# 1. Start development server
npm run dev

# 2. Make your changes
# Frontend files: client/src/
# Backend files: server/
# Shared files: shared/

# 3. Check types
npm run check

# 4. Build for production
npm run build

# 5. Test production build
npm run start
```

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push to your fork
git push origin feature/your-feature-name

# 4. Create pull request on GitHub
```

### Commit Message Convention

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

Examples:
feat(dashboard): add real-time updates
fix(api): correct response rate calculation
docs(readme): update installation steps
```

## Mode-Specific Development

### Developing in MOCKUP Mode

```typescript
// server/storage-mockup.ts

// Modify mock data generation
private generateCustomers(count: number): Customer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `customer-${i + 1}`,
    name: this.generateJapaneseName(),
    phone: this.generatePhoneNumber()
  }));
}

// Adjust data patterns
const PATTERNS = {
  CUSTOMERS_PER_DAY: { min: 100, max: 250 }, // Changed range
  RESPONSE_RATE: { min: 0.70, max: 0.90 },   // Higher response rate
};
```

### Developing in DEV Mode

```bash
# 1. Ensure PostgreSQL is running
pg_isready

# 2. Apply database migrations
npm run db:push

# 3. Seed development data (optional)
npm run db:seed

# 4. Start development
npm run dev

# 5. View database with Drizzle Studio
npm run db:studio
```

### Switching Between Modes

```bash
# Quick switch (restart required)
MODE=MOCKUP npm run dev  # Temporary override

# Or modify .env file
sed -i 's/MODE=.*/MODE=DEV/' .env  # Linux/Mac
npm run dev  # Restart server
```

## Database Development

### Setting Up Database

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Schema Changes

```typescript
// shared/schema.ts

// Add new table
export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  customerId: varchar('customer_id', { length: 255 }).notNull(),
  message: text('message').notNull(),
  sentAt: timestamp('sent_at').defaultNow(),
  read: boolean('read').default(false),
});

// Add new column to existing table
export const batches = pgTable('batches', {
  // ... existing columns
  processedBy: varchar('processed_by', { length: 255 }), // New column
});
```

After schema changes:
```bash
# Generate new migration
npm run db:generate

# Review migration file
cat drizzle/0001_add_notifications.sql

# Apply migration
npm run db:push
```

### Database Queries

```typescript
// server/storage-database.ts

// Simple query
const customers = await this.db
  .select()
  .from(schema.customers)
  .limit(10);

// Complex query with joins
const batchesWithStats = await this.db
  .select({
    batch: schema.batches,
    stats: schema.dailyStats,
  })
  .from(schema.batches)
  .leftJoin(
    schema.dailyStats,
    eq(schema.batches.date, schema.dailyStats.date)
  )
  .where(eq(schema.batches.type, 'sent'))
  .orderBy(desc(schema.batches.date));

// Transaction
await this.db.transaction(async (tx) => {
  await tx.insert(schema.batches).values(batchData);
  await tx.update(schema.dailyStats)
    .set({ totalSent: newTotal })
    .where(eq(schema.dailyStats.date, today));
});
```

### Database Utilities

```bash
# Backup database
pg_dump -U dev_user -d lineoa_dev > backup.sql

# Restore database
psql -U dev_user -d lineoa_dev < backup.sql

# Reset database
dropdb lineoa_dev && createdb lineoa_dev
npm run db:push
```

## Frontend Development

### Component Development

```typescript
// client/src/components/MyComponent.tsx

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function MyComponent() {
  const [count, setCount] = useState(0);

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold">Counter: {count}</h2>
      <Button onClick={() => setCount(c => c + 1)}>
        Increment
      </Button>
    </Card>
  );
}
```

### Adding New Routes

```typescript
// client/src/app.tsx

import { Route, Switch } from 'wouter';
import { Dashboard } from './pages/dashboard';
import { Settings } from './pages/settings'; // New page

export function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={Settings} /> {/* New route */}
      <Route>404 - Not Found</Route>
    </Switch>
  );
}
```

### API Integration

```typescript
// client/src/hooks/useCustomData.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// GET request
export function useCustomData() {
  return useQuery({
    queryKey: ['/api/custom-data'],
    queryFn: async () => {
      const response = await fetch('/api/custom-data');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });
}

// POST request
export function useCreateItem() {
  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
    },
  });
}
```

### Styling with Tailwind

```tsx
// Using Tailwind classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
  <button className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
    Click me
  </button>
</div>

// Using Shadcn/UI components
import { Alert, AlertDescription } from '@/components/ui/alert';

<Alert>
  <AlertDescription>
    This is an alert message using Shadcn/UI
  </AlertDescription>
</Alert>
```

## Backend Development

### Adding New API Endpoints

```typescript
// server/routes.ts

// Add new endpoint
app.get('/api/custom-endpoint', async (req, res) => {
  try {
    // Input validation
    const { param } = req.query;
    if (!param) {
      return res.status(400).json({ 
        error: 'Parameter required' 
      });
    }

    // Business logic
    const storage = req.app.locals.storage as IStorage;
    const data = await storage.getCustomData(param);

    // Response
    res.json(data);
  } catch (error) {
    console.error('Error in custom endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});
```

### Implementing Storage Methods

```typescript
// server/storage.ts - Add to interface
export interface IStorage {
  // ... existing methods
  getCustomData(param: string): Promise<CustomData>;
}

// server/storage-mockup.ts - Mock implementation
async getCustomData(param: string): Promise<CustomData> {
  return {
    id: `custom-${param}`,
    value: Math.random() * 100,
    timestamp: new Date().toISOString(),
  };
}

// server/storage-database.ts - Database implementation
async getCustomData(param: string): Promise<CustomData> {
  const [result] = await this.db
    .select()
    .from(schema.customData)
    .where(eq(schema.customData.param, param))
    .limit(1);
  
  return result || this.getDefaultCustomData();
}
```

### Middleware Development

```typescript
// server/middleware/logging.ts

export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

// server/index.ts - Use middleware
import { requestLogger } from './middleware/logging';

app.use(requestLogger);
```

### Input Validation with Zod

```typescript
// shared/validation.ts

import { z } from 'zod';

export const CreateBatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['sent', 'received']),
  customerCount: z.number().min(0).max(10000),
  breakdown: z.object({
    confirmed: z.number().min(0),
    notConfirmed: z.number().min(0),
    questions: z.number().min(0),
    other: z.number().min(0),
  }).optional(),
});

// server/routes.ts - Use validation
app.post('/api/batches', async (req, res) => {
  try {
    const validated = CreateBatchSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        errors: error.errors 
      });
    }
    throw error;
  }
});
```

## Testing Strategies

### Unit Testing Setup

```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Add test script to package.json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

### Frontend Component Testing

```typescript
// client/src/components/MetricCard.test.tsx

import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('displays the correct value and label', () => {
    render(
      <MetricCard 
        label="Total Sent" 
        value={150} 
        icon={<Icon />} 
      />
    );

    expect(screen.getByText('Total Sent')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <MetricCard 
        label="Total" 
        value={0} 
        isLoading={true} 
      />
    );

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
});
```

### Backend API Testing

```typescript
// server/routes.test.ts

import request from 'supertest';
import { app } from './app';
import { MockupStorage } from './storage-mockup';

describe('API Endpoints', () => {
  let storage: MockupStorage;

  beforeEach(() => {
    storage = new MockupStorage({ MODE: 'MOCKUP' });
    app.locals.storage = storage;
  });

  describe('GET /api/dashboard/metrics', () => {
    it('returns dashboard metrics', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('totalSent');
      expect(response.body).toHaveProperty('responseRate');
      expect(response.body.responseRate).toBeGreaterThanOrEqual(0);
      expect(response.body.responseRate).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/batches', () => {
    it('filters batches by type', async () => {
      const response = await request(app)
        .get('/api/batches?type=sent')
        .expect(200);

      expect(response.body.batches).toBeInstanceOf(Array);
      response.body.batches.forEach(batch => {
        expect(batch.type).toBe('sent');
      });
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/workflow.test.ts

describe('Complete Workflow', () => {
  it('processes batch from creation to stats update', async () => {
    // 1. Create sent batch
    const sentBatch = await storage.processSentBatch(
      '2024-01-15',
      150
    );

    // 2. Verify batch created
    const batch = await storage.getBatch(sentBatch.id);
    expect(batch.customerCount).toBe(150);

    // 3. Create received batch
    await storage.processReceivedBatch('2024-01-15', 120, {
      confirmed: 72,
      notConfirmed: 18,
      questions: 10,
      other: 20,
    });

    // 4. Verify stats updated
    const metrics = await storage.getDashboardMetrics();
    expect(metrics.totalSent).toBe(150);
    expect(metrics.totalReceived).toBe(120);
    expect(metrics.responseRate).toBe(80);
  });
});
```

### E2E Testing with Playwright

```typescript
// tests/e2e/dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('displays metrics on load', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for metrics to load
    await page.waitForSelector('[data-testid="metrics-overview"]');

    // Check metric cards are visible
    await expect(page.locator('text=送信総数')).toBeVisible();
    await expect(page.locator('text=受信総数')).toBeVisible();
    await expect(page.locator('text=応答率')).toBeVisible();

    // Check chart is rendered
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('exports CSV successfully', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Click on a batch row
    await page.click('[data-testid="batch-row"]:first-child');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("CSVエクスポート")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
```

## Debugging Guide

### Frontend Debugging

```typescript
// Use React DevTools
// Install browser extension: React Developer Tools

// Debug API calls
window.addEventListener('fetch', (event) => {
  console.log('API Call:', event.request.url);
});

// Debug component renders
import { useEffect } from 'react';

export function MyComponent() {
  useEffect(() => {
    console.log('Component mounted/updated');
  });

  // Add debug output
  console.log('Rendering with props:', props);

  return <div>...</div>;
}

// Debug TanStack Query
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Add query debugging
      onError: (error) => {
        console.error('Query error:', error);
      },
      onSuccess: (data) => {
        console.log('Query success:', data);
      },
    },
  },
});
```

### Backend Debugging

```typescript
// server/index.ts - Add debug logging

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

// Debug storage operations
class DatabaseStorage implements IStorage {
  async getDashboardMetrics() {
    console.log('[Storage] Getting dashboard metrics');
    const start = Date.now();
    
    try {
      const result = await this.db.select()...;
      console.log(`[Storage] Query took ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      console.error('[Storage] Error:', error);
      throw error;
    }
  }
}

// Debug database queries
const db = drizzle(pool, {
  logger: true, // Enable query logging
});
```

### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:backend"],
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "MODE": "MOCKUP",
        "DEBUG": "*"
      }
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/client"
    }
  ]
}
```

### Performance Debugging

```typescript
// Measure API response times
app.use((req, res, next) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    if (duration > 1000) {
      console.warn(`Slow request: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});

// Profile database queries
const slowQueries = [];

db.on('query', (query, duration) => {
  if (duration > 100) {
    slowQueries.push({ query, duration });
    console.warn(`Slow query (${duration}ms):`, query);
  }
});
```

## Common Tasks

### Adding a New Feature

1. **Plan the feature**
   ```markdown
   Feature: Real-time notifications
   - WebSocket connection
   - Notification component
   - Database table for notifications
   - API endpoint for fetching notifications
   ```

2. **Update schema**
   ```typescript
   // shared/schema.ts
   export const notifications = pgTable('notifications', {
     id: varchar('id').primaryKey(),
     message: text('message').notNull(),
     createdAt: timestamp('created_at').defaultNow(),
   });
   ```

3. **Implement backend**
   ```typescript
   // server/routes.ts
   app.get('/api/notifications', async (req, res) => {
     const notifications = await storage.getNotifications();
     res.json(notifications);
   });
   ```

4. **Implement frontend**
   ```typescript
   // client/src/components/Notifications.tsx
   export function Notifications() {
     const { data } = useQuery({
       queryKey: ['/api/notifications'],
       queryFn: fetchNotifications,
     });
     
     return <NotificationList items={data} />;
   }
   ```

### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install package-name@latest

# Update to major version
npm install package-name@^2.0.0

# After updating, test everything
npm run check
npm run build
npm run test
```

### Performance Optimization

1. **Frontend optimization**
   ```typescript
   // Use React.memo for expensive components
   export const ExpensiveComponent = React.memo(({ data }) => {
     return <ComplexVisualization data={data} />;
   });

   // Use useMemo for expensive calculations
   const processedData = useMemo(() => {
     return expensiveProcessing(rawData);
   }, [rawData]);
   ```

2. **Backend optimization**
   ```typescript
   // Add caching
   const cache = new Map();
   
   async function getCachedData(key: string) {
     if (cache.has(key)) {
       return cache.get(key);
     }
     
     const data = await fetchData(key);
     cache.set(key, data);
     
     // Clear cache after 5 minutes
     setTimeout(() => cache.delete(key), 5 * 60 * 1000);
     
     return data;
   }
   ```

3. **Database optimization**
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_batches_date_type ON batches(date, type);
   
   -- Analyze query performance
   EXPLAIN ANALYZE SELECT * FROM batches WHERE date > '2024-01-01';
   ```

## Deployment

### Building for Production

```bash
# Build both frontend and backend
npm run build

# Output structure:
# dist/
#   ├── client/     # Frontend static files
#   └── server/     # Backend compiled files
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production

EXPOSE 3000
CMD ["npm", "run", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      MODE: PROD
      PROD_DB_HOST: db
      PROD_DB_PORT: 5432
      PROD_DB_NAME: lineoa
      PROD_DB_USER: ${DB_USER}
      PROD_DB_PASSWORD: ${DB_PASSWORD}
    depends_on:
      - db

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: lineoa
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

volumes:
  postgres_data:
```

### Environment-Specific Builds

```bash
# Development build
NODE_ENV=development npm run build

# Production build with optimizations
NODE_ENV=production npm run build

# Staging build
NODE_ENV=staging npm run build
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error tracking setup
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] Rollback plan prepared

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

```bash
# Error: EADDRINUSE: address already in use :::3000

# Solution: Find and kill process
lsof -i :3000  # Find process
kill -9 <PID>  # Kill process

# Or use different port
PORT=3001 npm run dev
```

#### 2. Database Connection Failed

```bash
# Error: ECONNREFUSED 127.0.0.1:5432

# Solutions:
# 1. Check PostgreSQL is running
pg_isready

# 2. Check connection settings
psql -h localhost -p 5432 -U dev_user -d lineoa_dev

# 3. Check pg_hba.conf allows connections
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: local all all md5

# 4. Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 3. TypeScript Errors

```bash
# Error: Type errors during build

# Solutions:
# 1. Clean and rebuild
rm -rf node_modules dist
npm install
npm run check

# 2. Update TypeScript
npm install typescript@latest

# 3. Check tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true
  }
}
```

#### 4. Build Failures

```bash
# Error: Build failed

# Solutions:
# 1. Clear cache
npm cache clean --force

# 2. Delete lock file and reinstall
rm package-lock.json
npm install

# 3. Check Node version
node --version  # Should be 20+

# 4. Verbose logging
npm run build --verbose
```

#### 5. MOCKUP Mode Not Working

```typescript
// Check environment variable
console.log('MODE:', process.env.MODE);

// Verify MockupStorage is loaded
if (config.MODE === 'MOCKUP') {
  console.log('Using MockupStorage');
  storage = new MockupStorage(config);
}

// Check seed value
console.log('Seed:', config.MOCK_DATA_SEED);
```

#### 6. API Returns Empty Data

```typescript
// Debug storage calls
async getDashboardMetrics() {
  console.log('Getting metrics...');
  const result = await this.generateMockData();
  console.log('Generated:', result);
  return result;
}

// Check API route
app.get('/api/dashboard/metrics', (req, res) => {
  console.log('Metrics endpoint called');
  const data = await storage.getDashboardMetrics();
  console.log('Returning:', data);
  res.json(data);
});
```

### Performance Issues

#### Slow API Responses

```typescript
// Add timing logs
const start = Date.now();
const result = await heavyOperation();
console.log(`Operation took ${Date.now() - start}ms`);

// Use database query analysis
EXPLAIN ANALYZE SELECT * FROM large_table;

// Add pagination
const results = await db.select()
  .from(table)
  .limit(20)
  .offset(page * 20);
```

#### High Memory Usage

```bash
# Monitor memory
node --max-old-space-size=4096 server/index.js

# Profile memory usage
node --inspect server/index.js
# Open chrome://inspect in Chrome

# Check for memory leaks
npm install --save-dev clinic
npx clinic doctor -- node server/index.js
```

### Getting Help

1. **Check Documentation**
   - README.md
   - ARCHITECTURE.md
   - DATABASE_MIGRATION.md
   - API_REFERENCE.md

2. **Search Issues**
   ```bash
   # Search GitHub issues
   https://github.com/your-org/lineoa-monitoring/issues
   ```

3. **Debug Logging**
   ```bash
   # Enable debug logging
   DEBUG=* npm run dev
   ```

4. **Community Resources**
   - Stack Overflow: Tag with `lineoa-monitoring`
   - Discord: Join development channel
   - Slack: #lineoa-dev channel

## Best Practices

### Code Quality

1. **Use TypeScript strictly**
   ```typescript
   // Good
   function calculate(a: number, b: number): number {
     return a + b;
   }

   // Bad
   function calculate(a: any, b: any) {
     return a + b;
   }
   ```

2. **Handle errors properly**
   ```typescript
   // Good
   try {
     const result = await riskyOperation();
     return { success: true, data: result };
   } catch (error) {
     console.error('Operation failed:', error);
     return { success: false, error: error.message };
   }

   // Bad
   const result = await riskyOperation(); // No error handling
   ```

3. **Use meaningful names**
   ```typescript
   // Good
   const responseRate = (received / sent) * 100;

   // Bad
   const rr = (r / s) * 100;
   ```

### Security

1. **Never commit secrets**
   ```bash
   # .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Validate all inputs**
   ```typescript
   const schema = z.object({
     email: z.string().email(),
     age: z.number().min(0).max(150),
   });

   const validated = schema.parse(userInput);
   ```

3. **Use prepared statements**
   ```typescript
   // Good - Parameterized query
   await db.select().from(users).where(eq(users.id, userId));

   // Bad - SQL injection risk
   await db.execute(`SELECT * FROM users WHERE id = ${userId}`);
   ```

### Performance

1. **Optimize bundle size**
   ```bash
   # Analyze bundle
   npm run build -- --analyze
   ```

2. **Use lazy loading**
   ```typescript
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

3. **Cache expensive operations**
   ```typescript
   const memoizedValue = useMemo(() => {
     return expensiveCalculation(data);
   }, [data]);
   ```

## Conclusion

This development guide provides comprehensive instructions for setting up, developing, and deploying the LINE OA Monitoring System. Key points:

1. **Three-mode architecture** allows flexible development
2. **MOCKUP mode** enables development without database
3. **Clear separation** between frontend and backend
4. **TypeScript throughout** ensures type safety
5. **Comprehensive tooling** for development efficiency

For additional help:
- Review other documentation files
- Check GitHub issues
- Contact the development team

Happy coding! 🚀