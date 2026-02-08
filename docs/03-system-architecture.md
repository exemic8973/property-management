# System Architecture: PropertyOS

## Overview

PropertyOS is built as a **microservices-oriented, event-driven architecture** that scales horizontally, supports multi-tenancy at the database level, and enables independent deployment of services. The architecture balances simplicity for the MVP with the extensibility needed for enterprise scale.

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          CLIENT LAYER                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Tenant     │  │    Owner     │  │   Manager    │  │   Admin      │  │   Mobile     │    │
│  │   Portal     │  │  Dashboard   │  │   Console    │  │   Portal     │  │    App       │    │
│  │ (Next.js)    │  │  (Next.js)   │  │  (Next.js)   │  │  (Next.js)   │  │   (PWA)      │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │                 │             │
│         └─────────────────┴─────────────────┴─────────────────┴─────────────────┘             │
│                                       │ HTTPS/WebSocket                                       │
└───────────────────────────────────────┼───────────────────────────────────────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      API GATEWAY                                               │
│                                      (Kong / AWS API Gateway)                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • Authentication & Authorization  • Rate Limiting  • Request Routing  • Request/Response      │
│  • SSL Termination                  • Logging         • Caching         • Transformation        │
└───────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   GraphQL Gateway   │     │   REST API Gateway  │     │   WebSocket Server  │
│   (Apollo Server)   │     │   (NestJS/Fastify)  │     │   (Socket.IO)       │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
          ▼                            ▼                            ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  AUTHENTICATION     │  │   TENANT SERVICE    │  │  PROPERTY SERVICE   │
│  SERVICE            │  │                     │  │                     │
│  (NestJS)           │  │  (NestJS)           │  │  (NestJS)           │
│  • JWT Tokens       │  │  • Profile          │  │  • Properties       │
│  • Passkeys         │  │  • Payments         │  │  • Units            │
│  • OAuth/MFA        │  │  • Requests         │  │  • Leases           │
└──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  PAYMENT SERVICE    │  │  MAINTENANCE SVC    │  │  NOTIFICATION SVC   │
│  (NestJS)           │  │  (NestJS)           │  │  (NestJS)           │
│  • Stripe Integration│  │  • Work Orders      │  │  • Email            │
│  • Ledger           │  │  • Vendors          │  │  • SMS              │
│  • Refunds          │  │  • Invoices         │  │  • Push             │
└──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  OWNER SERVICE      │  │  ANALYTICS SVC      │  │  DOCUMENT SVC       │
│  (NestJS)           │  │  (NestJS)           │  │  (NestJS)           │
│  • Portfolios       │  │  • Reporting        │  │  • Storage          │
│  • Distributions    │  │  • Dashboards       │  │  • E-Signature      │
│  • Statements       │  │  • Forecasting      │  │  • Templates        │
└──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  AI SERVICE         │  │  INTEGRATION SVC    │  │  WEBHOOK SVC        │
│  (NestJS + Python)  │  │  (NestJS)           │  │  (NestJS)           │
│  • LLM Orchestration│  │  • Accounting       │  │  • Event Delivery   │
│  • Prompt Mgmt      │  │  • CRM              │  │  • Retry Logic      │
│  • Response Cache   │  │  • IoT              │  │  • Signature        │
└──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    MESSAGE QUEUE                                               │
│                                  (RabbitMQ / Kafka)                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • Event Bus (tenant.created, payment.completed, request.submitted)                           │
│  • Dead Letter Queue  • Priority Queues  • Delayed Messages                                   │
└───────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA LAYER                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │  PostgreSQL     │  │     Redis       │  │   S3 / MinIO    │  │  Elasticsearch  │           │
│  │  (Primary DB)   │  │   (Cache/Queue) │  │  (Object Store) │  │   (Search)      │           │
│  │  • Relational   │  │  • Sessions     │  │  • Documents    │  │  • Full-text    │           │
│  │  • Multi-tenant │  │  • Rate Limits  │  │  • Images       │  │  • Analytics    │           │
│  │  • Read Replicas│  │  • Pub/Sub      │  │  • Backups      │  │  • Logs         │           │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           │
│           │                    │                    │                    │                      │
│           └────────────────────┼────────────────────┼────────────────────┘                      │
│                                │                    │                                           │
└────────────────────────────────┼────────────────────┼───────────────────────────────────────────┘
                                 │                    │
                                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                EXTERNAL SERVICES                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Stripe    │  │  DocuSign   │  │   Twilio    │  │   OpenAI    │  │   SendGrid  │          │
