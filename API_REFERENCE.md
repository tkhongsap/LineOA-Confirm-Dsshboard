# API Reference Documentation

## LINE OA Monitoring System REST API

### Table of Contents
- [Overview](#overview)
- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Dashboard Endpoints](#dashboard-endpoints)
- [Batch Management Endpoints](#batch-management-endpoints)
- [Data Export Endpoints](#data-export-endpoints)
- [Response Types](#response-types)
- [Example Requests](#example-requests)

## Overview

The LINE OA Monitoring System API provides RESTful endpoints for accessing delivery confirmation data, response metrics, and batch management functionality. All responses are in JSON format unless otherwise specified.

### API Design Principles
- RESTful architecture
- JSON request/response format
- ISO 8601 date formats
- UTF-8 encoding
- Stateless operations

## Base Configuration

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Request Headers
```http
Content-Type: application/json
Accept: application/json
```

### Response Headers
```http
Content-Type: application/json; charset=utf-8
X-Response-Time: <milliseconds>
```

## Authentication

Currently, the API does not require authentication. Future versions may implement:
- API key authentication
- JWT bearer tokens
- OAuth 2.0

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error context
    }
  }
}
```

### HTTP Status Codes
| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Common Error Codes
| Error Code | Description |
|-----------|-------------|
| INVALID_DATE_FORMAT | Date must be in YYYY-MM-DD format |
| INVALID_TYPE | Type must be 'sent' or 'received' |
| BATCH_NOT_FOUND | Batch with specified ID not found |
| DATABASE_ERROR | Database operation failed |

## Dashboard Endpoints

### GET /api/dashboard/metrics

Get the latest dashboard metrics including today's statistics.

#### Response
```json
{
  "date": "2024-01-15",
  "totalSent": 175,
  "totalReceived": 140,
  "confirmed": 84,
  "notConfirmed": 21,
  "questions": 11,
  "other": 24,
  "pending": 35,
  "responseRate": 80
}
```

#### Field Descriptions
| Field | Type | Description |
|-------|------|-------------|
| date | string | ISO date (YYYY-MM-DD) |
| totalSent | number | Total confirmations sent |
| totalReceived | number | Total responses received |
| confirmed | number | Confirmed deliveries |
| notConfirmed | number | Not confirmed deliveries |
| questions | number | Customer questions |
| other | number | Other response types |
| pending | number | Awaiting response (totalSent - totalReceived) |
| responseRate | number | Response percentage (0-100) |

#### Example Request
```bash
curl -X GET http://localhost:3000/api/dashboard/metrics
```

---

### GET /api/dashboard/chart-data

Get historical trend data for line charts.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| days | number | No | 7 | Number of days to retrieve (1-30) |

#### Response
```json
[
  {
    "date": "2024-01-09",
    "sent": 165,
    "received": 132
  },
  {
    "date": "2024-01-10",
    "sent": 180,
    "received": 144
  },
  // ... more data points
]
```

#### Field Descriptions
| Field | Type | Description |
|-------|------|-------------|
| date | string | ISO date (YYYY-MM-DD) |
| sent | number | Messages sent that day |
| received | number | Responses received that day |

#### Example Request
```bash
# Get last 7 days (default)
curl -X GET http://localhost:3000/api/dashboard/chart-data

# Get last 14 days
curl -X GET http://localhost:3000/api/dashboard/chart-data?days=14
```

---

### GET /api/dashboard/category-data

Get response category distribution for pie charts.

#### Response
```json
[
  {
    "name": "確認済み",
    "value": 84,
    "color": "#10b981"
  },
  {
    "name": "未確認",
    "value": 21,
    "color": "#ef4444"
  },
  {
    "name": "質問",
    "value": 11,
    "color": "#f59e0b"
  },
  {
    "name": "その他",
    "value": 24,
    "color": "#6b7280"
  }
]
```

#### Field Descriptions
| Field | Type | Description |
|-------|------|-------------|
| name | string | Category name in Japanese |
| value | number | Count for this category |
| color | string | Hex color code for visualization |

#### Example Request
```bash
curl -X GET http://localhost:3000/api/dashboard/category-data
```

## Batch Management Endpoints

### GET /api/batches

Get paginated list of batches with optional filtering.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | string | No | - | Filter by type: 'sent' or 'received' |
| dateFrom | string | No | - | Start date (YYYY-MM-DD) |
| dateTo | string | No | - | End date (YYYY-MM-DD) |
| limit | number | No | 10 | Results per page (1-100) |
| offset | number | No | 0 | Pagination offset |

#### Response
```json
{
  "batches": [
    {
      "id": "batch-sent-2024-01-15",
      "date": "2024-01-15",
      "type": "sent",
      "fileName": "delivery_confirmations_2024-01-15.csv",
      "channel": "LINE OA",
      "customerCount": 175,
      "confirmed": 0,
      "notConfirmed": 0,
      "questions": 0,
      "other": 0,
      "createdAt": "2024-01-15T09:00:00Z",
      "summary": "175 件の配送確認を送信"
    },
    {
      "id": "batch-received-2024-01-15",
      "date": "2024-01-15",
      "type": "received",
      "fileName": "delivery_responses_2024-01-15.csv",
      "channel": "LINE OA",
      "customerCount": 140,
      "confirmed": 84,
      "notConfirmed": 21,
      "questions": 11,
      "other": 24,
      "createdAt": "2024-01-15T18:00:00Z",
      "summary": "140 件の返信を受信 (確認済み: 84)"
    }
  ],
  "total": 60
}
```

#### Field Descriptions
| Field | Type | Description |
|-------|------|-------------|
| batches | array | Array of batch objects |
| batches[].id | string | Unique batch identifier |
| batches[].date | string | Batch date (YYYY-MM-DD) |
| batches[].type | string | 'sent' or 'received' |
| batches[].fileName | string | Associated CSV file name |
| batches[].channel | string | Communication channel |
| batches[].customerCount | number | Total customers in batch |
| batches[].confirmed | number | Confirmed responses |
| batches[].notConfirmed | number | Not confirmed responses |
| batches[].questions | number | Question responses |
| batches[].other | number | Other responses |
| batches[].createdAt | string | ISO 8601 timestamp |
| batches[].summary | string | Japanese summary text |
| total | number | Total batches matching filters |

#### Example Requests
```bash
# Get all batches (paginated)
curl -X GET http://localhost:3000/api/batches

# Get only sent batches
curl -X GET http://localhost:3000/api/batches?type=sent

# Get batches for date range
curl -X GET "http://localhost:3000/api/batches?dateFrom=2024-01-01&dateTo=2024-01-15"

# Pagination example
curl -X GET "http://localhost:3000/api/batches?limit=20&offset=40"

# Combined filters
curl -X GET "http://localhost:3000/api/batches?type=received&dateFrom=2024-01-10&limit=5"
```

---

### GET /api/batches/:id

Get details for a specific batch.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Batch ID (e.g., "batch-sent-2024-01-15") |

#### Response
```json
{
  "id": "batch-received-2024-01-15",
  "date": "2024-01-15",
  "type": "received",
  "fileName": "delivery_responses_2024-01-15.csv",
  "channel": "LINE OA",
  "customerCount": 140,
  "confirmed": 84,
  "notConfirmed": 21,
  "questions": 11,
  "other": 24,
  "createdAt": "2024-01-15T18:00:00Z"
}
```

#### Error Response (404)
```json
{
  "error": {
    "code": "BATCH_NOT_FOUND",
    "message": "Batch with ID 'batch-invalid-id' not found"
  }
}
```

#### Example Request
```bash
curl -X GET http://localhost:3000/api/batches/batch-received-2024-01-15
```

## Data Export Endpoints

### GET /api/batches/:id/export

Export batch data as CSV file.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Batch ID to export |

#### Response Headers
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="batch_export_2024-01-15.csv"
```

#### Response Body (CSV)
```csv
顧客ID,顧客名,電話番号,ステータス,応答日時
customer-001,田中 太郎,+81-90-1234-5678,確認済み,2024-01-15 18:30:00
customer-002,鈴木 花子,+81-90-2345-6789,未確認,2024-01-15 18:31:00
customer-003,高橋 一郎,+81-90-3456-7890,質問,2024-01-15 18:32:00
```

#### CSV Fields
| Field | Description |
|-------|-------------|
| 顧客ID | Customer ID |
| 顧客名 | Customer name |
| 電話番号 | Phone number |
| ステータス | Response status |
| 応答日時 | Response timestamp |

#### Example Request
```bash
# Download CSV file
curl -X GET http://localhost:3000/api/batches/batch-received-2024-01-15/export \
  -o batch_export.csv

# With wget
wget http://localhost:3000/api/batches/batch-received-2024-01-15/export \
  -O batch_export.csv
```

## Response Types

### TypeScript Type Definitions

```typescript
// Dashboard Metrics
interface DashboardMetrics {
  date: string;
  totalSent: number;
  totalReceived: number;
  confirmed: number;
  notConfirmed: number;
  questions: number;
  other: number;
  pending: number;
  responseRate: number;
}

// Chart Data Point
interface ChartData {
  date: string;
  sent: number;
  received: number;
}

// Category Data
interface CategoryData {
  name: string;
  value: number;
  color: string;
}

// Batch Object
interface Batch {
  id: string;
  date: string;
  type: 'sent' | 'received';
  fileName: string;
  channel: string;
  customerCount: number;
  confirmed: number;
  notConfirmed: number;
  questions: number;
  other: number;
  createdAt: string;
}

// Batch with Summary
interface BatchWithSummary extends Batch {
  summary: string;
}

// Batch Response
interface BatchResponse {
  batches: BatchWithSummary[];
  total: number;
}

// Query Parameters
interface BatchQueryParams {
  type?: 'sent' | 'received';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}
```

## Example Requests

### JavaScript/TypeScript (Fetch API)

```javascript
// Get dashboard metrics
async function getDashboardMetrics() {
  const response = await fetch('/api/dashboard/metrics');
  const data = await response.json();
  return data;
}

// Get filtered batches
async function getBatches(type, dateFrom, dateTo) {
  const params = new URLSearchParams({
    type,
    dateFrom,
    dateTo,
    limit: '20'
  });
  
  const response = await fetch(`/api/batches?${params}`);
  const data = await response.json();
  return data;
}

// Export batch as CSV
async function exportBatch(batchId) {
  const response = await fetch(`/api/batches/${batchId}/export`);
  const blob = await response.blob();
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `batch_${batchId}.csv`;
  a.click();
}
```

### Python (requests)

```python
import requests
import json

# Base URL
BASE_URL = "http://localhost:3000/api"

# Get dashboard metrics
def get_dashboard_metrics():
    response = requests.get(f"{BASE_URL}/dashboard/metrics")
    return response.json()

# Get batches with filters
def get_batches(batch_type=None, date_from=None, date_to=None):
    params = {}
    if batch_type:
        params['type'] = batch_type
    if date_from:
        params['dateFrom'] = date_from
    if date_to:
        params['dateTo'] = date_to
    
    response = requests.get(f"{BASE_URL}/batches", params=params)
    return response.json()

# Export batch as CSV
def export_batch(batch_id, output_file):
    response = requests.get(f"{BASE_URL}/batches/{batch_id}/export")
    with open(output_file, 'wb') as f:
        f.write(response.content)

# Example usage
metrics = get_dashboard_metrics()
print(f"Response rate: {metrics['responseRate']}%")

batches = get_batches(batch_type='received', date_from='2024-01-01')
print(f"Found {batches['total']} received batches")
```

### cURL Examples

```bash
# Get dashboard metrics
curl -X GET http://localhost:3000/api/dashboard/metrics \
  -H "Accept: application/json" | jq

# Get chart data for last 14 days
curl -X GET "http://localhost:3000/api/dashboard/chart-data?days=14" \
  -H "Accept: application/json" | jq

# Get received batches for specific date range
curl -X GET "http://localhost:3000/api/batches?type=received&dateFrom=2024-01-01&dateTo=2024-01-15" \
  -H "Accept: application/json" | jq

# Get specific batch details
curl -X GET http://localhost:3000/api/batches/batch-sent-2024-01-15 \
  -H "Accept: application/json" | jq

# Export batch as CSV
curl -X GET http://localhost:3000/api/batches/batch-received-2024-01-15/export \
  -H "Accept: text/csv" \
  -o export.csv
```

### React with TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query';

// Custom hooks for API calls
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['/api/dashboard/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    staleTime: Infinity,
  });
}

