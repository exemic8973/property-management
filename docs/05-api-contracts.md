# API Contracts: PropertyOS

## Overview

PropertyOS exposes a **hybrid API architecture** with both **REST** and **GraphQL** endpoints, optimized for different use cases:

- **REST APIs**: Simple CRUD operations, webhooks, file uploads, external integrations
- **GraphQL**: Complex queries, dashboards, real-time updates, mobile apps

All APIs are secured with **JWT-based authentication** and enforce **role-based access control (RBAC)** at multiple layers.

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────────┐
│  Client │ ──▶ │  API     │ ──▶ │  Auth     │ ──▶ │  Database   │
│         │     │ Gateway  │     │ Service   │     │             │
└─────────┘     └─────────┘     └──────────┘     └─────────────┘
                          │
                          │ Extract JWT
                          │
                          ▼
                   ┌─────────────┐
                   │  Validate   │
                   │  Token      │
                   └──────┬──────┘
                          │
                          │ Extract Claims
                          │ (user_id, tenant_id, role)
                          │
                          ▼
                   ┌─────────────┐
                   │  Set Tenant │
                   │  Context    │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Route to   │
                   │  Service    │
                   └─────────────┘
```

### JWT Token Structure

```typescript
interface JWTPayload {
  sub: string;           // User ID
  tenant_id: string;     // Tenant ID
  role: UserRole;        // User role
  email: string;         // User email
  iat: number;           // Issued at
  exp: number;           // Expiration
}

// Example JWT Payload
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
  "role": "manager",
  "email": "manager@example.com",
  "iat": 1737657600,
  "exp": 1737744000
}
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "tenant_name": "Acme Properties",
  "email": "admin@acme.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}

Response 201:
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@acme.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin"
  },
  "organization": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Acme Properties",
    "slug": "acme-properties",
    "plan": "essential"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@acme.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "tenant_id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response 204
```

### Authorization Levels

#### Role Hierarchy

```
admin (All permissions)
  ├── manager (Operational access)
  │   ├── owner (Financial access)
  │   └── accountant (Reporting access)
  └── tenant (Self-service)
      └── vendor (Limited access)
```

#### Permission Matrix

| Resource | admin | manager | owner | tenant | vendor |
|----------|-------|---------|-------|--------|--------|
| **Properties** | | | | | |
| Create | ✓ | ✓ | ✗ | ✗ | ✗ |
| Read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Units** | | | | | |
| Create | ✓ | ✓ | ✗ | ✗ | ✗ |
| Read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Leases** | | | | | |
| Create | ✓ | ✓ | ✗ | ✗ | ✗ |
| Read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Payments** | | | | | |
| Create (tenant) | ✓ | ✓ | ✗ | ✓ | ✗ |
| Read | ✓ | ✓ | ✓ | ✓ | ✗ |
| Refund | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Maintenance** | | | | | |
| Create | ✓ | ✓ | ✗ | ✓ | ✗ |
| Read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assign | ✓ | ✓ | ✗ | ✗ | ✗ |
| Resolve | ✓ | ✓ | ✗ | ✗ | ✓ |
| **Documents** | | | | | |
| Upload | ✓ | ✓ | ✗ | ✓ | ✗ |
| Read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Delete | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Analytics** | | | | | |
| Read | ✓ | ✓ | ✓ | ✗ | ✗ |
| Export | ✓ | ✓ | ✓ | ✗ | ✗ |

---

## REST API Endpoints

### Base URL
```
Production: https://api.propertyos.com/v1
Staging: https://api-staging.propertyos.com/v1
Development: http://localhost:3001/v1
```

### Common Headers

```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-Tenant-ID: {tenant_id}  // Optional, for multi-tenant apps
X-Request-ID: {uuid}       // Optional, for request tracing
```

### Common Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "request_id": "req_abc123",
    "timestamp": "2026-02-04T10:30:00Z"
  }
}
```

---

### Properties API

#### List Properties
```http
GET /v1/properties
Authorization: Bearer {token}

Query Parameters:
- page: integer (default: 1)
- limit: integer (default: 20, max: 100)
- status: string (active, inactive)
- type: string (residential, commercial, mixed_use)
- search: string (search by name or address)
- sort: string (name, created_at, -name, -created_at)

Response 200:
{
  "data": [
    {
      "id": "prop_abc123",
      "name": "Sunset Apartments",
      "type": "residential",
      "address": {
        "street1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip_code": "94102",
        "country": "US"
      },
      "status": "active",
      "total_units": 24,
      "occupied_units": 20,
      "vacancy_rate": 0.1667,
      "monthly_revenue": 48000,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### Get Property
```http
GET /v1/properties/{id}
Authorization: Bearer {token}

Response 200:
{
  "id": "prop_abc123",
  "name": "Sunset Apartments",
  "type": "residential",
  "address": {
    "street1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102",
    "country": "US",
    "coordinates": {
      "lat": 37.7749,
      "lng": -122.4194
    }
  },
  "year_built": 1990,
  "square_feet": 50000,
  "amenities": [
    "parking",
    "laundry",
    "pool",
    "gym"
  ],
  "photos": [
    {
      "url": "https://cdn.propertyos.com/properties/prop_abc123/photo1.jpg",
      "caption": "Exterior view"
    }
  ],
  "status": "active",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-01T00:00:00Z"
}
```

#### Create Property
```http
POST /v1/properties
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Sunset Apartments",
  "type": "residential",
  "address": {
    "street1": "123 Main St",
    "street2": "Apt 100",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102",
    "country": "US"
  },
  "year_built": 1990,
  "square_feet": 50000,
  "amenities": ["parking", "laundry", "pool", "gym"]
}