│  │  Payments   │  │  E-Sign     │  │   SMS/Voice │  │   LLMs      │  │   Email     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ QuickBooks  │  │  Salesforce │  │   Zillow    │  │   Google    │  │   AWS SES   │          │
│  │  Accounting │  │     CRM     │  │   API       │  │   Maps      │  │   Backup    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Boundaries & Responsibilities

### Core Services (MVP)

#### 1. Authentication Service
**Port:** 3001
**Database:** PostgreSQL (shared schema initially, dedicated in Phase 2)

```typescript
// Key Responsibilities
- User registration, login, logout
- JWT token generation and validation
- Passkey authentication (WebAuthn)
- OAuth 2.0 / OpenID Connect (Google, Microsoft)
- Multi-factor authentication (TOTP, SMS)
- Password reset flows
- Session management
- Role-based access control (RBAC)

// Key Endpoints
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
POST   /api/auth/passkey/register
POST   /api/auth/passkey/authenticate
POST   /api/auth/mfa/setup
POST   /api/auth/mfa/verify
POST   /api/auth/oauth/google
POST   /api/auth/oauth/microsoft
```

#### 2. Tenant Service
**Port:** 3002
**Database:** PostgreSQL (tenant_id column for multi-tenancy)

```typescript
// Key Responsibilities
- Tenant profile management
- Payment method management (Stripe)
- Rent payment processing
- Payment history and receipts
- Maintenance request submission
- Request status tracking
- Document access
- Notification preferences
- Emergency contacts

// Key Endpoints
GET    /api/tenants/:id
PUT    /api/tenants/:id
GET    /api/tenants/:id/payments
POST   /api/tenants/:id/payments
GET    /api/tenants/:id/payment-methods
POST   /api/tenants/:id/payment-methods
DELETE /api/tenants/:id/payment-methods/:methodId
GET    /api/tenants/:id/requests
POST   /api/tenants/:id/requests
GET    /api/tenants/:id/documents
GET    /api/tenants/:id/notifications
PUT    /api/tenants/:id/notifications
```

#### 3. Property Service
**Port:** 3003
**Database:** PostgreSQL (tenant_id column)

```typescript
// Key Responsibilities
- Property CRUD operations
- Unit management within properties
- Lease lifecycle management
- Tenant assignment to units
- Property amenities
- Property photos
- Vacancy tracking
- Property search and filtering

// Key Endpoints
GET    /api/properties
POST   /api/properties
GET    /api/properties/:id
PUT    /api/properties/:id
DELETE /api/properties/:id
GET    /api/properties/:id/units
POST   /api/properties/:id/units
GET    /api/units/:id
PUT    /api/units/:id
DELETE /api/units/:id
GET    /api/units/:id/leases
POST   /api/units/:id/leases
GET    /api/leases/:id
PUT    /api/leases/:id
DELETE /api/leases/:id
```

#### 4. Payment Service
**Port:** 3004
**Database:** PostgreSQL (tenant_id column)

```typescript
// Key Responsibilities
- Stripe integration and webhook handling
- Payment processing (ACH, credit card)
- Transaction ledger
- Late fee calculation and application
- Refund processing
- Payment plan management
- Owner distribution scheduling
- Financial reconciliation
- Tax collection and remittance

// Key Endpoints
POST   /api/payments/process
GET    /api/payments/:id
POST   /api/payments/:id/refund
GET    /api/payments/ledger
POST   /api/payments/plans
GET    /api/payments/plans/:id
POST   /api/payments/distributions
GET    /api/payments/distributions/:id
POST   /api/webhooks/stripe
```

#### 5. Maintenance Service
**Port:** 3005
**Database:** PostgreSQL (tenant_id column)

```typescript
// Key Responsibilities (Phase 2+)
- Maintenance request CRUD
- Request triage and categorization
- Work order generation
- Vendor assignment
- SLA tracking
- Invoice processing from vendors
- Request resolution workflow
- Photo attachment management

// Key Endpoints (Phase 2)
GET    /api/maintenance/requests
POST   /api/maintenance/requests
GET    /api/maintenance/requests/:id
PUT    /api/maintenance/requests/:id
POST   /api/maintenance/requests/:id/assign
POST   /api/maintenance/requests/:id/resolve
GET    /api/maintenance/vendors
POST   /api/maintenance/vendors
GET    /api/maintenance/vendors/:id
PUT    /api/maintenance/vendors/:id
GET    /api/maintenance/work-orders
POST   /api/maintenance/work-orders
```