export function useBatches(filters: BatchQueryParams) {
  const params = new URLSearchParams(
    Object.entries(filters)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  );

  return useQuery({
    queryKey: ['/api/batches', filters],
    queryFn: async () => {
      const response = await fetch(`/api/batches?${params}`);
      if (!response.ok) throw new Error('Failed to fetch batches');
      return response.json();
    },
  });
}

// Component usage
function DashboardComponent() {
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { data: batches } = useBatches({ 
    type: 'received', 
    limit: 10 
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Response Rate: {metrics?.responseRate}%</h2>
      <p>Total Batches: {batches?.total}</p>
    </div>
  );
}
```

## Rate Limiting

Currently not implemented. Future versions may include:
- 1000 requests per hour per IP
- 100 requests per minute per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Versioning

The API currently does not use versioning. Future versions may implement:
- URL versioning: `/api/v1/`, `/api/v2/`
- Header versioning: `API-Version: 1.0`

## CORS Configuration

### Development
```javascript
cors({
  origin: 'http://localhost:5173',
  credentials: true
})
```

### Production
```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

## WebSocket Support (Future)

Planned WebSocket endpoints for real-time updates:
- `/ws/metrics` - Live dashboard metrics
- `/ws/batches` - Real-time batch notifications

## Health Check Endpoint

### GET /api/health

Check API and database connectivity.

#### Response (200 OK)
```json
{
  "status": "healthy",
  "mode": "DEV",
  "database": "connected",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

#### Response (503 Service Unavailable)
```json
{
  "status": "unhealthy",
  "mode": "DEV",
  "database": "disconnected",
  "error": "Database connection failed"
}
```

## Performance Considerations

### Response Times
- Dashboard metrics: < 100ms
- Chart data: < 200ms
- Batch list: < 300ms
- CSV export: < 500ms for 1000 records

### Caching
- Dashboard metrics: 1 minute cache
- Chart data: 5 minute cache
- Category data: 5 minute cache
- Batch data: No cache (real-time)

### Pagination Best Practices
- Default limit: 10 records
- Maximum limit: 100 records
- Use offset for pagination
- Consider cursor-based pagination for large datasets

## Security Considerations

### Input Validation
- All dates validated as YYYY-MM-DD format
- Type parameters restricted to enum values
- Numeric parameters checked for valid ranges
- SQL injection prevention via parameterized queries

### Output Sanitization
- CSV exports properly escaped
- JSON responses properly encoded
- No sensitive data in error messages

### Future Security Enhancements
- API key authentication
- Rate limiting
- Request signing
- IP whitelisting for production

## Troubleshooting

### Common Issues

#### 1. Empty Response Data
```json
{
  "date": "2024-01-15",
  "totalSent": 0,
  "totalReceived": 0,
  // ... all zeros
}
```
**Solution**: Check if data exists for the requested date range.

#### 2. Date Format Errors
```json
{
  "error": {
    "code": "INVALID_DATE_FORMAT",
    "message": "Date must be in YYYY-MM-DD format"
  }
}
```
**Solution**: Ensure dates are formatted as YYYY-MM-DD.

#### 3. Large Dataset Performance
**Solution**: Use pagination parameters (limit, offset) to reduce response size.

#### 4. CSV Export Encoding Issues
**Solution**: Ensure UTF-8 encoding is properly handled in your HTTP client.

## Migration from Mock to Production

When transitioning from MOCKUP mode to DEV/PROD:

1. **No API changes required** - Endpoints remain the same
2. **Data consistency** - Same response formats
3. **Performance** - May vary based on database size
4. **Error handling** - Additional database-related errors possible

## Support and Contact

For API support:
- Documentation: This document
- Issues: GitHub repository
- Email: support@your-domain.com

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Dashboard endpoints
- Batch management
- CSV export functionality

### Planned Features
- WebSocket support
- Advanced filtering
- Bulk operations
- Analytics endpoints
- User management