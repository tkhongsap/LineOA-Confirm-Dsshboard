# System Architecture Documentation

## LINE OA Delivery Confirmation Monitoring System

### Table of Contents
- [System Overview](#system-overview)
- [Architecture Layers](#architecture-layers)
- [Mode-Based Operation](#mode-based-operation)
- [Technology Stack](#technology-stack)
- [Data Flow](#data-flow)
- [Component Architecture](#component-architecture)
- [Deployment Architecture](#deployment-architecture)

## System Overview

This is a monitoring dashboard for LINE Official Account (LINE OA) delivery confirmations. The system tracks message batches sent to customers, collects their responses, and provides real-time analytics through a web dashboard.

### Key Features
- Daily batch tracking of delivery confirmations
- Response categorization (Confirmed, Not Confirmed, Questions, Other)
- Real-time metrics and analytics
- Historical trend analysis
- CSV export functionality
- Multi-mode operation (Mockup/Development/Production)

## Architecture Layers

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│                   React + TypeScript + Vite                  │
│                  TanStack Query + Shadcn/UI                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────┴────────────────────────────────────┐
│                     Application Layer                        │
│                  Express.js + TypeScript                     │
│                    RESTful API Routes                        │
│                     Zod Validation                           │
└────────────────────────┬────────────────────────────────────┘
                         │ Storage Interface
┌────────────────────────┴────────────────────────────────────┐
│                      Storage Layer                           │
│                   IStorage Interface                         │
│    ┌──────────────┬──────────────┬──────────────┐          │
│    │   MockupStorage  │  DatabaseStorage  │  Future...  │   │
│    │   (Complete)     │  (Placeholder)    │             │   │
│    └──────────────┴──────────────┴──────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. Presentation Layer (Frontend)
- **Location**: `/client`
- **Responsibilities**:
  - User interface rendering
  - User interaction handling
  - Data visualization (charts, tables)
  - Client-side routing
  - API communication via TanStack Query

#### 2. Application Layer (Backend)
- **Location**: `/server`
- **Responsibilities**:
  - HTTP request handling
  - Business logic orchestration
  - Request/response validation
  - Mode-based storage selection
  - API route management

#### 3. Storage Layer
- **Location**: `/server/storage-*.ts`
- **Responsibilities**:
  - Data persistence
  - Query execution
  - Data aggregation
  - Mock data generation (MOCKUP mode)
  - Database operations (DEV/PROD modes)

## Mode-Based Operation

### Factory Pattern Implementation

```typescript
// server/storage.ts
export async function createStorage(config: AppConfig): Promise<IStorage> {
  switch (config.MODE) {
    case 'MOCKUP':
      return new MockupStorage(config);
    case 'DEV':
    case 'PROD':
      return new DatabaseStorage(config);
    default:
      throw new Error(`Unknown mode: ${config.MODE}`);
  }
}
```

### Operation Modes

#### MOCKUP Mode
- **Purpose**: Demonstrations, UI development, testing
- **Data Source**: Deterministic mock data generator
- **Key Features**:
  - Seeded random data for consistency
  - No database required
  - Instant startup
  - Predictable data patterns

#### DEV Mode
- **Purpose**: Development and testing with real database
- **Data Source**: PostgreSQL development database
- **Key Features**:
  - Real database operations
  - Schema migrations
  - Test data management
  - Debugging capabilities

#### PROD Mode
- **Purpose**: Production deployment
- **Data Source**: PostgreSQL production database
- **Key Features**:
  - Optimized performance
  - Data retention policies
  - Backup and recovery
  - Security hardening

## Technology Stack

### Frontend Technologies
```
React 18                 - UI framework
TypeScript 5.6          - Type safety
Vite 5                  - Build tool and dev server
TanStack Query 5        - Server state management
Shadcn/UI              - Component library
Tailwind CSS 3         - Utility-first CSS
Recharts               - Data visualization
Wouter                 - Client-side routing
Lucide React           - Icon system
```

### Backend Technologies
```
Node.js 20+            - Runtime environment
Express.js 4           - Web framework
TypeScript 5.6         - Type safety
Zod 3                  - Schema validation
Drizzle ORM           - Database ORM
PostgreSQL            - Database (DEV/PROD)
esbuild               - Backend bundling
```

### Shared Technologies
```
TypeScript            - Shared type definitions
Zod                   - Shared validation schemas
Drizzle Schema        - Database schema definitions
```

## Data Flow

### Request Flow Diagram

```
User Action → React Component → TanStack Query → API Call
                                                    ↓
                                              Express Route
                                                    ↓
                                              Validation (Zod)
                                                    ↓
                                              Storage Interface
                                                    ↓
                                        Storage Implementation
                                         (Mock/Database)
                                                    ↓
                                              Data Response
                                                    ↓
React Component ← TanStack Query ← API Response ← Express Route
```

### Data Flow Examples

#### 1. Dashboard Metrics Request
```
1. Dashboard component mounts
2. useQuery hook triggers GET /api/dashboard/metrics
3. Express route handler receives request
4. Route calls storage.getDashboardMetrics()
5. Storage implementation returns latest daily stats
6. Response validated and sent to client
7. TanStack Query caches response
8. Component renders metrics
```

#### 2. Batch Export Request
```
1. User clicks "Export CSV" button
2. Component triggers GET /api/batches/:id/export
3. Express route validates batch ID
4. Route calls storage.getBatch(id)
5. Storage returns batch data
6. Route generates CSV format
7. Response sent with CSV headers
8. Browser downloads file
```

## Component Architecture

### Frontend Component Hierarchy

```
App
├── Router (Wouter)
│   ├── Dashboard Page
│   │   ├── Header
│   │   │   └── SystemModeIndicator
│   │   ├── MetricsOverview
│   │   │   ├── MetricCard (Total Sent)
│   │   │   ├── MetricCard (Total Received)
│   │   │   ├── MetricCard (Response Rate)
│   │   │   └── MetricCard (Pending)
│   │   ├── ChartsSection
│   │   │   ├── LineChart (Trends)
│   │   │   └── PieChart (Categories)
│   │   └── MessageHistory
│   │       ├── Tabs (Sent/Received)
│   │       ├── DateRangePicker
│   │       ├── BatchTable
│   │       └── Pagination
│   └── Error Boundary
└── QueryClientProvider (TanStack Query)
```

### Backend Module Structure

```
server/
├── index.ts              - Express server initialization
├── routes.ts             - API route definitions
├── storage.ts            - Storage interface and factory
├── storage-mockup.ts     - Mock implementation
├── storage-database.ts   - Database implementation
├── config-validator.ts   - Environment validation
└── utils/
    └── csv-export.ts     - CSV generation utilities

shared/
├── schema.ts             - Drizzle ORM schemas
├── types.ts              - Shared TypeScript types
└── validation.ts         - Zod validation schemas
```

## Deployment Architecture

### Development Environment

```
┌─────────────────┐
│  Vite Dev Server │ (:5173)
│    (Frontend)    │
└────────┬────────┘
         │ Proxy
┌────────┴────────┐
│  Express Server  │ (:3000)
│    (Backend)     │
└────────┬────────┘
         │
┌────────┴────────┐
│   Mock Storage   │
│  (In-Memory)     │
└─────────────────┘
```

### Production Environment

```
┌─────────────────┐
│   Static Files   │
│  (Nginx/CDN)     │
└────────┬────────┘
         │
┌────────┴────────┐
│  Express Server  │
│   (Node.js)      │
└────────┬────────┘
         │
┌────────┴────────┐
│   PostgreSQL     │
│    Database      │
└─────────────────┘
```

### Container Architecture (Docker)

```yaml
services:
  frontend:
    - Nginx serving static files
    - Reverse proxy to backend
    
  backend:
    - Node.js Express application
    - Environment-based configuration
    
  database:
    - PostgreSQL 15+
    - Persistent volume for data
    - Automated backups
```

## Configuration Management

### Environment Variables Structure

```bash
# Mode Selection
MODE=MOCKUP|DEV|PROD

# Mockup Configuration
MOCK_DATA_SEED=12345
RETENTION_DAYS=30

# Database Configuration (DEV/PROD)
[MODE]_DB_HOST=localhost
[MODE]_DB_PORT=5432
[MODE]_DB_NAME=lineoa_monitoring
[MODE]_DB_USER=username
[MODE]_DB_PASSWORD=password
```

### Configuration Validation Flow

```
1. Environment variables loaded
2. Config validator checks MODE
3. Mode-specific schema applied
4. Validation errors formatted and reported
5. Valid config passed to storage factory
6. Storage implementation initialized
```

## Security Considerations

### API Security
- Input validation using Zod schemas
- SQL injection prevention via Drizzle ORM
- Rate limiting on API endpoints
- CORS configuration for frontend origin

### Data Security
- Environment variables for sensitive config
- No hardcoded credentials
- Secure database connections (SSL/TLS)
- Data retention policies

### Frontend Security
- Content Security Policy headers
- XSS prevention via React
- Secure cookie handling
- HTTPS enforcement

## Performance Optimizations

### Frontend Optimizations
- Code splitting with Vite
- Lazy loading of components
- TanStack Query caching
- Optimistic updates
- Virtual scrolling for large lists

### Backend Optimizations
- Database connection pooling
- Query optimization with indexes
- Response compression
- Caching strategies
- Batch processing

### Database Optimizations
- Proper indexing strategy
- Query optimization
- Partitioning for time-series data
- Vacuum and analyze scheduling
- Connection pooling

## Monitoring and Observability

### Application Metrics
- Request/response times
- Error rates
- Database query performance
- Memory usage
- CPU utilization

### Business Metrics
- Daily active users
- Response rates
- System availability
- Data processing times
- Export frequency

### Logging Strategy
- Structured logging (JSON format)
- Log levels (ERROR, WARN, INFO, DEBUG)
- Correlation IDs for request tracking
- Centralized log aggregation

## Future Architecture Considerations

### Scalability Options
1. **Horizontal Scaling**: Load balancer with multiple backend instances
2. **Database Replication**: Read replicas for query distribution
3. **Caching Layer**: Redis for frequently accessed data
4. **Message Queue**: For asynchronous batch processing
5. **Microservices**: Separate services for different domains

### Feature Extensions
1. **Real-time Updates**: WebSocket for live data
2. **Multi-tenant Support**: Organization-based data isolation
3. **Advanced Analytics**: Machine learning for predictions
4. **API Gateway**: Centralized API management
5. **Mobile Application**: Native mobile dashboard

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development (MOCKUP mode)
npm run dev

# Build for production
npm run build

# Run production build
npm run start
```

### Database Development
```bash
# Apply migrations (DEV mode)
npm run db:push

# Generate migration files
npm run db:generate

# Run database studio
npm run db:studio
```

### Testing Strategy
```bash
# Type checking
npm run check

# Unit tests (when implemented)
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Conclusion

This architecture provides a solid foundation for a scalable, maintainable monitoring system. The clear separation of concerns, mode-based operation, and comprehensive abstraction layers ensure the system can evolve from mockup to production seamlessly while maintaining code quality and developer productivity.