#### 6. Notification Service
**Port:** 3006
**Database:** PostgreSQL (tenant_id column)

```typescript
// Key Responsibilities
- Email sending (SendGrid)
- SMS sending (Twilio)
- Push notification delivery
- Notification preferences management
- Notification templates
- Delivery tracking
- Bounce handling
- Rate limiting per tenant

// Key Endpoints
POST   /api/notifications/send
POST   /api/notifications/send-bulk
GET    /api/notifications/preferences
PUT    /api/notifications/preferences
POST   /api/notifications/templates
GET    /api/notifications/templates/:id
PUT    /api/notifications/templates/:id
POST   /api/webhooks/sendgrid
POST   /api/webhooks/twilio
```

#### 7. Owner Service
**Port:** 3007
**Database:** PostgreSQL (tenant_id column)

```typescript
// Key Responsibilities (Phase 2+)
- Owner profile management
- Portfolio management
- Owner statements generation
- Distribution scheduling
- ROI/NOI calculations
- Market comparables
- Tax report generation
- Investor portal access

// Key Endpoints (Phase 2)
GET    /api/owners/:id
PUT    /api/owners/:id
GET    /api/owners/:id/portfolio
GET    /api/owners/:id/statements
POST   /api/owners/:id/statements
GET    /api/owners/:id/distributions
POST   /api/owners/:id/distributions
GET    /api/owners/:id/analytics
GET    /api/owners/:id/tax-reports
```

#### 8. Analytics Service
**Port:** 3008
**Database:** PostgreSQL + Elasticsearch (Phase 2+)

```typescript
// Key Responsibilities (Phase 2+)
- Real-time dashboard data
- Historical trend analysis
- Forecasting models
- Anomaly detection
- Custom report generation
- Export functionality (PDF, CSV, Excel)
- KPI calculations
- Benchmarking

// Key Endpoints (Phase 2)
GET    /api/analytics/dashboard
GET    /api/analytics/properties/:id
GET    /api/analytics/portfolio
GET    /api/analytics/trends
GET    /api/analytics/forecasts
POST   /api/analytics/reports
GET    /api/analytics/reports/:id
GET    /api/analytics/benchmarks
```

#### 9. Document Service
**Port:** 3009
**Database:** PostgreSQL + S3

```typescript
// Key Responsibilities (Phase 2+)
- Document storage (S3)
- Document metadata management
- E-signature integration (DocuSign, HelloSign)
- Template management
- Document versioning
- Access control
- Document expiration
- OCR processing (Phase 3)

// Key Endpoints (Phase 2)
GET    /api/documents
POST   /api/documents/upload
GET    /api/documents/:id
DELETE /api/documents/:id
GET    /api/documents/:id/versions
POST   /api/documents/:id/sign
GET    /api/documents/templates
POST   /api/documents/templates
GET    /api/documents/templates/:id
```

#### 10. AI Service
**Port:** 3010
**Database:** PostgreSQL + Vector DB (Phase 2+)

```typescript
// Key Responsibilities (Phase 2+)
- LLM orchestration (OpenAI, Anthropic)
- Prompt template management
- Response caching
- FAQ bot logic
- Maintenance triage
- Document summarization
- Sentiment analysis
- Multi-modal processing (Phase 3)

// Key Endpoints (Phase 2)
POST   /api/ai/chat
POST   /api/ai/triage
POST   /api/ai/summarize
POST   /api/ai/analyze-sentiment
POST   /api/ai/predict
GET    /api/ai/prompts
POST   /api/ai/prompts
PUT    /api/ai/prompts/:id
```

#### 11. Integration Service
**Port:** 3011
**Database:** PostgreSQL (tenant_id column)

