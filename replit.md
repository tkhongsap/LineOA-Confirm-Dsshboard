# Delivery Confirmation Dashboard

## Overview

This is a full-stack web application for tracking and managing delivery confirmations through messaging. The system provides a comprehensive dashboard for monitoring batch-level message activity, response rates, and daily file operations. Built with React frontend and Express backend, it features real-time metrics, interactive charts, and batch history management.

## Three-Mode Architecture

The application supports three operational modes:

### 1. MOCKUP Mode (Default)
- **Purpose**: Demos, design validation, and internal review
- **Data Source**: Deterministic mock data with seeded random generation
- **Features**: Full UI showcase with realistic-looking data
- **Usage**: Set `MODE=MOCKUP` or leave unset (default)

### 2. DEV Mode  
- **Purpose**: Integration testing with backend database
- **Data Source**: Connected to development SQL database
- **Features**: API validation and data flow testing
- **Usage**: Set `MODE=DEV` with database environment variables

### 3. PROD Mode
- **Purpose**: Live system for call center operations
- **Data Source**: Connected to production SQL database
- **Features**: Real customer data with security and logging
- **Usage**: Set `MODE=PROD` with production database credentials

## Environment Variables

```bash
# Operation Mode
MODE=MOCKUP|DEV|PROD

# Data Retention
RETENTION_DAYS=30

# Mockup Mode
MOCK_DATA_SEED=12345

# Development Database
DEV_DB_HOST=localhost
DEV_DB_PORT=5432
DEV_DB_NAME=delivery_dev
DEV_DB_USER=dev_user
DEV_DB_PASSWORD=dev_password

# Production Database
PROD_DB_HOST=prod-server
PROD_DB_PORT=5432
PROD_DB_NAME=delivery_prod
PROD_DB_USER=prod_user
PROD_DB_PASSWORD=secure_password
```

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack React Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Recharts library for data visualization (line charts, pie charts)
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database Integration**: Drizzle ORM configured for PostgreSQL
- **API Design**: RESTful endpoints for dashboard metrics, chart data, and message management
- **Storage Pattern**: Repository pattern with in-memory storage implementation (MemStorage class)
- **Middleware**: Custom logging middleware for API request tracking

### Database Schema
- **customers**: Stores customer information (id, name, phone)
- **messages**: Tracks individual messages with delivery status and response times
- **daily_stats**: Aggregated daily statistics for dashboard metrics
- **Message Types**: 'sent' | 'received'
- **Status Types**: 'pending' | 'confirmed' | 'not-confirmed' | 'question' | 'other'

### Data Flow
- Dashboard displays real-time metrics from aggregated daily statistics
- Batch history with tabbed interface (Sent/Received files) 
- Chart data generation for trend analysis and category breakdowns
- CSV export functionality for individual batch files
- 30-day automatic retention policy with cleanup

### Batch-Based Architecture
- **Sent Batches**: Daily files of confirmation messages sent to customers
- **Received Batches**: Daily files of customer responses with categorization
- **File Tracking**: Each batch has filename, customer count, and export capability
- **Category Breakdown**: Responses categorized as confirmed/not-confirmed/questions/other

### Development Setup
- **Build System**: Vite for frontend development with hot module replacement
- **Database Migrations**: Drizzle Kit for schema management
- **Environment**: Development and production configurations with proper error handling
- **TypeScript**: Strict type checking across shared schemas and API interfaces

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database queries and migrations

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Shadcn/UI**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography

### Charts and Visualization
- **Recharts**: React charting library for dashboard analytics
- **Date-fns**: Date manipulation and formatting utilities

### Development Tools
- **Vite**: Fast build tool with development server
- **ESBuild**: Fast JavaScript bundler for production builds
- **TanStack React Query**: Data fetching and caching solution
- **Zod**: Runtime type validation and schema validation
- **React Hook Form**: Form state management and validation

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions