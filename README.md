# Message Delivery Dashboard

A modern web application for tracking message delivery metrics with support for three operational modes: mockup data for demos, development database for testing, and production database for live operations.

## Features

- 📊 **Real-time Dashboard**: View message delivery metrics and response analytics
- 📈 **Interactive Charts**: Historical trends and category breakdowns using Recharts
- 📋 **Batch History**: Filter and view message batch records with CSV export
- 🎯 **Three Operation Modes**: Seamlessly switch between mockup, development, and production
- 🔄 **Deterministic Mock Data**: Consistent demo data using seeded random generation
- 🛡️ **Type Safety**: Full TypeScript with runtime validation using Zod

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example.mockup .env  # For demo/development
   # Edit .env with your configuration
   ```

3. **Run the application**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:5000
   ```

## Operation Modes

### 🎭 MOCKUP Mode (Default)
Perfect for demos and UI development. Uses deterministic mock data that generates consistent results across instances.

```env
MODE=MOCKUP
MOCK_DATA_SEED=12345
```

### 🛠️ DEV Mode
For integration testing with a development PostgreSQL database.

```env
MODE=DEV
DEV_DB_HOST=localhost
DEV_DB_PORT=5432
DEV_DB_NAME=delivery_dev
DEV_DB_USER=dev_user
DEV_DB_PASSWORD=dev_password
```

### 🚀 PROD Mode
Production deployment with live customer data.

```env
MODE=PROD
PROD_DB_HOST=your-prod-database.com
PROD_DB_NAME=delivery_prod
# ... other production credentials
```

## Tech Stack

- **Frontend**: React + TypeScript, TanStack Query, Tailwind CSS, Shadcn/UI
- **Backend**: Express.js + TypeScript, Zod validation
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite (frontend), esbuild (backend)

## API Endpoints

- `GET /api/dashboard/metrics` - Current dashboard metrics
- `GET /api/dashboard/chart-data` - Historical chart data  
- `GET /api/dashboard/category-data` - Response category breakdown
- `GET /api/batches` - Batch history with filtering
- `GET /api/batches/:id/export` - Export batch as CSV

## Database Schema

- **customers**: Customer information and contact details
- **batches**: Message batch records (sent/received)
- **daily_stats**: Aggregated daily delivery metrics
- **system_config**: System configuration settings

## Development

### Commands
```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm run start    # Run production build
npm run check    # TypeScript type checking
npm run db:push  # Apply database migrations (DEV/PROD)
```

### Architecture
The application uses a clean architecture with:
- **Storage Interface**: Abstraction layer for different data sources
- **Factory Pattern**: Mode-based storage implementation selection
- **Shared Schemas**: Type-safe data contracts between frontend/backend
- **Configuration Validation**: Runtime environment validation with detailed errors

## Setup Guides

For detailed setup instructions for each mode, see [SETUP.md](SETUP.md).

For development guidance and architecture details, see [CLAUDE.md](CLAUDE.md).

## License

MIT