```typescript
// Key Responsibilities (Phase 3+)
- Third-party API integrations
- Accounting system sync (QuickBooks, Xero)
- CRM integration (Salesforce, HubSpot)
- Property portal syndication
- IoT device management
- Custom integration development

// Key Endpoints (Phase 3)
GET    /api/integrations
POST   /api/integrations/connect
GET    /api/integrations/:id
PUT    /api/integrations/:id
DELETE /api/integrations/:id
POST   /api/integrations/:id/sync
GET    /api/integrations/quickbooks
GET    /api/integrations/salesforce
```

#### 12. Webhook Service
**Port:** 3012
**Database:** PostgreSQL

```typescript
// Key Responsibilities
- Webhook endpoint registration
- Event delivery
- Retry logic with exponential backoff
- Signature verification
- Delivery status tracking
- Dead letter queue management

// Key Endpoints
POST   /api/webhooks
GET    /api/webhooks
GET    /api/webhooks/:id
PUT    /api/webhooks/:id
DELETE /api/webhooks/:id
GET    /api/webhooks/:id/deliveries
POST   /api/webhooks/events/:eventId/retry
```

---

## Data Flow Diagrams

### 1. Tenant Payment Flow

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌───────────┐     ┌────────┐
│  Tenant │ ──▶ │  Front  │ ──▶ │   API    │ ──▶ │  Payment  │ ──▶ │ Stripe │
│  Portal │     │   End   │     │ Gateway  │     │  Service  │     │        │
└─────────┘     └─────────┘     └──────────┘     └───────────┘     └────────┘
                    │                                    │
                    │                                    │
                    ▼                                    ▼
              ┌──────────┐                        ┌────────────┐
              │  GraphQL │                        │ PostgreSQL │
              │  Server  │                        │   Ledger   │
              └──────────┘                        └────────────┘
                                                    │
                                                    ▼
                                            ┌─────────────┐
                                            │   Message   │
                                            │    Queue    │
                                            │ (payment.   │
                                            │  completed) │
                                            └──────┬──────┘
                                                   │
           ┌───────────────────────────────────────┼───────────────────────────────┐
           │                                       │                               │
           ▼                                       ▼                               ▼
    ┌──────────────┐                       ┌──────────────┐                 ┌──────────────┐
    │ Notification │                       │  Owner       │                 │   Webhook    │
    │   Service    │                       │  Service     │                 │   Service    │
    │  (Send Email │                       │ (Schedule    │                 │ (Notify      │
    │   + SMS)     │                       │  Distribution)│               │  External)   │
    └──────────────┘                       └──────────────┘                 └──────────────┘
```

### 2. Maintenance Request Flow (Phase 2)

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────────┐
│  Tenant │ ──▶ │  Front  │ ──▶ │   API    │ ──▶ │ Maintenance │
│  Portal │     │   End   │     │ Gateway  │     │   Service   │
└─────────┘     └─────────┘     └──────────┘     └─────────────┘
                                                  │
                                                  ▼
                                           ┌────────────┐
                                           │ PostgreSQL │
                                           │  (Request) │
                                           └─────┬──────┘
                                                 │
                                                 ▼
                                           ┌─────────────┐
                                           │   Message   │
                                           │    Queue    │
                                           │ (request.   │
                                           │  submitted) │
                                           └──────┬──────┘
                                                  │
                                                 ▼
                                          ┌─────────────┐
                                          │    AI       │
                                          │  Service    │
                                          │ (Triage &   │
                                          │  Categorize)│
                                          └──────┬──────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │ Notification│
                                          │   Service   │
                                          │ (Notify PM) │
                                          └─────────────┘
```

### 3. AI Chat Flow

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐
│  Tenant │ ──▶ │  Front  │ ──▶ │   API    │ ──▶ │   AI    │
│  Portal │     │   End   │     │ Gateway  │     │ Service │
└─────────┘     └─────────┘     └──────────┘     └────┬────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                              ▼                    ▼                    ▼
                       ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                       │    Redis    │      │ PostgreSQL  │      │   Vector    │
                       │ (Cache Check)│      │ (Prompt DB) │      │     DB      │
                       └─────────────┘      └─────────────┘      │ (Embeddings)│
                                                                        └─────┬───────┘
                                                                              │
                              ┌───────────────────────────────────────────────┤
                              │                                               │
                              ▼                                               ▼
                       ┌─────────────┐                                ┌─────────────┐
                       │   OpenAI    │                                │   Context   │
                       │  (LLM Call) │◀───────────────────────────────│ Retrieval   │
                       └──────┬──────┘                                └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ Response    │
                       │ Processing  │
                       └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ Frontend    │
                       │  Display    │
                       └─────────────┘
