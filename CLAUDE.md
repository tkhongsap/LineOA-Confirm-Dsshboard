# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Run development server (hot reload, MOCKUP mode by default)
npm run build        # Build for production (Vite for frontend, esbuild for backend)
npm run start        # Run production build
npm run check        # TypeScript type checking
npm run db:push      # Apply database migrations (DEV/PROD modes only)
```

## Architecture Overview

### Three-Mode Operation System
The application operates in three distinct modes, controlled by the `MODE` environment variable:

1. **MOCKUP Mode** (default): Deterministic mock data for demos/UI development
2. **DEV Mode**: Development PostgreSQL database connection
3. **PROD Mode**: Production PostgreSQL database with live data

Mode switching is handled through a factory pattern in `server/storage.ts`, which returns the appropriate storage implementation based on the environment configuration.

### Core Architecture Pattern

```
client/                     server/                     shared/
  ├── React + TypeScript      ├── Express.js             ├── Zod schemas
  ├── TanStack Query          ├── Storage Interface      ├── Drizzle ORM types
  └── Shadcn/UI + Tailwind    └── Mode-specific impl     └── Shared types
```

#### Storage Abstraction Layer
- **Interface**: `server/storage.ts` defines `IStorage` interface
- **Implementations**:
  - `server/storage-mockup.ts`: Complete implementation with deterministic seeded data
  - `server/storage-database.ts`: Placeholder for PostgreSQL operations (DEV/PROD)
- **Factory Pattern**: `createStorage()` returns appropriate implementation based on MODE

#### Data Flow
1. Frontend makes API calls via TanStack Query (`client/lib/queryClient.ts`)
2. Express routes (`server/routes.ts`) handle requests
3. Routes delegate to storage layer via `IStorage` interface
4. Storage implementation returns data (mock or database)
5. Zod schemas (`shared/schema.ts`) ensure type safety across boundaries

### Key Design Decisions

#### Deterministic Mock Data
- Uses `SeededRandom` class for consistent data generation
- Same seed (`MOCK_DATA_SEED`) produces identical data across instances
- Enables reliable demos and UI testing without database

#### Configuration Validation
- `server/config-validator.ts` uses Zod for runtime validation
- Different validation schemas per mode (mockup/dev/prod)
- Fails fast with detailed error messages on misconfiguration

#### Shared Schema Strategy
- Single source of truth in `shared/schema.ts`
- Drizzle ORM schemas define database structure
- Zod schemas provide runtime validation
- TypeScript types derived from both

## Environment Configuration

### Setup for Each Mode
```bash
# Copy appropriate template
cp .env.example.mockup .env    # For MOCKUP mode
cp .env.example.dev .env        # For DEV mode  
cp .env.example.prod .env       # For PROD mode
```

### Critical Environment Variables
- `MODE`: Controls which storage implementation to use (MOCKUP|DEV|PROD)
- `MOCK_DATA_SEED`: Ensures consistent mock data (MOCKUP mode)
- `[MODE]_DB_*`: Database credentials for DEV/PROD modes

## Database Schema

Tables defined in `shared/schema.ts`:
- `customers`: Customer records with phone numbers
- `batches`: Message batch history (sent/received)
- `daily_stats`: Aggregated daily metrics
- `system_config`: System-level configuration

## API Endpoints

All modes expose identical endpoints:
- `/api/dashboard/metrics`: Latest metrics
- `/api/dashboard/chart-data`: Historical data
- `/api/dashboard/category-data`: Response categories
- `/api/batches`: Batch history with filtering
- `/api/batches/:id/export`: CSV export

## Development Notes

### Adding Database Implementation
When implementing `storage-database.ts` for DEV/PROD modes:
1. Use the existing `IStorage` interface methods
2. Match the exact return types from mock implementation
3. Ensure all methods handle errors gracefully
4. Test mode switching doesn't break existing functionality

### Mode-Specific Debugging
- Check current mode: Look for startup logs showing `[Server] Starting in [MODE] mode`
- Validation errors: Configuration validator provides detailed error messages
- Mock data issues: Ensure consistent `MOCK_DATA_SEED` value

### Frontend State Management
- TanStack Query handles all server state
- Query keys follow pattern: `['/api/endpoint']`
- Automatic refetching and caching configured in `client/lib/queryClient.ts`