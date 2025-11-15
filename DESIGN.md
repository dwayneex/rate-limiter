# System Design for Visual Diagramming

This document provides clear descriptions of each component and their connections for creating visual diagrams in tools like Canva, Excalidraw, or Draw.io.

---

## Overview Diagram Instructions

Create a layered architecture diagram with the following layers from top to bottom:

1. **Client Layer** (top)
2. **Edge/CDN Layer**
3. **Load Balancer**
4. **API Gateway Layer**
5. **Application Services Layer** (largest section)
6. **Data Layer** (Redis + PostgreSQL + Message Queue)
7. **Supporting Services** (bottom)

---

## Component Specifications for Diagram

### Layer 1: Client Layer
**Visual**: 3 icons/boxes at the top

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Mobile App │  │   Web App   │  │  Server API │
│  (Client 1) │  │  (Client 2) │  │  (Client 3) │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Colors**: Blue (#3B82F6)
**Icon Type**: Device icons or user avatars
**Connection**: Draw arrows pointing DOWN to CDN layer

---

### Layer 2: Edge/CDN Layer
**Visual**: 2 large boxes side by side

```
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│      Cloudflare CDN              │  │    Web Application Firewall      │
│  • Global Edge Locations         │  │  • DDoS Protection               │
│  • SSL Termination               │  │  • Bot Detection                 │
│  • Basic Rate Limiting           │  │  • Geographic Filtering          │
└──────────────────────────────────┘  └──────────────────────────────────┘
```

**Colors**: Purple (#8B5CF6)
**Connection**: 
- FROM: Client Layer (arrows coming from above)
- TO: Load Balancer (arrow pointing down)

---

### Layer 3: Load Balancer
**Visual**: Single wide box

```
┌─────────────────────────────────────────────────────────────┐
│            AWS Application Load Balancer                    │
│  • Health Checks  • SSL  • Path Routing  • Auto-Scaling    │
└─────────────────────────────────────────────────────────────┘
```

**Colors**: Orange (#F59E0B)
**Connection**:
- FROM: CDN/WAF (arrow from above)
- TO: API Gateway Layer (arrow pointing down, fanning out to 3 gateways)

---

### Layer 4: API Gateway Layer
**Visual**: 3 identical boxes in a row

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  API Gateway 1 │  │  API Gateway 2 │  │  API Gateway 3 │
│    (Kong)      │  │    (Kong)      │  │    (Kong)      │
│                │  │                │  │                │
│ • Auth         │  │ • Auth         │  │ • Auth         │
│ • Routing      │  │ • Routing      │  │ • Routing      │
│ • Transform    │  │ • Transform    │  │ • Transform    │
└────────────────┘  └────────────────┘  └────────────────┘
```

**Colors**: Green (#10B981)
**Label**: "Auto-Scaling: 3-50 instances"
**Connection**:
- FROM: Load Balancer (arrow from above)
- TO: Application Services (arrows pointing down to multiple services)

---

### Layer 5: Application Services Layer
**Visual**: 4 groups of boxes

#### Group 1: Rate Limiter Service (LEFT)
```
┌───────────────────────────────────────────────┐
│    Rate Limiter Service Cluster               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │Instance 1│ │Instance 2│ │Instance N│     │
│  │          │ │          │ │          │     │
│  │Stateless │ │Stateless │ │Stateless │     │
│  └──────────┘ └──────────┘ └──────────┘     │
│                                               │
│  Core Responsibility:                         │
│  • Check rate limits in Redis               │
│  • Return 200 or 429                        │
│  • Publish events to queue                  │
└───────────────────────────────────────────────┘
```

**Colors**: Red (#EF4444)
**Label**: "Auto-Scaling: 10-100 instances"
**Target**: < 5ms latency

#### Group 2: Admin API Service (CENTER-LEFT)
```
┌───────────────────────────────────────────────┐
│       Admin API Service                       │
│  ┌──────────┐ ┌──────────┐                   │
│  │Instance 1│ │Instance 2│                   │
│  │          │ │          │                   │
│  │Dashboard │ │Dashboard │                   │
│  │  API     │ │  API     │                   │
│  └──────────┘ └──────────┘                   │
│                                               │
│  Responsibilities:                            │
│  • Tenant management                         │
│  • Rate limit config                         │
│  • Analytics queries                         │
│  • Billing API                               │
└───────────────────────────────────────────────┘
```

**Colors**: Blue (#3B82F6)
**Label**: "2-10 instances"

#### Group 3: Analytics Service (CENTER-RIGHT)
```
┌───────────────────────────────────────────────┐
│       Analytics Service                       │
│  ┌─────────────┐ ┌──────────────┐           │
│  │  Processor  │ │  Aggregator  │           │
│  │             │ │              │           │
│  │ Stream      │ │ Batch        │           │
│  │ Processing  │ │ Reports      │           │
│  └─────────────┘ └──────────────┘           │
│                                               │
│  Responsibilities:                            │
│  • Process request logs                      │
│  • Calculate metrics                         │
│  • Generate reports                          │
│  • Real-time dashboards                      │
└───────────────────────────────────────────────┘
```

**Colors**: Teal (#14B8A6)
**Label**: "2-5 instances"

#### Group 4: Billing Service (RIGHT)
```
┌───────────────────────────────────────────────┐
│       Billing & Metering Service              │
│  ┌──────────────────────────────┐            │
│  │      Billing Service          │            │
│  │                               │            │
│  │  • Usage tracking             │            │
│  │  • Quota management           │            │
│  │  • Invoice generation         │            │
│  │  • Stripe integration         │            │
│  └──────────────────────────────┘            │
└───────────────────────────────────────────────┘
```

**Colors**: Yellow (#F59E0B)
**Label**: "1-3 instances"

---

### Layer 6: Message Queue Layer
**Visual**: 1 large box with 3 smaller boxes inside

```
┌─────────────────────────────────────────────────────────────────┐
│                  Kafka / RabbitMQ Cluster                        │
│                                                                   │
│   ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│   │ request-logs    │  │ billing-events  │  │ alert-events  │  │
│   │   (Topic 1)     │  │   (Topic 2)     │  │   (Topic 3)   │  │
│   │                 │  │                 │  │               │  │
│   │ • Partitioned   │  │ • Partitioned   │  │ • Priority    │  │
│   │ • 7-day retain  │  │ • 30-day retain │  │ • 3-day retain│  │
│   └─────────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Colors**: Indigo (#6366F1)
**Connection**:
- FROM: Rate Limiter Service (arrow labeled "Publish Events")
- FROM: Admin API (arrow labeled "Audit Logs")
- TO: Analytics Service (arrow labeled "request-logs")
- TO: Billing Service (arrow labeled "billing-events")
- TO: Notification Service (arrow labeled "alert-events")

---

### Layer 7: Data Layer - Redis Cluster
**Visual**: 3 groups showing sharding

```
┌────────────────────────────────────────────────────────────────────┐
│                      Redis Cluster                                 │
│                                                                     │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐       │
│  │  Shard 1    │      │  Shard 2    │      │  Shard 3    │       │
│  │             │      │             │      │             │       │
│  │ ┌─────────┐ │      │ ┌─────────┐ │      │ ┌─────────┐ │       │
│  │ │ Master  │ │      │ │ Master  │ │      │ │ Master  │ │       │
│  │ └─────────┘ │      │ └─────────┘ │      │ └─────────┘ │       │
│  │      ↓      │      │      ↓      │      │      ↓      │       │
│  │ ┌─────────┐ │      │ ┌─────────┐ │      │ ┌─────────┐ │       │
│  │ │ Slave   │ │      │ │ Slave   │ │      │ │ Slave   │ │       │
│  │ └─────────┘ │      │ └─────────┘ │      │ └─────────┘ │       │
│  └─────────────┘      └─────────────┘      └─────────────┘       │
│                                                                     │
│                    ┌──────────────────────┐                        │
│                    │  Redis Sentinel      │                        │
│                    │  (Failover Manager)  │                        │
│                    └──────────────────────┘                        │
└────────────────────────────────────────────────────────────────────┘

Data Stored:
• Rate limit counters (Sorted Sets)
• Tenant config cache (Hash)
• API key lookups (String)
```

**Colors**: Red-Orange (#DC2626)
**Connection**:
- FROM: Rate Limiter Service (thick arrow labeled "< 1ms latency")
- FROM: Admin API (dashed arrow labeled "Cache Invalidation")
**Performance**: "100K+ ops/sec per shard"

---

### Layer 7: Data Layer - PostgreSQL Cluster
**Visual**: 1 primary with 3 replicas

```
┌────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database Cluster                      │
│                                                                     │
│                      ┌──────────────────────┐                      │
│                      │   PgBouncer Pool     │                      │
│                      │  (Connection Mgr)    │                      │
│                      └──────────────────────┘                      │
│                               ↓                                     │
│                      ┌──────────────────────┐                      │
│                      │   Primary (Master)   │                      │
│                      │   Write Operations   │                      │
│                      └──────────────────────┘                      │
│                               ↓                                     │
│         ┌─────────────────────┼─────────────────────┐             │
│         ↓                     ↓                     ↓             │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐          │
│  │  Replica 1 │      │  Replica 2 │      │  Replica 3 │          │
│  │   (Read)   │      │   (Read)   │      │   (Read)   │          │
│  └────────────┘      └────────────┘      └────────────┘          │
│                                                                     │
│  Tables: tenants, rate_limits, subscriptions, api_keys, audit_logs │
└────────────────────────────────────────────────────────────────────┘
```

**Colors**: Blue (#1E40AF)
**Connection**:
- FROM: Admin API (arrow labeled "Writes → Primary")
- FROM: Admin API (dashed arrows labeled "Reads → Replicas")
**Strategy**: "Partition by tenant_id"

---

### Layer 7: Data Layer - TimescaleDB
**Visual**: Single box with time-series visualization

```
┌────────────────────────────────────────────────────────────────────┐
│                         TimescaleDB                                 │
│                    (Time-Series Metrics)                            │
│                                                                     │
│  Metrics Stored:                                                    │
│  • Request counts per minute/hour/day                              │
│  • Block rates over time                                           │
│  • Latency percentiles (p50, p95, p99)                            │
│  • Resource utilization                                            │
│                                                                     │
│  Retention:                                                         │
│  • Raw data: 30 days                                               │
│  • 1-hour aggregates: 1 year                                       │
│  • Daily aggregates: 5 years                                       │
└────────────────────────────────────────────────────────────────────┘
```

**Colors**: Purple (#7C3AED)
**Connection**:
- FROM: Analytics Service (arrow labeled "Time-series data")

---

### Layer 8: Supporting Services

#### Monitoring Stack (LEFT)
```
┌───────────────────────────────────────────────┐
│        Monitoring & Observability             │
│                                               │
│  ┌──────────────┐                            │
│  │  Prometheus  │  ← Metrics Collection      │
│  └──────────────┘                            │
│         ↓                                     │
│  ┌──────────────┐                            │
│  │   Grafana    │  ← Visualization           │
│  └──────────────┘                            │
│                                               │
│  ┌──────────────┐                            │
│  │    Jaeger    │  ← Distributed Tracing     │
│  └──────────────┘                            │
│                                               │
│  ┌──────────────┐                            │
│  │  ELK Stack   │  ← Log Aggregation         │
│  └──────────────┘                            │
└───────────────────────────────────────────────┘
```

**Colors**: Gray (#6B7280)
**Connection**: Dashed lines FROM all application services

#### Notification Service (RIGHT)
```
┌───────────────────────────────────────────────┐
│        Notification Service                   │
│                                               │
│  ┌──────────────────────────────┐            │
│  │   Notification Router        │            │
│  └──────────────────────────────┘            │
│                ↓                              │
│     ┌──────────┼──────────┐                  │
│     ↓          ↓          ↓                  │
│  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │Email │  │Slack │  │ SMS  │              │
│  │SendGr│  │Webho │  │Twilio│              │
│  │ id   │  │ oks  │  │      │              │
│  └──────┘  └──────┘  └──────┘              │
│                                               │
│  Event Types:                                 │
│  • Quota warnings                            │
│  • System alerts                             │
│  • Billing events                            │
└───────────────────────────────────────────────┘
```

**Colors**: Pink (#EC4899)
**Connection**: FROM Message Queue (alert-events topic)

---

## Data Flow Diagrams

### Flow 1: Rate Limit Check (Hot Path)

```
[Client] 
   ↓ 
[CDN/WAF] (10-50ms)
   ↓
[Load Balancer] (1-2ms)
   ↓
[API Gateway] (2-5ms)
   ↓
[Rate Limiter Service] (3-10ms)
   ↓
[Redis Cluster] (1-2ms) ← CHECK COUNTER
   ↓
{Decision: Allow or Deny}
   ↓
[Publish to Message Queue] (async, non-blocking)
   ↓
[Return Response] 200 or 429
```

**Total Latency**: 18-71ms (varies by region)

**Visual Notes**:
- Use thick solid lines for synchronous calls
- Use dashed lines for async operations
- Color code: Green for success path, Red for denial path

---

### Flow 2: Configuration Update (Admin Path)

```
[Admin Dashboard]
   ↓
[Admin API]
   ↓
[PostgreSQL Primary] ← WRITE CONFIG
   ↓
[Publish Cache Invalidation]
   ↓
[Redis Cluster] ← CLEAR CACHE
   ↓
[Rate Limiter Instances] ← REFRESH CONFIG ON NEXT REQUEST
```

**Visual Notes**:
- Use blue color for this flow
- Show "5 min max" label on final arrow

---

### Flow 3: Analytics Pipeline (Background Processing)

```
[Rate Limiter Service]
   ↓
[Message Queue - request-logs topic]
   ↓
[Analytics Processor] (consume events)
   ↓
[Analytics Aggregator] (batch process)
   ↓
[TimescaleDB] (store metrics)
   ↓
[Grafana Dashboard] (visualize)
```

**Visual Notes**:
- Use purple/teal gradient
- Show "Real-time" label on first arrow
- Show "Batch (1 min)" on aggregator

---

### Flow 4: Billing & Metering

```
[Rate Limiter Service]
   ↓
[Message Queue - billing-events topic]
   ↓
[Billing Service] (count requests)
   ↓
[PostgreSQL] (update usage)
   ↓
{Check Quota}
   ↓
[Notification Service] (if threshold exceeded)
   ↓
[Customer Email/Webhook]
```

**Visual Notes**:
- Use yellow/gold color
- Add diamond shape for quota check decision

---

## Scaling Visualization

### Horizontal Scaling Indicators

Create a separate diagram showing how each layer scales:

```
LAYER                    SCALING STRATEGY              CURRENT → TARGET
─────────────────────────────────────────────────────────────────────
API Gateway              Auto-scaling                  3 → 50 instances
Rate Limiter Service     Auto-scaling                  10 → 100 instances
Admin API                Manual scaling                2 → 10 instances
Redis Cluster            Sharding                      3 → 20 shards
PostgreSQL              Read replicas                 1+3 → 1+10 replicas
Message Queue           Partitioning                  3 → 50 partitions
```

**Visual**: Use horizontal bars showing growth potential

---

## Payment Tiers Comparison Table

Create a visual comparison table:

```
┌─────────────┬────────────┬────────────┬──────────────┬──────────────┐
│  Feature    │    Free    │  Startup   │ Professional │  Enterprise  │
├─────────────┼────────────┼────────────┼──────────────┼──────────────┤
│ Requests    │ 100K/mo    │ 1M/mo      │ 10M/mo       │ 100M+/mo     │
│ Price       │ $0         │ $49/mo     │ $199/mo      │ Custom       │
│ Rate Types  │ Global     │ All        │ All + Custom │ Unlimited    │
│ Analytics   │ 7 days     │ 30 days    │ 90 days      │ 1 year       │
│ SLA         │ None       │ 99%        │ 99.9%        │ 99.95%       │
│ Support     │ Community  │ Email      │ Email + Chat │ Dedicated    │
└─────────────┴────────────┴────────────┴──────────────┴──────────────┘
```

**Colors**: Use gradient from gray → blue → purple → gold

---

## Geographic Distribution Diagram

### Multi-Region Deployment

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│     [US-EAST]              [EU-WEST]              [ASIA-PACIFIC]  │
│         │                      │                        │          │
│    ┌────────┐            ┌────────┐              ┌────────┐       │
│    │Regional│            │Regional│              │Regional│       │
│    │  CDN   │            │  CDN   │              │  CDN   │       │
│    └────────┘            └────────┘              └────────┘       │
│         │                      │                        │          │
│    ┌────────┐            ┌────────┐              ┌────────┐       │
│    │ Full   │            │ Full   │              │ Full   │       │
│    │ Stack  │◄──────────►│ Stack  │◄────────────►│ Stack  │       │
│    │ Deploy │ Replication│ Deploy │  Replication │ Deploy │       │
│    └────────┘            └────────┘              └────────┘       │
│         │                      │                        │          │
│    Latency: 50ms         Latency: 50ms          Latency: 50ms    │
│                                                                     │
│         └──────────────────────┬────────────────────────┘          │
│                                │                                    │
│                     ┌──────────────────────┐                       │
│                     │  Global PostgreSQL   │                       │
│                     │   (Cross-region)     │                       │
│                     └──────────────────────┘                       │
└────────────────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown Visualization

### Infrastructure Cost by Component (Pie Chart Data)

For a Medium-scale deployment (100K req/sec):

```
Component               Cost/Month    Percentage
──────────────────────────────────────────────────
Redis Cluster           $1,800        28.6%
Rate Limiter Service    $1,200        19.0%
PostgreSQL Cluster      $1,500        23.8%
API Gateway             $500          7.9%
Kafka/Message Queue     $500          7.9%
TimescaleDB            $400          6.3%
Admin API              $150          2.4%
Monitoring             $200          3.2%
Load Balancer          $50           0.8%
──────────────────────────────────────────────────
TOTAL                  $6,300        100%
```

---

## Color Palette for Entire Diagram

```
Primary Components:
• Clients: Blue #3B82F6
• CDN/Edge: Purple #8B5CF6
• Load Balancer: Orange #F59E0B
• API Gateway: Green #10B981
• Rate Limiter: Red #EF4444
• Admin API: Blue #3B82F6
• Analytics: Teal #14B8A6
• Billing: Yellow #F59E0B
• Message Queue: Indigo #6366F1
• Redis: Red-Orange #DC2626
• PostgreSQL: Dark Blue #1E40AF
• TimescaleDB: Purple #7C3AED
• Monitoring: Gray #6B7280
• Notifications: Pink #EC4899

Connection Lines:
• Synchronous calls: Solid black/dark gray
• Asynchronous calls: Dashed blue
• Data replication: Dashed green
• Error/alert paths: Red
• Cache operations: Orange
```

---

## Icon Suggestions

- **Clients**: Mobile phone, laptop, server icons
- **CDN**: Globe or cloud icon
- **Load Balancer**: Traffic light or distribution icon
- **API Gateway**: Door/gate icon
- **Services**: Gear/cog icons (different colors per service)
- **Redis**: Lightning bolt (for speed)
- **PostgreSQL**: Cylinder/database icon
- **Message Queue**: Envelope or queue icon
- **Monitoring**: Chart/graph icon
- **Notifications**: Bell icon

---

## Layout Tips for Canva/Excalidraw

1. **Use consistent spacing**: 50px between components, 100px between layers
2. **Arrow thickness**: 
   - Thin (2px): Supporting connections
   - Medium (4px): Regular data flow
   - Thick (6px): Hot path (rate limit checks)
3. **Font sizes**:
   - Service names: 16pt bold
   - Descriptions: 10pt regular
   - Layer labels: 20pt bold
4. **Box sizes**:
   - Small services: 150px wide
   - Medium services: 250px wide
   - Large services/layers: 400px+ wide
5. **Use rounded corners**: 8px radius for modern look
6. **Add shadows**: Light drop shadows for depth

---

## Key Metrics to Highlight

Add call-out boxes with these key numbers:

```
┌──────────────────────┐
│ TARGET PERFORMANCE   │
├──────────────────────┤
│ 1M+ req/sec         │
│ < 20ms p99 latency  │
│ 99.95% uptime       │
│ < 15min RTO         │
└──────────────────────┘

┌──────────────────────┐
│ BUSINESS METRICS     │
├──────────────────────┤
│ $750K ARR (Year 1)  │
│ 90% gross margin    │
│ 3% churn rate       │
│ $125 ARPU           │
└──────────────────────┘

┌──────────────────────┐
│ SCALING CAPACITY     │
├──────────────────────┤
│ 100K+ tenants       │
│ 100M+ req/day       │
│ Multi-region ready  │
│ Auto-scaling        │
└──────────────────────┘
```

---

This document provides all the details needed to create professional system architecture diagrams in any visual tool.