Response 201:
{
  "id": "prop_abc123",
  "name": "Sunset Apartments",
  "type": "residential",
  "status": "active",
  "created_at": "2026-02-04T10:30:00Z"
}
```

#### Update Property
```http
PATCH /v1/properties/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Sunset Apartments - Updated",
  "amenities": ["parking", "laundry", "pool", "gym", "ev_charging"]
}

Response 200:
{
  "id": "prop_abc123",
  "name": "Sunset Apartments - Updated",
  "amenities": ["parking", "laundry", "pool", "gym", "ev_charging"],
  "updated_at": "2026-02-04T10:35:00Z"
}
```

#### Delete Property
```http
DELETE /v1/properties/{id}
Authorization: Bearer {token}

Response 204
```

---

### Units API

#### List Units
```http
GET /v1/properties/{property_id}/units
Authorization: Bearer {token}

Query Parameters:
- page: integer (default: 1)
- limit: integer (default: 20)
- status: string (vacant, occupied, maintenance)
- type: string (studio, one_bedroom, two_bedroom, etc.)
- bedrooms: integer
- min_rent: decimal
- max_rent: decimal

Response 200:
{
  "data": [
    {
      "id": "unit_xyz789",
      "property_id": "prop_abc123",
      "number": "101",
      "type": "one_bedroom",
      "floor": 1,
      "square_feet": 750,
      "bedrooms": 1,
      "bathrooms": 1.0,
      "base_rent": 2500.00,
      "deposit": 2500.00,
      "status": "occupied",
      "current_lease": {
        "id": "lease_def456",
        "tenant_id": "tenant_ghi789",
        "tenant_name": "John Smith",
        "start_date": "2026-01-01",
        "end_date": "2026-12-31",
        "monthly_rent": 2500.00
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 24,
    "total_pages": 2
  }
}
```

#### Get Unit
```http
GET /v1/units/{id}
Authorization: Bearer {token}

Response 200:
{
  "id": "unit_xyz789",
  "property_id": "prop_abc123",
  "number": "101",
  "type": "one_bedroom",
  "floor": 1,
  "square_feet": 750,
  "bedrooms": 1,
  "bathrooms": 1.0,
  "base_rent": 2500.00,
  "deposit": 2500.00,
  "amenities": ["hardwood_floors", "washer_dryer"],
  "photos": [
    {
      "url": "https://cdn.propertyos.com/units/unit_xyz789/photo1.jpg"
    }
  ],
  "status": "occupied",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-01T00:00:00Z"
}
```

#### Create Unit
```http
POST /v1/properties/{property_id}/units
Authorization: Bearer {token}
Content-Type: application/json

{
  "number": "102",
  "type": "two_bedroom",
  "floor": 1,
  "square_feet": 900,
  "bedrooms": 2,
  "bathrooms": 2.0,
  "base_rent": 3200.00,
  "deposit": 3200.00,
  "amenities": ["hardwood_floors", "washer_dryer", "balcony"]
}

Response 201:
{
  "id": "unit_xyz789",
  "property_id": "prop_abc123",
  "number": "102",
  "status": "vacant",
  "created_at": "2026-02-04T10:30:00Z"
}
```

---

### Leases API

#### List Leases
```http
GET /v1/leases
Authorization: Bearer {token}

Query Parameters:
- page: integer
- limit: integer
- status: string (draft, pending, active, expiring_soon, expired)
- tenant_id: string
- unit_id: string
- property_id: string

Response 200:
{
  "data": [
    {
      "id": "lease_def456",
      "unit_id": "unit_xyz789",
      "unit_number": "101",
      "property_id": "prop_abc123",
      "property_name": "Sunset Apartments",
      "tenant_id": "tenant_ghi789",
      "tenant_name": "John Smith",
      "start_date": "2026-01-01",
      "end_date": "2026-12-31",
      "monthly_rent": 2500.00,
      "security_deposit": 2500.00,
      "status": "active",
      "days_until_expiry": 331
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 18,
    "total_pages": 1
  }
}
```

#### Get Lease
```http
GET /v1/leases/{id}
Authorization: Bearer {token}

Response 200:
{
  "id": "lease_def456",
  "unit_id": "unit_xyz789",
  "unit": {
    "id": "unit_xyz789",
    "number": "101",
    "property_name": "Sunset Apartments"
  },
  "tenant_id": "tenant_ghi789",
  "tenant": {
    "id": "tenant_ghi789",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@example.com",
    "phone": "+1-555-123-4567"
  },
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "monthly_rent": 2500.00,
  "security_deposit": 2500.00,
  "pet_deposit": 500.00,
  "pet_fee": 50.00,
  "late_fee_percentage": 5.00,
  "late_fee_grace_days": 5,
  "status": "active",
  "terms_pdf_url": "https://cdn.propertyos.com/documents/lease_def456.pdf",
  "signed_at": "2025-12-15T10:00:00Z",
  "auto_renew": false,
  "created_at": "2025-12-01T00:00:00Z"
}
```

#### Create Lease
```http
POST /v1/leases
Authorization: Bearer {token}
Content-Type: application/json

{
  "unit_id": "unit_xyz789",
  "tenant_id": "tenant_ghi789",
  "start_date": "2026-02-01",
  "end_date": "2027-01-31",
  "monthly_rent": 2500.00,
  "security_deposit": 2500.00,
  "pet_deposit": 500.00,
  "pet_fee": 50.00,
  "late_fee_percentage": 5.00,
  "late_fee_grace_days": 5,
  "auto_renew": false,
  "terms": "Standard residential lease agreement..."
}

Response 201:
{
  "id": "lease_def456",
  "unit_id": "unit_xyz789",
  "tenant_id": "tenant_ghi789",
  "status": "draft",
  "created_at": "2026-02-04T10:30:00Z"
}
```

---

### Payments API

#### List Payments
```http
GET /v1/payments
Authorization: Bearer {token}

Query Parameters:
- page: integer
- limit: integer
- status: string (pending, processing, completed, failed, refunded)
- method: string (ach, credit_card, debit_card)
- lease_id: string
- tenant_id: string
- from_date: date
- to_date: date

Response 200:
{
  "data": [
    {
      "id": "pay_abc123",
      "lease_id": "lease_def456",
      "tenant_id": "tenant_ghi789",
      "tenant_name": "John Smith",
      "amount": 2500.00,
      "method": "ach",
      "status": "completed",
      "due_date": "2026-02-01",
      "paid_at": "2026-02-01T14:30:00Z",
      "late_fee_applied": false,
      "receipt_url": "https://cdn.propertyos.com/receipts/pay_abc123.pdf"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### Create Payment
```http
POST /v1/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "lease_id": "lease_def456",
  "amount": 2500.00,
  "method": "ach",
  "payment_method_id": "pm_1234567890"
}

Response 201:
{
  "id": "pay_abc123",
  "lease_id": "lease_def456",
  "amount": 2500.00,
  "method": "ach",
  "status": "processing",
  "stripe_payment_intent_id": "pi_3ABC123...",
  "created_at": "2026-02-04T10:30:00Z"
}
```

#### Get Payment
```http
GET /v1/payments/{id}
Authorization: Bearer {token}

Response 200:
{
  "id": "pay_abc123",
  "lease_id": "lease_def456",
  "tenant_id": "tenant_ghi789",
  "amount": 2500.00,
  "method": "ach",
  "status": "completed",
  "stripe_payment_intent_id": "pi_3ABC123...",
  "due_date": "2026-02-01",
  "paid_at": "2026-02-01T14:30:00Z",
  "late_fee_applied": false,
  "receipt_url": "https://cdn.propertyos.com/receipts/pay_abc123.pdf",
  "created_at": "2026-02-04T10:30:00Z"
}
```

#### Refund Payment
```http
POST /v1/payments/{id}/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 2500.00,
  "reason": "Tenant moved out early"
}

Response 200:
{
  "id": "pay_abc123",
  "status": "refunded",
  "refunded_at": "2026-02-04T11:00:00Z",
  "refund_amount": 2500.00
}
```

---

### Maintenance API

#### List Maintenance Requests
```http
GET /v1/maintenance/requests
Authorization: Bearer {token}

Query Parameters:
- page: integer
- limit: integer
- status: string (submitted, triaged, assigned, in_progress, completed)
- priority: string (low, medium, high, emergency)
- category: string (plumbing, electrical, hvac, appliances, etc.)
- unit_id: string
- property_id: string
- assigned_to_id: string

Response 200:
{
  "data": [
    {
      "id": "mr_abc123",
      "unit_id": "unit_xyz789",
      "unit_number": "101",
      "property_id": "prop_abc123",
      "property_name": "Sunset Apartments",
      "tenant_id": "tenant_ghi789",
      "tenant_name": "John Smith",
      "category": "plumbing",
      "priority": "medium",
      "title": "Leaking faucet",
      "description": "The bathroom faucet is dripping constantly.",
      "status": "submitted",
      "photos": [
        "https://cdn.propertyos.com/maintenance/mr_abc123/photo1.jpg"
      ],
      "created_at": "2026-02-04T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1
  }
}
```

#### Create Maintenance Request
```http
POST /v1/maintenance/requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "unit_id": "unit_xyz789",
  "category": "plumbing",
  "priority": "medium",
  "title": "Leaking faucet",
  "description": "The bathroom faucet is dripping constantly.",
  "photos": ["data:image/jpeg;base64,..."]
}

Response 201:
{
  "id": "mr_abc123",
  "unit_id": "unit_xyz789",
  "category": "plumbing",
  "priority": "medium",
  "status": "submitted",
  "created_at": "2026-02-04T10:30:00Z"
}
```

#### Update Maintenance Request
```http
PATCH /v1/maintenance/requests/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "assigned",
  "assigned_to_id": "user_jkl012",
  "assigned_vendor_id": "vendor_mno345",
  "estimated_cost": 150.00
}

Response 200:
{
  "id": "mr_abc123",
  "status": "assigned",
  "assigned_to_id": "user_jkl012",
  "assigned_vendor_id": "vendor_mno345",
  "estimated_cost": 150.00,
  "updated_at": "2026-02-04T11:00:00Z"
}
```

#### Resolve Maintenance Request
```http
POST /v1/maintenance/requests/{id}/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "resolution_notes": "Replaced faucet cartridge. No further issues.",
  "actual_cost": 145.00,
  "resolution_photos": ["data:image/jpeg;base64,..."]
}

Response 200:
{
  "id": "mr_abc123",
  "status": "completed",
  "resolved_at": "2026-02-04T12:00:00Z",
  "resolution_notes": "Replaced faucet cartridge. No further issues.",
  "actual_cost": 145.00
}
```

---

### Documents API

#### Upload Document
```http
POST /v1/documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: (binary)
- type: string (lease, invoice, receipt, insurance, etc.)
- entity_type: string (property, unit, lease, tenant, maintenance_request)
- entity_id: string
- description: string (optional)

Response 201:
{
  "id": "doc_abc123",
  "type": "lease",
  "entity_type": "lease",
  "entity_id": "lease_def456",
  "file_name": "lease_agreement.pdf",
  "file_size": 245678,
  "mime_type": "application/pdf",
  "file_url": "https://cdn.propertyos.com/documents/doc_abc123.pdf",
  "created_at": "2026-02-04T10:30:00Z"
}
```

#### Get Document
```http
GET /v1/documents/{id}
Authorization: Bearer {token}

Response 200:
{
  "id": "doc_abc123",
  "type": "lease",
  "entity_type": "lease",
  "entity_id": "lease_def456",
  "file_name": "lease_agreement.pdf",
  "file_size": 245678,
  "mime_type": "application/pdf",
  "file_url": "https://cdn.propertyos.com/documents/doc_abc123.pdf",
  "description": "Signed lease agreement",
  "created_at": "2026-02-04T10:30:00Z"
}
```

#### Delete Document
```http
DELETE /v1/documents/{id}
Authorization: Bearer {token}

Response 204
```

---

### Notifications API

#### Get Notifications
```http
GET /v1/notifications
Authorization: Bearer {token}

Query Parameters:
- page: integer
- limit: integer
- unread_only: boolean

Response 200:
{
  "data": [
    {
      "id": "notif_abc123",
      "type": "payment_reminder",
      "channel": "email",
      "title": "Rent payment due",
      "body": "Your rent payment of $2,500.00 is due on February 1st.",
      "read": false,
      "created_at": "2026-01-28T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

#### Mark as Read
```http
POST /v1/notifications/{id}/read
Authorization: Bearer {token}

Response 204
```

---

## GraphQL API

### Endpoint
```
Production: https://api.propertyos.com/graphql
Staging: https://api-staging.propertyos.com/graphql
Development: http://localhost:3001/graphql
```

### Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Schema Definition

```graphql
scalar Date
scalar DateTime
scalar JSON

enum UserRole {
  ADMIN
  MANAGER
  OWNER
  TENANT
  VENDOR
  ACCOUNTANT
}

enum PropertyType {
  RESIDENTIAL
  COMMERCIAL
  MIXED_USE
  INDUSTRIAL
  LAND
}

enum UnitType {
  STUDIO
  ONE_BEDROOM
  TWO_BEDROOM
  THREE_BEDROOM
  FOUR_PLUS_BEDROOM
  TOWNHOUSE
  DUPLEX
  COMMERCIAL_SPACE
}

enum LeaseStatus {
  DRAFT
  PENDING
  ACTIVE
  EXPIRING_SOON
  EXPIRED
  TERMINATED
  RENEWED
}

enum PaymentMethod {
  ACH
  CREDIT_CARD
  DEBIT_CARD
  CHECK
  CASH
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  PARTIAL_REFUND
  CANCELLED
}

enum MaintenanceCategory {
  PLUMBING
  ELECTRICAL
  HVAC
  APPLIANCES
  STRUCTURAL
  PEST_CONTROL
  LANDSCAPING
  SECURITY
  INTERNET
  OTHER
}

enum MaintenancePriority {
  LOW
  MEDIUM
  HIGH
  EMERGENCY
}

enum MaintenanceStatus {
  SUBMITTED
  TRIAGED
  ASSIGNED
  IN_PROGRESS
  AWAITING_PARTS
  COMPLETED
  CANCELLED
  REOPENED
}

type Address {
  id: ID!
  street1: String!
  street2: String
  city: String!
  state: String!
  zipCode: String!
  country: String!
  coordinates: Coordinates
}

type Coordinates {
  lat: Float!
  lng: Float!
}

type Organization {
  id: ID!
  name: String!
  slug: String!
  plan: String!
  status: String!
  settings: JSON!
  createdAt: DateTime!
}

type User {
  id: ID!
  tenantId: ID!
  organization: Organization!
  email: String!
  firstName: String
  lastName: String
  role: UserRole!
  mfaEnabled: Boolean!
  lastLogin: DateTime
  emailVerified: Boolean!
  phone: String
  avatarUrl: String
  preferences: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Property {
  id: ID!
  tenantId: ID!
  name: String!
  type: PropertyType!
  address: Address
  yearBuilt: Int
  squareFeet: Int
  lotSize: Float
  parkingSpaces: Int
  amenities: [String!]!
  photos: [Photo!]!
  metadata: JSON!
  status: String!
  units: [Unit!]!
  unitsCount: Int!
  occupiedUnitsCount: Int!
  vacancyRate: Float!
  monthlyRevenue: Float!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Photo {
  url: String!
  caption: String
}

type Unit {
  id: ID!
  propertyId: ID!
  property: Property!
  number: String!
  type: UnitType!
  floor: Int
  squareFeet: Int
  bedrooms: Int
  bathrooms: Float!
  baseRent: Float!
  deposit: Float!
  amenities: [String!]!
  photos: [Photo!]!
  status: String!
  currentLease: Lease
  currentTenant: Tenant
  metadata: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Lease {
  id: ID!
  unitId: ID!
  unit: Unit!
  tenantId: ID
  tenant: Tenant
  startDate: Date!
  endDate: Date!
  monthlyRent: Float!
  securityDeposit: Float
  petDeposit: Float
  petFee: Float
  lateFeePercentage: Float!
  lateFeeGraceDays: Int!
  status: LeaseStatus!
  terms: String
  termsPdfUrl: String
  signedAt: DateTime
  autoRenew: Boolean!
  renewalOfferSent: Boolean!
  metadata: JSON!
  payments: [Payment!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  daysUntilExpiry: Int!
}

type Tenant {
  id: ID!
  userId: ID!
  user: User!
  leaseId: ID
  lease: Lease
  firstName: String!
  lastName: String!
  phone: String
  dateOfBirth: Date
  driverLicense: String
  emergencyContactId: ID
  employerName: String
  employerPhone: String
  income: Float
  preferences: JSON!
  metadata: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Payment {
  id: ID!
  tenantId: ID!
  tenant: Tenant!
  leaseId: ID!
  lease: Lease!
  amount: Float!
  method: PaymentMethod!
  status: PaymentStatus!
  stripePaymentIntentId: String
  paymentMethodId: String
  dueDate: Date!
  paidAt: DateTime
  failedAt: DateTime
  failureReason: String
  lateFeeApplied: Boolean!
  lateFeeAmount: Float
  partialPayment: Boolean!
  parentPaymentId: ID
  receiptUrl: String
  notes: String
  metadata: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type MaintenanceRequest {
  id: ID!
  tenantId: ID!
  tenant: Tenant!
  unitId: ID!
  unit: Unit!
  category: MaintenanceCategory!
  priority: MaintenancePriority!
  title: String!
  description: String!
  status: MaintenanceStatus!
  assignedTo: User
  assignedVendor: Vendor
  photos: [String!]!
  estimatedCost: Float
  actualCost: Float
  resolutionNotes: String
  resolvedAt: DateTime
  resolutionPhotos: [String!]!
  tenantSatisfied: Boolean
  tenantRating: Int
  metadata: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Vendor {
  id: ID!
  tenantId: ID!
  name: String!
  type: String!
  contactName: String
  contactEmail: String
  contactPhone: String
  address: Address
  website: String
  rating: Float
  totalJobs: Int!
  notes: String
  active: Boolean!
  metadata: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Owner {
  id: ID!
  tenantId: ID!
  userId: ID
  user: User
  name: String!
  email: String
  phone: String
  address: Address
  bankAccountId: ID
  ownershipPercentage: Float!
  distributionFrequency: String!
  distributionDay: Int!
  taxId: String
  active: Boolean!
  metadata: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
  properties: [Property!]!
}

type Document {
  id: ID!
  tenantId: ID!
  type: String!
  entityType: String!
  entityId: ID!
  fileName: String!
  filePath: String!
  fileSize: Int!
  mimeType: String!
  description: String
  uploadedBy: User
  expiresAt: DateTime
  accessLevel: String!
  tags: [String!]!
  metadata: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Notification {
  id: ID!
  userId: ID!
  type: String!
  channel: String!
  title: String!
  body: String!
  data: JSON!
  status: String!
  sentAt: DateTime
  readAt: DateTime
  createdAt: DateTime!
}

type PropertyAnalytics {
  propertyId: ID!
  occupancyRate: Float!
  averageRent: Float!
  totalRevenue: Float!
  totalExpenses: Float!
  netOperatingIncome: Float!
  capRate: Float!
  revenueTrend(period: AnalyticsPeriod!): [TrendPoint!]!
  maintenanceCost(period: AnalyticsPeriod!): Float!
  vacancyRate: Float!
}

type TrendPoint {
  date: Date!
  value: Float!
}

enum AnalyticsPeriod {
  LAST_7_DAYS
  LAST_30_DAYS
  LAST_6_MONTHS
  LAST_12_MONTHS
  THIS_YEAR
  LAST_YEAR
}

type PortfolioAnalytics {
  tenantId: ID!
  totalProperties: Int!
  totalUnits: Int!
  occupiedUnits: Int!
  vacantUnits: Int!
  occupancyRate: Float!
  monthlyRevenue: Float!
  monthlyExpenses: Float!
  netOperatingIncome: Float!
  totalRevenue(period: AnalyticsPeriod!): Float!
  totalExpenses(period: AnalyticsPeriod!): Float!
  averageRent: Float!
  revenueTrend(period: AnalyticsPeriod!): [TrendPoint!]!
  vacancyRate: Float!
  openMaintenanceRequests: Int!
}

type Query {
  # Authentication
  me: User

  # Properties
  properties(
    first: Int
    after: String
    status: String
    type: PropertyType
    search: String
  ): PropertyConnection!

  property(id: ID!): Property

  # Units
  units(
    propertyId: ID!
    first: Int
    after: String
    status: String
    type: UnitType
    bedrooms: Int
    minRent: Float
    maxRent: Float
  ): UnitConnection!

  unit(id: ID!): Unit

  # Leases
  leases(
    first: Int
    after: String
    status: LeaseStatus
    tenantId: ID
    unitId: ID
    propertyId: ID
  ): LeaseConnection!

  lease(id: ID!): Lease

  # Tenants
  tenants(
    first: Int
    after: String
    search: String
  ): TenantConnection!

  tenant(id: ID!): Tenant

  # Payments
  payments(
    first: Int
    after: String
    status: PaymentStatus
    method: PaymentMethod
    leaseId: ID
    tenantId: ID
    fromDate: Date
    toDate: Date
  ): PaymentConnection!

  payment(id: ID!): Payment

  # Maintenance
  maintenanceRequests(
    first: Int
    after: String
    status: MaintenanceStatus
    priority: MaintenancePriority
    category: MaintenanceCategory
    unitId: ID
    propertyId: ID
  ): MaintenanceRequestConnection!

  maintenanceRequest(id: ID!): MaintenanceRequest

  # Vendors
  vendors(
    first: Int
    after: String
    type: String
    active: Boolean
  ): VendorConnection!

  vendor(id: ID!): Vendor

  # Owners
  owners(
    first: Int
    after: String
    active: Boolean
  ): OwnerConnection!

  owner(id: ID!): Owner

  # Documents
  documents(
    first: Int
    after: String
    type: String
    entityType: String
    entityId: ID
  ): DocumentConnection!

  document(id: ID!): Document

  # Notifications
  notifications(
    first: Int
    after: String
    unreadOnly: Boolean
  ): NotificationConnection!

  # Analytics
  propertyAnalytics(
    propertyId: ID!
    period: AnalyticsPeriod!
  ): PropertyAnalytics!

  portfolioAnalytics(
    period: AnalyticsPeriod!
  ): PortfolioAnalytics!
}

type Mutation {
  # Authentication
  login(email: String!, password: String!): AuthPayload!
  logout: Boolean!
  refreshToken(refreshToken: String!): AuthPayload!

  # Properties
  createProperty(input: CreatePropertyInput!): Property!
  updateProperty(id: ID!, input: UpdatePropertyInput!): Property!
  deleteProperty(id: ID!): Boolean!

  # Units
  createUnit(propertyId: ID!, input: CreateUnitInput!): Unit!
  updateUnit(id: ID!, input: UpdateUnitInput!): Unit!
  deleteUnit(id: ID!): Boolean!

  # Leases
  createLease(input: CreateLeaseInput!): Lease!
  updateLease(id: ID!, input: UpdateLeaseInput!): Lease!
  deleteLease(id: ID!): Boolean!
  signLease(id: ID!): Lease!

  # Payments
  createPayment(input: CreatePaymentInput!): Payment!
  refundPayment(id: ID!, amount: Float, reason: String): Payment!

  # Maintenance
  createMaintenanceRequest(input: CreateMaintenanceRequestInput!): MaintenanceRequest!
  updateMaintenanceRequest(id: ID!, input: UpdateMaintenanceRequestInput!): MaintenanceRequest!
  resolveMaintenanceRequest(id: ID!, input: ResolveMaintenanceRequestInput!): MaintenanceRequest!
  assignMaintenanceRequest(id: ID!, assignedToId: ID!, assignedVendorId: ID): MaintenanceRequest!

  # Vendors
  createVendor(input: CreateVendorInput!): Vendor!
  updateVendor(id: ID!, input: UpdateVendorInput!): Vendor!
  deleteVendor(id: ID!): Boolean!

  # Owners
  createOwner(input: CreateOwnerInput!): Owner!
  updateOwner(id: ID!, input: UpdateOwnerInput!): Owner!
  deleteOwner(id: ID!): Boolean!

  # Documents
  uploadDocument(file: Upload!, type: String!, entityType: String!, entityId: ID!, description: String): Document!
  deleteDocument(id: ID!): Boolean!

  # Notifications
  markNotificationAsRead(id: ID!): Notification!
  markAllNotificationsAsRead: Boolean!
}

type Subscription {
  # Real-time updates
  paymentUpdated(leaseId: ID!): Payment!
  maintenanceRequestUpdated(unitId: ID!): MaintenanceRequest!
  notificationAdded(userId: ID!): Notification!
  propertyUpdated(propertyId: ID!): Property!
}

# Connection types for pagination
type PropertyConnection {
  edges: [PropertyEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PropertyEdge {
  node: Property!
  cursor: String!
}

type UnitConnection {
  edges: [UnitEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UnitEdge {
  node: Unit!
  cursor: String!
}

type LeaseConnection {
  edges: [LeaseEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type LeaseEdge {
  node: Lease!
  cursor: String!
}

type PaymentConnection {
  edges: [PaymentEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PaymentEdge {
  node: Payment!
  cursor: String!
}

type MaintenanceRequestConnection {
  edges: [MaintenanceRequestEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type MaintenanceRequestEdge {
  node: MaintenanceRequest!
  cursor: String!
}

type TenantConnection {
  edges: [TenantEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type TenantEdge {
  node: Tenant!
  cursor: String!
}

type VendorConnection {
  edges: [VendorEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type VendorEdge {
  node: Vendor!
  cursor: String!
}

type OwnerConnection {
  edges: [OwnerEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type OwnerEdge {
  node: Owner!
  cursor: String!
}

type DocumentConnection {
  edges: [DocumentEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type DocumentEdge {
  node: Document!
  cursor: String!
}

type NotificationConnection {
  edges: [NotificationEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type NotificationEdge {
  node: Notification!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type AuthPayload {
  user: User!
  token: String!
  refreshToken: String!
}

# Input types
input CreatePropertyInput {
  name: String!
  type: PropertyType!
  address: AddressInput!
  yearBuilt: Int
  squareFeet: Int
  lotSize: Float
  parkingSpaces: Int
  amenities: [String!]!
  photos: [PhotoInput!]!
}

input UpdatePropertyInput {
  name: String
  type: PropertyType
  address: AddressInput
  yearBuilt: Int
  squareFeet: Int
  lotSize: Float
  parkingSpaces: Int
  amenities: [String!]
  photos: [PhotoInput!]
}

input AddressInput {
  street1: String!
  street2: String
  city: String!
  state: String!
  zipCode: String!
  country: String!
  lat: Float
  lng: Float
}

input PhotoInput {
  url: String!
  caption: String
}

input CreateUnitInput {
  number: String!
  type: UnitType!
  floor: Int
  squareFeet: Int
  bedrooms: Int
  bathrooms: Float!
  baseRent: Float!
  deposit: Float
  amenities: [String!]!
  photos: [PhotoInput!]!
}

input UpdateUnitInput {
  number: String
  type: UnitType
  floor: Int
  squareFeet: Int
  bedrooms: Int
  bathrooms: Float
  baseRent: Float
  deposit: Float
  amenities: [String!]
  photos: [PhotoInput!]
}

input CreateLeaseInput {
  unitId: ID!
  tenantId: ID!
  startDate: Date!
  endDate: Date!
  monthlyRent: Float!
  securityDeposit: Float
  petDeposit: Float
  petFee: Float
  lateFeePercentage: Float!
  lateFeeGraceDays: Int!
  autoRenew: Boolean!
  terms: String
}

input UpdateLeaseInput {
  tenantId: ID
  startDate: Date
  endDate: Date
  monthlyRent: Float
  securityDeposit: Float
  petDeposit: Float
  petFee: Float
  lateFeePercentage: Float
  lateFeeGraceDays: Int
  autoRenew: Boolean
  terms: String
}

input CreatePaymentInput {
  leaseId: ID!
  amount: Float!
  method: PaymentMethod!
  paymentMethodId: String!
}

input CreateMaintenanceRequestInput {
  unitId: ID!
  category: MaintenanceCategory!
  priority: MaintenancePriority!
  title: String!
  description: String!
  photos: [String!]!
}

input UpdateMaintenanceRequestInput {
  category: MaintenanceCategory
  priority: MaintenancePriority
  title: String
  description: String
  estimatedCost: Float
}

input ResolveMaintenanceRequestInput {
  resolutionNotes: String!
  actualCost: Float
  resolutionPhotos: [String!]!
}

input CreateVendorInput {
  name: String!
  type: String!
  contactName: String
  contactEmail: String
  contactPhone: String
  address: AddressInput
  website: String
  notes: String
}

input UpdateVendorInput {
  name: String
  type: String
  contactName: String
  contactEmail: String
  contactPhone: String
  address: AddressInput
  website: String
  notes: String
}

input CreateOwnerInput {
  userId: ID
  name: String!
  email: String
  phone: String
  address: AddressInput
  ownershipPercentage: Float!
  distributionFrequency: String!
  distributionDay: Int!
  taxId: String
}

input UpdateOwnerInput {
  name: String
  email: String
  phone: String
  address: AddressInput
  ownershipPercentage: Float
  distributionFrequency: String
  distributionDay: Int
  taxId: String
}
```

### Example Queries

#### Get Property Dashboard
```graphql
query GetPropertyDashboard($propertyId: ID!) {
  property(id: $propertyId) {
    id
    name
    type
    address {
      street1
      city
      state
      zipCode
    }
    unitsCount
    occupiedUnitsCount
    vacancyRate
    monthlyRevenue
    units(first: 10) {
      edges {
        node {
          id
          number
          type
          baseRent
          status
          currentLease {
            id
            tenant {
              firstName
              lastName
            }
            endDate
          }
        }
      }
    }
  }
  propertyAnalytics(propertyId: $propertyId, period: LAST_6_MONTHS) {
    occupancyRate
    averageRent
    totalRevenue
    totalExpenses
    netOperatingIncome
    capRate
    revenueTrend(period: LAST_6_MONTHS) {
      date
      value
    }
  }
}
```

#### Get Tenant Portal
```graphql
query GetTenantPortal {
  me {
    id
    firstName
    lastName
    email
  }
  tenant: myTenant {
    id
    firstName
    lastName
    lease {
      id
      unit {
        property {
          name
          address {
            street1
            city
            state
          }
        }
        number
        baseRent
      }
      startDate
      endDate
      monthlyRent
      daysUntilExpiry
    }
    payments(first: 12, status: COMPLETED) {
      edges {
        node {
          id
          amount
          method
          status
          dueDate
          paidAt
          receiptUrl
        }
      }
    }
    maintenanceRequests(first: 10) {
      edges {
        node {
          id
          category
          title
          status
          createdAt
        }
      }
    }
  }
}
```

#### Get Portfolio Analytics
```graphql
query GetPortfolioAnalytics($period: AnalyticsPeriod!) {
  portfolioAnalytics(period: $period) {
    totalProperties
    totalUnits
    occupiedUnits
    vacantUnits
    occupancyRate
    monthlyRevenue
    monthlyExpenses
    netOperatingIncome
    averageRent
    revenueTrend(period: $period) {
      date
      value
    }
    vacancyRate
    openMaintenanceRequests
  }
  properties(first: 20) {
    edges {
      node {
        id
        name
        type
        occupancyRate
        monthlyRevenue
      }
    }
  }
}
```

### Example Mutations

#### Create Maintenance Request
```graphql
mutation CreateMaintenanceRequest($input: CreateMaintenanceRequestInput!) {
  createMaintenanceRequest(input: $input) {
    id
    category
    priority
    title
    status
    createdAt
  }
}
```

#### Sign Lease
```graphql
mutation SignLease($leaseId: ID!) {
  signLease(id: $leaseId) {
    id
    status
    signedAt
    termsPdfUrl
  }
}
```

### Example Subscriptions

#### Subscribe to Payment Updates
```graphql
subscription PaymentUpdates($leaseId: ID!) {
  paymentUpdated(leaseId: $leaseId) {
    id
    amount
    status
    paidAt
  }
}
```

---

## Webhooks

### Webhook Events

| Event | Description | Payload |
|-------|-------------|---------|
| `tenant.created` | New tenant registered | Tenant object |
| `tenant.updated` | Tenant profile updated | Tenant object |
| `payment.completed` | Payment successfully processed | Payment object |
| `payment.failed` | Payment failed | Payment object with error |
| `payment.refunded` | Payment refunded | Payment object |
| `maintenance.requested` | New maintenance request submitted | MaintenanceRequest object |
| `maintenance.resolved` | Maintenance request resolved | MaintenanceRequest object |
| `lease.created` | New lease created | Lease object |
| `lease.activated` | Lease activated (signed) | Lease object |
| `lease.expiring` | Lease expiring soon (30 days) | Lease object |
| `property.created` | New property added | Property object |
| `property.updated` | Property details updated | Property object |
| `document.uploaded` | New document uploaded | Document object |

### Webhook Delivery

```http
POST {webhook_url}
Content-Type: application/json
X-PropertyOS-Signature: sha256={signature}
X-PropertyOS-Timestamp: {unix_timestamp}
X-PropertyOS-Event: {event_type}
X-PropertyOS-Delivery-Id: {delivery_id}

{
  "event": "payment.completed",
  "timestamp": "2026-02-04T10:30:00Z",
  "data": {
    "id": "pay_abc123",
    "lease_id": "lease_def456",
    "tenant_id": "tenant_ghi789",
    "amount": 2500.00,
    "method": "ach",
    "status": "completed",
    "due_date": "2026-02-01",
    "paid_at": "2026-02-01T14:30:00Z"
  }
}
```

### Signature Verification

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  const message = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}
```

### Retry Logic

- **Retry Attempts**: Up to 5 attempts
- **Retry Schedule**: Exponential backoff (1s, 5s, 15s, 1m, 5m)
- **Dead Letter Queue**: Failed deliveries stored for manual inspection

---

## Rate Limiting

### Rate Limits by Plan

| Plan | Requests per Minute | Requests per Hour | Requests per Day |
|------|---------------------|-------------------|------------------|
| Essential | 60 | 1,000 | 10,000 |
| Professional | 120 | 2,000 | 20,000 |
| Business | 300 | 5,000 | 50,000 |
| Enterprise | Custom | Custom | Custom |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1737660600
Retry-After: 60
```

### Rate Limit Response

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retry_after": 60
  }
}
```

---

## API Versioning

### Versioning Strategy
- **URL Versioning**: `/v1/`, `/v2/`, etc.
- **Backward Compatibility**: Maintain at least 2 major versions
- **Deprecation Notice**: 6-month deprecation period
- **Documentation**: Each version has separate documentation

### Version Selection

```http
# Default to latest stable version
GET https://api.propertyos.com/properties

# Explicit version
GET https://api.propertyos.com/v1/properties
GET https://api.propertyos.com/v2/properties
```

---

## Testing API

### Example cURL Commands

```bash
# Login
curl -X POST https://api.propertyos.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Get Properties
curl -X GET https://api.propertyos.com/v1/properties \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create Property
curl -X POST https://api.propertyos.com/v1/properties \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sunset Apartments",
    "type": "residential",
    "address": {
      "street1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94102",
      "country": "US"
    }
  }'

# GraphQL Query
curl -X POST https://api.propertyos.com/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { me { id email firstName lastName } }"
  }'
```

---

## API SDKs

### Official SDKs
- **JavaScript/TypeScript**: `@propertyos/sdk`
- **Python**: `propertyos-python`
- **Ruby**: `propertyos-ruby`
- **Go**: `github.com/propertyos/go-sdk`

### Example: JavaScript SDK

```typescript
import { PropertyOS } from '@propertyos/sdk';

const client = new PropertyOS({
  apiKey: 'your-api-key',
  baseURL: 'https://api.propertyos.com/v1'
});

// Get properties
const properties = await client.properties.list();

// Create property
const property = await client.properties.create({
  name: 'Sunset Apartments',
  type: 'residential',
  address: {
    street1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'US'
  }
});
```

---

This API contract specification provides a comprehensive foundation for the PropertyOS platform, enabling secure, efficient, and scalable integration with both internal services and external applications.