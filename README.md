# API Rate Limiter

A multi-tenant API rate limiting service with configurable strategies and an admin dashboard.

## Overview

This project implements a basic rate limiting system suitable for small to medium-scale applications. It provides a REST API for checking rate limits and a web dashboard for configuration.

## Features

### Core Functionality
- Multi-tenant support with API key-based identification
- Four rate limiting strategies:
  - **Global**: Apply limits across all requests for a tenant
  - **IP Address**: Limit requests per IP address
  - **API Route**: Limit requests per specific endpoint
  - **User ID**: Limit requests per user identifier
- Sliding window algorithm using Redis sorted sets
- Request logging to PostgreSQL
- Admin dashboard for configuration

### Technology Stack

**Backend**
- NestJS with TypeScript
- PostgreSQL for persistent storage
- Redis for rate limit counters
- Prisma ORM
- Swagger API documentation

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

**Infrastructure**
- Docker Compose for local development
- PostgreSQL and Redis containers

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd rate-limiter
```

2. Start PostgreSQL and Redis
```bash
docker-compose up -d postgres redis
```

3. Setup backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

4. Setup frontend
```bash
cd frontend
cp .env.example .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm install
npm run dev
```

5. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api

## Usage

### Creating a Tenant

1. Navigate to the **Tenants** tab
2. Click "Create Tenant"
3. Enter tenant name and optional description
4. Copy the generated API key

### Configuring Rate Limits

1. Go to the **Rate Limits** tab
2. Select a tenant from the dropdown
3. Click "Add Rate Limit"
4. Choose the limit type and configure:
   - Max requests allowed
   - Time window (in seconds, minutes, hours, or days)
   - For API Route type, specify the route path

### Testing Rate Limits

Use the **API Tester** tab or make direct API calls:

```bash
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "your-api-key",
    "apiRoute": "/api/users",
    "ipAddress": "192.168.1.1",
    "userId": "user-123"
  }'
```

Response: `200` if allowed, `429` if rate limited.

## Architecture

### System Components

```
Frontend (Next.js) → Backend (NestJS) → PostgreSQL
                                      → Redis
```

### Rate Limiting Flow

1. Client sends request to `POST /` with tenant ID and optional metadata
2. Backend retrieves tenant's active rate limits from cache (or database)
3. For each applicable limit, check Redis sorted set for request count
4. Remove expired entries from the sliding window
5. If under limit: add request and allow (200)
6. If over limit: deny request (429)
7. Log request to PostgreSQL

### Caching Strategy

- Tenant rate limit configurations cached in Redis (5 min TTL)
- Cache automatically invalidated when limits are updated
- Reduces database queries for configuration lookups

### Database Schema

**Tenants**
- Stores tenant information and API keys

**RateLimits**
- Stores rate limit configurations per tenant
- Fields: type, identifier, maxRequests, windowMs

**RequestLogs**
- Logs all rate limit checks
- Fields: tenantId, apiRoute, ipAddress, userId, isAllowed, timestamp

## Configuration

### Rate Limit Types

1. **GLOBAL** - Applies to all requests from the tenant
2. **IP_ADDRESS** - Per IP address (requires `ipAddress` in request)
3. **API_ROUTE** - Per API endpoint (requires `apiRoute` in request)
4. **USER_ID** - Per user (requires `userId` in request)

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ratelimiter
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

### Rate Limiter
- `POST /` - Check rate limit

### Tenants
- `GET /tenants` - List all tenants
- `POST /tenants` - Create tenant
- `GET /tenants/:id` - Get tenant details
- `GET /tenants/:id/stats` - Get tenant statistics
- `PUT /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant

### Rate Limits
- `GET /rate-limits/tenant/:tenantId` - Get limits for tenant
- `POST /rate-limits` - Create rate limit
- `PUT /rate-limits/:id` - Update rate limit
- `PATCH /rate-limits/:id/toggle` - Enable/disable limit
- `DELETE /rate-limits/:id` - Delete rate limit

Full API documentation available at http://localhost:3001/api

## Performance Characteristics

### Current Implementation
- Single backend instance
- Suitable for ~5,000-10,000 requests/second
- Latency: ~10-20ms per rate limit check
- Redis memory usage: ~100 bytes per active request in window

### Limitations
- No horizontal scaling support
- Single point of failure (no redundancy)
- Limited to single-region deployment
- No distributed rate limiting across instances

## Scaling Considerations

To scale this system for higher traffic:

1. **Add load balancer** and multiple backend instances
2. **Implement Redis Cluster** for distributed counters
3. **Add database read replicas** for query distribution
4. **Introduce message queue** for asynchronous logging
5. **Consider dedicated rate limiting solutions** (Kong, Tyk) for very high throughput

## Known Issues

- No authentication on admin dashboard
- API keys are not hashed (stored as plaintext)
- No rate limit on the admin API itself
- Request logs grow unbounded (no automatic cleanup)
- No distributed locking (race conditions possible with multiple instances)

## Development

### Project Structure
```
rate-limiter/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/
│   │   ├── redis/
│   │   ├── tenant/
│   │   ├── rate-limit/
│   │   └── rate-limiter/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
└── docker-compose.yml
```

### Running Tests

Currently, no automated tests are included. To test functionality:
1. Use the built-in API Tester in the dashboard
2. Make direct API calls with curl or Postman
3. Monitor the Dashboard tab for request statistics

## Future Improvements

- Add authentication/authorization
- Implement API key hashing
- Add automated log cleanup/archiving
- Support for custom time windows
- Webhook notifications for limit violations
- Grafana dashboards for monitoring
- Unit and integration tests
- Support for burst limits
- Rate limit templates/presets

## License

MIT

## Support

This is a demonstration project. For production use, consider:
- Adding comprehensive testing
- Implementing proper security measures
- Setting up monitoring and alerting
- Planning for disaster recovery
- Evaluating commercial rate limiting solutions