```

### 4. Multi-Tenant Data Flow

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────────┐
│ Client  │ ──▶ │  API    │ ──▶ │  Service │ ──▶ │ PostgreSQL  │
│ Request │     │ Gateway │     │  Layer   │     │   Query     │
└─────────┘     └─────────┘     └──────────┘     └──────┬──────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │   Row-Level      │
                                          │  Security (RLS)  │
                                          │  (tenant_id =    │
                                          │   current_tenant)│
                                          └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │   Result Set    │
                                          │  (Filtered by   │
                                          │   tenant_id)    │
                                          └─────────────────┘
```

---

## Technology Stack

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 15.x | React framework with SSR/SSG |
| **UI Library** | React | 18.x | UI component library |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Design System** | Radix UI | 1.x | Accessible component primitives |
| **Forms** | React Hook Form | 7.x | Form state management |
| **Validation** | Zod | 3.x | Schema validation |
| **State Management** | Zustand | 4.x | Client state |
| **Data Fetching** | TanStack Query | 5.x | Server state |
| **GraphQL Client** | Apollo Client | 3.x | GraphQL queries |
| **Charts** | Recharts | 2.x | Data visualization |
| **Icons** | Phosphor Icons | 2.x | Icon system |
| **Date Handling** | date-fns | 3.x | Date manipulation |
| **Testing** | Vitest + Testing Library | Latest | Unit & integration tests |

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | NestJS | 10.x | Node.js framework |
| **Language** | TypeScript | 5.x | Type-safe JavaScript |
| **ORM** | Prisma | 5.x | Database ORM |
| **Validation** | class-validator | Latest | DTO validation |
| **Authentication** | Passport | 0.7.x | Auth strategies |
| **GraphQL** | Apollo Server | 4.x | GraphQL server |
| **API Gateway** | Kong | 3.x | API management |
| **Message Queue** | RabbitMQ | 3.12.x | Event bus |
| **Cache** | Redis | 7.x | Caching & sessions |
| **Search** | Elasticsearch | 8.x | Full-text search |
| **Vector DB** | Pinecone | Latest | Vector embeddings |
| **Testing** | Jest | 29.x | Unit & integration tests |

### Database
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Primary DB** | PostgreSQL | 16.x | Relational data |
| **Cache** | Redis | 7.x | Caching & queues |
| **Object Storage** | AWS S3 | Latest | File storage |
| **Search** | Elasticsearch | 8.x | Search & analytics |
| **Vector Store** | Pinecone | Latest | AI embeddings |
| **Backup** | AWS Backup | Latest | Automated backups |

### Infrastructure
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Cloud Provider** | AWS | Latest | Cloud infrastructure |
| **Container Runtime** | Docker | 24.x | Containerization |
| **Orchestration** | Kubernetes | 1.29.x | Container orchestration |
| **CI/CD** | GitHub Actions | Latest | CI/CD pipeline |
| **Monitoring** | Datadog / New Relic | Latest | Observability |
| **Logging** | ELK Stack | 8.x | Centralized logging |
| **Secrets** | AWS Secrets Manager | Latest | Secret management |
| **CDN** | CloudFront | Latest | Content delivery |
| **Load Balancer** | AWS ALB | Latest | Traffic distribution |

### External Services
| Service | Provider | Purpose |
|---------|----------|---------|
| **Payments** | Stripe | Payment processing |
| **E-Signature** | DocuSign / HelloSign | Digital signatures |
| **SMS/Voice** | Twilio | Communications |
| **Email** | SendGrid | Email delivery |
| **LLM** | OpenAI / Anthropic | AI capabilities |
| **Maps** | Google Maps API | Location services |
| **Accounting** | QuickBooks Online | Financial sync |
| **CRM** | Salesforce | Customer management |

---

## Multi-Tenancy Strategy

### Approach: Database-Level Multi-Tenancy with Row-Level Security

PropertyOS uses a **shared database, shared schema** approach with **row-level security (RLS)** for data isolation. This provides:

- **Cost Efficiency**: Single database instance reduces infrastructure costs
- **Simplified Maintenance**: Single schema for migrations and updates
- **Strong Isolation**: RLS ensures tenants cannot access each other's data
- **Scalability**: Can migrate to schema-per-tenant or database-per-tenant if needed

### Implementation Details

```sql
-- Enable Row-Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policy to enforce tenant isolation
CREATE POLICY tenant_isolation_policy ON properties
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Application sets tenant context on each request
SET app.current_tenant_id = '123e4567-e89b-12d3-a456-426614174000';
```

### Tenant Context Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │ ──▶ │   API       │ ──▶ │ PostgreSQL  │
│   Request   │     │  Gateway     │     │  Connection │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Extract   │
                    │  tenant_id  │
                    │  from JWT   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   SET app.  │
                    │ current_    │
                    │ tenant_id   │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Execute   │
                    │   Query     │
                    │ (with RLS)  │
                    └─────────────┘
```

### Tenant Hierarchy

```
Organization (tenant_id)
├── Properties
│   ├── Units
│   │   ├── Leases
│   │   └── Tenants
│   ├── Maintenance Requests
│   └── Documents
├── Owners
│   ├── Portfolios
│   └── Distributions
├── Vendors
│   └── Work Orders
└── Users
    ├── Roles
    └── Permissions
```

---

## Caching Strategy

### Cache Layers

| Layer | Technology | TTL | Purpose |
|-------|-----------|-----|---------|
| **L1 - Application** | In-memory (LRU) | 5 min | Hot data, user sessions |
| **L2 - Distributed** | Redis | 15 min | Shared cache, rate limits |
| **L3 - CDN** | CloudFront | 1 hour | Static assets, API responses |

### Cache Keys

```
user:{user_id}                    → User profile
tenant:{tenant_id}:properties     → Property list
tenant:{tenant_id}:analytics      → Dashboard data
payment:{payment_id}              → Payment details
request:{request_id}              → Maintenance request
ai:cache:{prompt_hash}            → AI response cache
```

### Cache Invalidation

```typescript
// Write-through pattern
async function updateProperty(id: string, data: PropertyUpdate) {
  // 1. Update database
  const property = await db.property.update({ where: { id }, data });

  // 2. Invalidate cache
  await cache.del(`property:${id}`);
  await cache.del(`tenant:${property.tenantId}:properties`);

  // 3. Publish event
  await eventBus.publish('property.updated', { id, tenantId: property.tenantId });

  return property;
}
```

---

## Event-Driven Architecture

### Event Schema

```typescript
interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  tenantId: string;
  payload: any;
  timestamp: Date;
  version: number;
  correlationId?: string;
}
```

### Core Events

| Event | Source | Consumers | Purpose |
|-------|--------|-----------|---------|
| `tenant.created` | Tenant Service | Notification, Analytics | Onboarding sequence |
| `payment.completed` | Payment Service | Notification, Owner, Webhook | Distribute funds, notify |
| `payment.failed` | Payment Service | Notification, AI | Retry logic, alerts |
| `request.submitted` | Maintenance Service | Notification, AI | Triage, assign vendor |
| `lease.created` | Property Service | Analytics, Owner | Portfolio tracking |
| `lease.expiring` | Property Service | Notification, AI | Renewal workflow |
| `user.invited` | Auth Service | Notification | Welcome email |

### Event Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Service   │ ──▶ │   Message   │ ──▶ │  Consumer   │
│  (Producer) │     │    Queue    │     │  Service    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           │
                           ▼
                    ┌─────────────┐
                    │   Dead      │
                    │  Letter     │
                    │   Queue     │
                    └─────────────┘
```

---

## GraphQL vs REST Strategy

### When to Use GraphQL
- **Dashboards**: Complex, nested data requirements
- **Mobile Apps**: Reduce over-fetching, single requests
- **Analytics**: Flexible querying, custom aggregations

### When to Use REST
- **Webhooks**: Simple, standardized endpoint structure
- **External Integrations**: Easier for third-party developers
- **File Uploads**: Binary data handling
- **Simple CRUD**: Straightforward operations

### Example: Property Query (GraphQL)

```graphql
query GetPropertyDashboard($tenantId: ID!, $propertyId: ID!) {
  property(id: $propertyId) {
    id
    name
    address
    units {
      id
      number
      rent
      status
      currentLease {
        tenant {
          id
          name
          email
        }
        endDate
      }
    }
    maintenanceRequests {
      id
      status
      priority
      createdAt
    }
    analytics {
      occupancyRate
      averageRent
      revenueTrend(period: LAST_6_MONTHS)
    }
  }
}
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────────┐
│  Client │ ──▶ │  Front  │ ──▶ │   API    │ ──▶ │  Auth       │
│         │     │   End   │     │ Gateway  │     │  Service    │
└─────────┘     └─────────┘     └──────────┘     └─────────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                              ▼                    ▼                    ▼
                       ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                       │  PostgreSQL │      │   Redis     │      │   OAuth     │
                       │ (User DB)   │      │ (Sessions)  │      │  Provider   │
                       └─────────────┘      └─────────────┘      └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   JWT Token │
                       │  Generation │
                       └─────────────┘
```

### Authorization Layers

1. **API Gateway**: Validate JWT, extract claims
2. **Service Layer**: Role-based access control (RBAC)
3. **Database Layer**: Row-level security (RLS)
4. **Resource Layer**: Permission checks (owner, manager, tenant)

### Security Headers

```typescript
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

---

## Performance Optimization

### Database Optimization
- **Indexes**: Composite indexes on (tenant_id, commonly_filtered_columns)
- **Connection Pooling**: PgBouncer for efficient connection management
- **Read Replicas**: Offload read queries to replicas
- **Partitioning**: Partition large tables by tenant_id or date

### Application Optimization
- **Lazy Loading**: Load related data only when needed
- **Pagination**: Cursor-based pagination for large datasets
- **Compression**: Gzip/Brotli compression for API responses
- **CDN**: Serve static assets from edge locations

### Caching Optimization
- **Query Result Caching**: Cache expensive queries
- **Response Caching**: Cache API responses with ETags
- **Fragment Caching**: Cache reusable UI components
- **Edge Caching**: Cache frequently accessed data at CDN level

---

## Monitoring & Observability

### Metrics
- **Business Metrics**: Active users, payment volume, request volume
- **Application Metrics**: Request latency, error rates, throughput
- **Infrastructure Metrics**: CPU, memory, disk I/O, network
- **Database Metrics**: Query performance, connection pool, replication lag

### Logging
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Log Aggregation**: Centralized logging with ELK Stack
- **Log Retention**: 30 days hot, 1 year cold storage

### Tracing
- **Distributed Tracing**: OpenTelemetry for end-to-end tracing
- **Service Graph**: Visualize service dependencies
- **Performance Analysis**: Identify bottlenecks across services

### Alerts
- **Critical Alerts**: Database down, payment failures, security incidents
- **Warning Alerts**: High error rates, slow queries, high latency
- **Info Alerts**: Deployment completions, feature flags toggled

---

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Daily full backups, hourly incremental
- **Object Storage**: Versioned backups with 30-day retention
- **Configuration**: Git version control with automated backups
- **Testing**: Monthly restore drills

### High Availability
- **Multi-AZ Deployment**: Spread across multiple availability zones
- **Auto Scaling**: Automatically scale based on load
- **Load Balancing**: Distribute traffic across instances
- **Health Checks**: Automated health monitoring and recovery

### Recovery Objectives
- **RTO (Recovery Time Objective)**: < 1 hour for critical services
- **RPO (Recovery Point Objective)**: < 15 minutes for data loss

---

## Deployment Architecture

### Environments
| Environment | Purpose | Data | Features |
|-------------|---------|------|----------|
| **Development** | Local development | Mock data | All features |
| **Staging** | Pre-production testing | Anonymized production data | All features |
| **Production** | Live production | Real data | Production features |

### Deployment Pipeline

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Code   │ ──▶ │  Build  │ ──▶ │  Test   │ ──▶ │  Deploy │ ──▶ │  Verify │
│  Push   │     │  & Tag  │     │  Suite  │     │  Staging│     │  & Smoke │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
                                                          │
                                                          ▼
                                                   ┌─────────────┐
                                                   │  Manual     │
                                                   │  Approval   │
                                                   └──────┬──────┘
                                                          │
                                                          ▼
                                                   ┌─────────────┐
                                                   │  Deploy     │
                                                   │  Production │
                                                   │  (Blue/Green)│
                                                   └─────────────┘
```

### Deployment Strategies
- **Blue-Green Deployment**: Zero downtime deployments
- **Canary Releases**: Gradual rollout to subset of users
- **Feature Flags**: Toggle features without deployment
- **Rollback**: Instant rollback capability