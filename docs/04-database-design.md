# Database Design: PropertyOS

## Overview

PropertyOS uses a **PostgreSQL** relational database with a **shared-database, shared-schema** multi-tenancy model enhanced by **Row-Level Security (RLS)** for strict data isolation. The design prioritizes data integrity, query performance, and scalability.

---

## Multi-Tenancy Strategy

### Tenant Isolation Model

**Shared Database, Shared Schema with Row-Level Security (RLS)**

Each table includes a `tenant_id` column that associates every row with a specific organization (tenant). RLS policies automatically filter queries to ensure users can only access data belonging to their tenant.

### Advantages
- **Cost Efficiency**: Single database instance reduces infrastructure costs
- **Simplified Maintenance**: Single schema for migrations and updates
- **Strong Isolation**: RLS provides database-level enforcement of tenant boundaries
- **Flexibility**: Can migrate to schema-per-tenant or database-per-tenant if needed

### Implementation

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation ON properties
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Application sets tenant context on each request
SET app.current_tenant_id = '123e4567-e89b-12d3-a456-426614174000';
```

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              ORGANIZATION (tenant_id)                                           │
│  ├─ id (PK) UUID                                                                              │
│  ├─ name VARCHAR(255)                                                                         │
│  ├─ plan VARCHAR(50)                                                                          │
│  └─ settings JSONB                                                                            │
│           │                                                                                   │
│           ├───────────────────────────────────────────────────────────────────────────────────┤
│           │                                                                                   │
│           ▼                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                USERS                                                     │  │
│  │  ├─ id (PK) UUID                                                                          │  │
│  │  ├─ tenant_id (FK) UUID ◀─────────────────────────────────────────────────────────────┤  │
│  │  ├─ email VARCHAR(255) UNIQUE                                                            │  │
│  │  ├─ password_hash VARCHAR(255)                                                            │  │
│  │  ├─ role ENUM                                                                            │  │
│  │  ├─ mfa_enabled BOOLEAN                                                                   │  │
│  │  └─ last_login TIMESTAMP                                                                 │  │
│  │           │                                                                               │  │
│  │           ├───────────────────────────────────────────────────────────────────────────────┤  │
│  │           │                                                                               │  │
│  │           ▼                                                                               │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                          PROPERTIES                                                 │  │  │
│  │  │  ├─ id (PK) UUID                                                                     │  │  │
│  │  │  ├─ tenant_id (FK) UUID ◀────────────────────────────────────────────────────────┤  │  │
│  │  │  ├─ name VARCHAR(255)                                                                │  │  │
│  │  │  ├─ address_id (FK) UUID                                                             │  │  │
│  │  │  ├─ type ENUM                                                                        │  │  │
│  │  │  ├─ year_built INTEGER                                                               │  │  │
│  │  │  └─ metadata JSONB                                                                   │  │  │
│  │  │           │                                                                           │  │  │
│  │  │           ├───────────────────────────────────────────────────────────────────────────┤  │  │
│  │  │           │                                                                           │  │  │
│  │  │           ▼                                                                           │  │  │
│  │  │  ┌────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  │                          UNITS                                                   │  │  │
│  │  │  │  ├─ id (PK) UUID                                                                 │  │  │
│  │  │  │  ├─ property_id (FK) UUID ◀───────────────────────────────────────────────────┤  │  │
│  │  │  │  ├─ number VARCHAR(50)                                                           │  │  │
│  │  │  │  ├─ type ENUM                                                                    │  │  │
│  │  │  │  ├─ square_feet INTEGER                                                          │  │  │
│  │  │  │  ├─ bedrooms INTEGER                                                             │  │  │
│  │  │  │  ├─ bathrooms DECIMAL(3,1)                                                       │  │  │
│  │  │  │  └─ base_rent DECIMAL(10,2)                                                      │  │  │
│  │  │  │           │                                                                       │  │  │
│  │  │  │           ├───────────────────────────────────────────────────────────────────────┤  │  │
│  │  │  │           │                                                                       │  │  │
│  │  │  │           ▼                                                                       │  │  │
│  │  │  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  │  │                          LEASES                                            │  │  │
│  │  │  │  │  ├─ id (PK) UUID                                                             │  │  │
│  │  │  │  │  ├─ unit_id (FK) UUID ◀───────────────────────────────────────────────────┤  │  │
│  │  │  │  │  ├─ tenant_id (FK) UUID                                                     │  │  │
│  │  │  │  │  ├─ start_date DATE                                                         │  │  │
│  │  │  │  │  ├─ end_date DATE                                                           │  │  │
│  │  │  │  │  ├─ monthly_rent DECIMAL(10,2)                                               │  │  │
│  │  │  │  │  ├─ security_deposit DECIMAL(10,2)                                           │  │  │
│  │  │  │  │  └─ status ENUM                                                              │  │  │
│  │  │  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │  │  │           │                                                                           │  │
│  │  │  │           ▼                                                                           │  │
│  │  │  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  │  │                          TENANTS                                           │  │  │
│  │  │  │  │  ├─ id (PK) UUID                                                             │  │  │
│  │  │  │  │  ├─ lease_id (FK) UUID ◀───────────────────────────────────────────────────┤  │  │
│  │  │  │  │  ├─ user_id (FK) UUID                                                        │  │  │
│  │  │  │  │  ├─ first_name VARCHAR(100)                                                   │  │  │
│  │  │  │  │  ├─ last_name VARCHAR(100)                                                    │  │  │
│  │  │  │  │  ├─ phone VARCHAR(20)                                                         │  │  │
│  │  │  │  │  ├─ emergency_contact_id (FK) UUID                                            │  │  │
│  │  │  │  │  └─ preferences JSONB                                                        │  │  │
│  │  │  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │  │                                                                                    │  │  │
│  │  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  │                          PAYMENTS                                          │  │  │
│  │  │  │  ├─ id (PK) UUID                                                             │  │  │
│  │  │  │  ├─ lease_id (FK) UUID                                                       │  │  │
│  │  │  │  ├─ amount DECIMAL(10,2)                                                      │  │  │
│  │  │  │  ├─ method ENUM                                                               │  │  │
│  │  │  │  ├─ status ENUM                                                               │  │  │
│  │  │  │  ├─ stripe_payment_intent_id VARCHAR(255)                                     │  │  │
│  │  │  │  ├─ due_date DATE                                                             │  │  │
│  │  │  │  └─ paid_at TIMESTAMP                                                          │  │  │
│  │  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │  │                                                                                    │  │  │
│  │  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  │                      MAINTENANCE_REQUESTS                                   │  │  │
│  │  │  │  ├─ id (PK) UUID                                                             │  │  │
│  │  │  │  ├─ unit_id (FK) UUID                                                        │  │  │
│  │  │  │  ├─ tenant_id (FK) UUID                                                      │  │  │
│  │  │  │  ├─ category ENUM                                                            │  │  │
│  │  │  │  ├─ priority ENUM                                                            │  │  │
│  │  │  │  ├─ description TEXT                                                          │  │  │
│  │  │  │  ├─ status ENUM                                                              │  │  │
│  │  │  │  ├─ assigned_to_id (FK) UUID                                                 │  │  │
│  │  │  │  └─ resolved_at TIMESTAMP                                                     │  │  │
│  │  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │  └────────────────────────────────────────────────────────────────────────────────────┘  │
│  │                                                                                           │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  │                          VENDORS                                                   │  │
│  │  │  ├─ id (PK) UUID                                                                     │  │
│  │  │  ├─ tenant_id (FK) UUID                                                              │  │
│  │  │  ├─ name VARCHAR(255)                                                                │  │
│  │  │  ├─ type ENUM                                                                        │  │
│  │  │  ├─ contact_email VARCHAR(255)                                                      │  │
│  │  │  ├─ contact_phone VARCHAR(20)                                                        │  │
│  │  │  └─ rating DECIMAL(2,1)                                                              │  │
│  │  └────────────────────────────────────────────────────────────────────────────────────┘  │
│  │                                                                                           │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  │                          OWNERS                                                    │  │
│  │  │  ├─ id (PK) UUID                                                                     │  │
│  │  │  ├─ tenant_id (FK) UUID                                                              │  │
│  │  │  ├─ name VARCHAR(255)                                                                │  │
│  │  │  ├─ email VARCHAR(255)                                                               │  │
│  │  │  ├─ bank_account_id (FK) UUID                                                        │  │
│  │  │  └─ ownership_percentage DECIMAL(5,2)                                                │  │
│  │  └────────────────────────────────────────────────────────────────────────────────────┘  │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  │                          ADDRESSES                                                      │
│  │  ├─ id (PK) UUID                                                                         │
│  │  ├─ street1 VARCHAR(255)                                                                 │
│  │  ├─ street2 VARCHAR(255)                                                                 │
│  │  ├─ city VARCHAR(100)                                                                    │
│  │  ├─ state VARCHAR(50)                                                                    │
│  │  ├─ zip_code VARCHAR(20)                                                                 │
│  │  ├─ country VARCHAR(50)                                                                  │
│  │  └─ coordinates GEOGRAPHY(POINT)                                                         │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  │                          DOCUMENTS                                                      │
│  │  ├─ id (PK) UUID                                                                         │
│  │  ├─ tenant_id (FK) UUID                                                                  │
│  │  ├─ type ENUM                                                                            │
│  │  ├─ entity_type ENUM                                                                     │
│  │  ├─ entity_id UUID                                                                       │
│  │  ├─ file_name VARCHAR(255)                                                               │
│  │  ├─ file_path VARCHAR(500)                                                               │
│  │  ├─ file_size INTEGER                                                                    │
│  │  ├─ mime_type VARCHAR(100)                                                               │
│  │  └─ expires_at TIMESTAMP                                                                 │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  │                          TRANSACTIONS                                                   │
│  │  ├─ id (PK) UUID                                                                         │
│  │  ├─ tenant_id (FK) UUID                                                                  │
│  │  ├─ ledger_account_id (FK) UUID                                                          │
│  │  ├─ type ENUM                                                                            │
│  │  ├─ amount DECIMAL(10,2)                                                                 │
│  │  ├─ description TEXT                                                                     │
│  │  ├─ reference_id UUID                                                                    │
│  │  ├─ reference_type ENUM                                                                  │
│  │  └─ created_at TIMESTAMP                                                                 │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  │                          NOTIFICATIONS                                                   │
│  │  ├─ id (PK) UUID                                                                         │
│  │  ├─ user_id (FK) UUID                                                                    │
│  │  ├─ type ENUM                                                                            │
│  │  ├─ channel ENUM                                                                         │
│  │  ├─ title VARCHAR(255)                                                                   │
│  │  ├─ body TEXT                                                                             │
│  │  ├─ status ENUM                                                                          │
│  │  ├─ sent_at TIMESTAMP                                                                    │
│  │  └─ read_at TIMESTAMP                                                                    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  │                          LEDGER_ACCOUNTS                                                │
│  │  ├─ id (PK) UUID                                                                         │
│  │  ├─ tenant_id (FK) UUID                                                                  │
│  │  ├─ code VARCHAR(20)                                                                     │
│  │  ├─ name VARCHAR(255)                                                                    │
│  │  ├─ type ENUM                                                                            │
│  │  ├─ parent_id (FK) UUID                                                                  │
│  │  └─ is_system BOOLEAN                                                                    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  │                          WEBHOOKS                                                       │
│  │  ├─ id (PK) UUID                                                                         │
│  │  ├─ tenant_id (FK) UUID                                                                  │
│  │  ├─ url VARCHAR(500)                                                                     │
│  │  ├─ events TEXT[]                                                                        │
│  │  ├─ secret VARCHAR(255)                                                                  │
│  │  ├─ active BOOLEAN                                                                       │
│  │  └─ last_triggered_at TIMESTAMP                                                          │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Schema Definitions

### Core Tables

#### 1. Organizations (Tenants)

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'essential',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_plan ON organizations(plan);
CREATE INDEX idx_organizations_status ON organizations(status);

-- Row-Level Security Policy
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON organizations
  FOR ALL
  USING (id = current_setting('app.current_tenant_id')::uuid);
```

#### 2. Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'tenant',
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  last_login TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 3. Addresses

```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  street1 VARCHAR(255) NOT NULL,
  street2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  country VARCHAR(50) DEFAULT 'US',
  coordinates GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_city ON addresses(city);
CREATE INDEX idx_addresses_state ON addresses(state);
CREATE INDEX idx_coordinates ON addresses USING GIST(coordinates);
```

#### 4. Properties

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  year_built INTEGER,
  square_feet INTEGER,
  lot_size DECIMAL(10,2),
  parking_spaces INTEGER,
  amenities JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_properties_tenant ON properties(tenant_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_address ON properties(address_id);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON properties
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 5. Units

```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  floor INTEGER,
  square_feet INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  base_rent DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2),
  amenities JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'vacant',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(property_id, number)
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_type ON units(type);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_bedrooms ON units(bedrooms);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON units
  FOR ALL
  USING (
    property_id IN (
      SELECT id FROM properties
      WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );
```

#### 6. Leases

```sql
CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2),
  pet_deposit DECIMAL(10,2),
  pet_fee DECIMAL(10,2),
  late_fee_percentage DECIMAL(5,2) DEFAULT 5.00,
  late_fee_grace_days INTEGER DEFAULT 5,
  status VARCHAR(50) DEFAULT 'active',
  terms TEXT,
  terms_pdf_url VARCHAR(500),
  signed_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT false,
  renewal_offer_sent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_dates ON leases(start_date, end_date);
CREATE INDEX idx_leases_status ON leases(status);

-- Ensure no overlapping leases for same unit
CREATE UNIQUE INDEX idx_leases_unit_active
  ON leases(unit_id)
  WHERE status = 'active';

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON leases
  FOR ALL
  USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN properties p ON u.property_id = p.id
      WHERE p.tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );
```

#### 7. Tenants

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  social_security_number VARCHAR(11),
  driver_license VARCHAR(50),
  emergency_contact_id UUID,
  employer_name VARCHAR(255),
  employer_phone VARCHAR(20),
  income DECIMAL(10,2),
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_tenants_user ON tenants(user_id);
CREATE INDEX idx_tenants_lease ON tenants(lease_id);
CREATE INDEX idx_tenants_name ON tenants(first_name, last_name);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenants
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );
```

#### 8. Payments

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES users(id) ON DELETE SET NULL,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  payment_method_id VARCHAR(255),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  late_fee_applied BOOLEAN DEFAULT false,
  late_fee_amount DECIMAL(10,2),
  partial_payment BOOLEAN DEFAULT false,
  parent_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  receipt_url VARCHAR(500),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_lease ON payments(lease_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON payments
  FOR ALL
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE p.tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );
```

#### 9. Maintenance Requests

```sql
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES users(id) ON DELETE SET NULL,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  photos JSONB DEFAULT '[]',
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  resolution_photos JSONB DEFAULT '[]',
  tenant_satisfied BOOLEAN,
  tenant_rating INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_unit ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_category ON maintenance_requests(category);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_assigned ON maintenance_requests(assigned_to_id);

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON maintenance_requests
  FOR ALL
  USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN properties p ON u.property_id = p.id
      WHERE p.tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );
```

#### 10. Vendors

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  website VARCHAR(500),
  rating DECIMAL(2,1),
  total_jobs INTEGER DEFAULT 0,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX idx_vendors_type ON vendors(type);
CREATE INDEX idx_vendors_active ON vendors(active);
CREATE INDEX idx_vendors_rating ON vendors(rating);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON vendors
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 11. Owners

```sql
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  ownership_percentage DECIMAL(5,2) NOT NULL,
  distribution_frequency VARCHAR(50) DEFAULT 'monthly',
  distribution_day INTEGER DEFAULT 1,
  tax_id VARCHAR(50),
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_owners_tenant ON owners(tenant_id);
CREATE INDEX idx_owners_user ON owners(user_id);
CREATE INDEX idx_owners_active ON owners(active);

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON owners
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 12. Owner Properties

```sql
CREATE TABLE owner_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  ownership_percentage DECIMAL(5,2) NOT NULL,
  acquisition_date DATE,
  acquisition_cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_id, property_id)
);

CREATE INDEX idx_owner_properties_owner ON owner_properties(owner_id);
CREATE INDEX idx_owner_properties_property ON owner_properties(property_id);
```

#### 13. Documents

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description TEXT,
  uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  access_level VARCHAR(50) DEFAULT 'private',
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_expires ON documents(expires_at);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON documents
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 14. Transactions (Ledger)

```sql
CREATE TABLE ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  parent_id UUID REFERENCES ledger_accounts(id) ON DELETE SET NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_ledger_accounts_tenant ON ledger_accounts(tenant_id);
CREATE INDEX idx_ledger_accounts_type ON ledger_accounts(type);
CREATE INDEX idx_ledger_accounts_parent ON ledger_accounts(parent_id);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ledger_account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  reference_id UUID,
  reference_type VARCHAR(50),
  category VARCHAR(50),
  tax_amount DECIMAL(10,2),
  tax_inclusive BOOLEAN DEFAULT false,
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP,
  reconciled_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_ledger ON transactions(ledger_account_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_reconciled ON transactions(reconciled);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON transactions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 15. Notifications

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_payments BOOLEAN DEFAULT true,
  email_maintenance BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  sms_payments BOOLEAN DEFAULT true,
  sms_maintenance BOOLEAN DEFAULT false,
  sms_emergency BOOLEAN DEFAULT true,
  push_payments BOOLEAN DEFAULT true,
  push_maintenance BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

#### 16. Bank Accounts

```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id) ON DELETE SET NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  last_four VARCHAR(4) NOT NULL,
  stripe_bank_account_id VARCHAR(255),
  routing_number VARCHAR(9),
  account_number_encrypted TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_bank_accounts_tenant ON bank_accounts(tenant_id);
CREATE INDEX idx_bank_accounts_owner ON bank_accounts(owner_id);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON bank_accounts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 17. Webhooks

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  retry_config JSONB DEFAULT '{}',
  last_triggered_at TIMESTAMP,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_active ON webhooks(active);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON webhooks
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 18. Webhook Deliveries

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at);
```

#### 19. Audit Logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Partition audit logs by month for better performance
CREATE TABLE audit_logs_y2026m01 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## Enums

### User Roles
```sql
CREATE TYPE user_role AS ENUM (
  'admin',           -- Full access to all tenant resources
  'manager',         -- Property manager with operational access
  'owner',           -- Property owner with financial access
  'tenant',          -- Tenant with self-service access
  'vendor',          -- Vendor with limited access
  'accountant'       -- Accountant with financial reporting access
);
```

### Property Types
```sql
CREATE TYPE property_type AS ENUM (
  'residential',     -- Residential property
  'commercial',      -- Commercial property
  'mixed_use',       -- Mixed-use property
  'industrial',      -- Industrial property
  'land'            -- Vacant land
);
```

### Unit Types
```sql
CREATE TYPE unit_type AS ENUM (
  'studio',          -- Studio apartment
  'one_bedroom',     -- 1 bedroom
  'two_bedroom',     -- 2 bedrooms
  'three_bedroom',   -- 3 bedrooms
  'four_plus_bedroom', -- 4+ bedrooms
  'townhouse',       -- Townhouse
  'duplex',          -- Duplex unit
  'commercial_space' -- Commercial space
);
```

### Lease Status
```sql
CREATE TYPE lease_status AS ENUM (
  'draft',           -- Draft lease
  'pending',         -- Pending signature
  'active',          -- Active lease
  'expiring_soon',   -- Expiring within 30 days
  'expired',         -- Expired lease
  'terminated',      -- Early termination
  'renewed'          -- Renewed lease
);
```

### Payment Methods
```sql
CREATE TYPE payment_method AS ENUM (
  'ach',             -- ACH bank transfer
  'credit_card',     -- Credit card
  'debit_card',      -- Debit card
  'check',           -- Physical check
  'cash',            -- Cash payment
  'bank_transfer'    -- Wire transfer
);
```

### Payment Status
```sql
CREATE TYPE payment_status AS ENUM (
  'pending',         -- Payment initiated, not processed
  'processing',      -- Payment being processed
  'completed',       -- Payment successful
  'failed',          -- Payment failed
  'refunded',        -- Payment refunded
  'partial_refund',  -- Partial refund issued
  'cancelled'        -- Payment cancelled
);
```

### Maintenance Categories
```sql
CREATE TYPE maintenance_category AS ENUM (
  'plumbing',        -- Plumbing issues
  'electrical',      -- Electrical issues
  'hvac',            -- Heating, ventilation, AC
  'appliances',      -- Appliance repairs
  'structural',      -- Structural issues
  'pest_control',    -- Pest control
  'landscaping',     -- Landscaping issues
  'security',        -- Security concerns
  'internet',        -- Internet/cable issues
  'other'           -- Other issues
);
```

### Maintenance Priority
```sql
CREATE TYPE maintenance_priority AS ENUM (
  'low',             -- Low priority
  'medium',          -- Medium priority
  'high',            -- High priority
  'emergency'        -- Emergency/urgent
);
```

### Maintenance Status
```sql
CREATE TYPE maintenance_status AS ENUM (
  'submitted',       -- Request submitted
  'triaged',         -- Request categorized
  'assigned',        -- Assigned to vendor
  'in_progress',     -- Work in progress
  'awaiting_parts',  -- Waiting for parts
  'completed',       -- Work completed
  'cancelled',       -- Request cancelled
  'reopened'        -- Request reopened
);
```

### Notification Channels
```sql
CREATE TYPE notification_channel AS ENUM (
  'email',           -- Email notification
  'sms',             -- SMS notification
  'push',            -- Push notification
  'in_app'          -- In-app notification
);
```

### Document Types
```sql
CREATE TYPE document_type AS ENUM (
  'lease',           -- Lease agreement
  'addendum',        -- Lease addendum
  'notice',          -- Official notice
  'invoice',         -- Invoice
  'receipt',         -- Receipt
  'insurance',       -- Insurance document
  'id_verification', -- ID verification
  'application',     -- Rental application
  'contract',        -- Service contract
  'report',          -- Inspection/maintenance report
  'other'           -- Other document
);
```

### Transaction Types
```sql
CREATE TYPE transaction_type AS ENUM (
  'debit',           -- Debit transaction (expense)
  'credit',          -- Credit transaction (income)
  'adjustment'       -- Adjustment transaction
);
```

### Ledger Account Types
```sql
CREATE TYPE ledger_account_type AS ENUM (
  'asset',           -- Asset account
  'liability',       -- Liability account
  'equity',          -- Equity account
  'income',          -- Income/revenue account
  'expense'         -- Expense account
);
```

---

## Indexing Strategy

### Primary Indexes
- All tables have primary key indexes on `id` (UUID)

### Foreign Key Indexes
- All foreign key columns are indexed for join performance

### Composite Indexes
- Frequently queried together: `(tenant_id, status)`, `(lease_id, due_date)`

### Specialized Indexes
- **GIST**: Geographic coordinates on addresses table
- **GIN**: JSONB fields for querying nested data
- **BRIN**: Time-series data (audit logs, transactions)

### Partial Indexes
- Index only active records to reduce size
- Example: `CREATE INDEX idx_active_properties ON properties(tenant_id) WHERE status = 'active';`

---

## Data Integrity Constraints

### Check Constraints

```sql
-- Positive amounts
ALTER TABLE payments ADD CONSTRAINT chk_payment_amount_positive
  CHECK (amount > 0);

-- Valid date ranges
ALTER TABLE leases ADD CONSTRAINT chk_lease_dates
  CHECK (end_date > start_date);

-- Valid percentage ranges
ALTER TABLE owners ADD CONSTRAINT chk_ownership_percentage
  CHECK (ownership_percentage > 0 AND ownership_percentage <= 100);

-- Valid ratings
ALTER TABLE vendors ADD CONSTRAINT chk_vendor_rating
  CHECK (rating >= 0 AND rating <= 5);

-- Valid rent values
ALTER TABLE units ADD CONSTRAINT chk_base_rent_positive
  CHECK (base_rent > 0);
```

### Triggers

```sql
-- Update timestamp on update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to other tables)

-- Soft delete trigger
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that support soft delete
CREATE TRIGGER soft_delete_properties BEFORE DELETE ON properties
  FOR EACH ROW EXECUTE FUNCTION soft_delete();
```

---

## Database Migration Strategy

### Migration Tool
- **Prisma Migrate**: Schema migrations with version control
- **Custom Scripts**: For complex data transformations

### Migration Workflow

```bash
# Create migration
npx prisma migrate dev --name add_vendor_rating_system

# Apply migration to staging
npx prisma migrate deploy --preview-feature

# Apply migration to production
npx prisma migrate deploy
```

### Rollback Strategy
- Each migration includes a `down` migration
- Database snapshots before major releases
- Feature flags to enable/disable new functionality

---

## Performance Optimization

### Query Optimization

```sql
-- Materialized view for dashboard analytics
CREATE MATERIALIZED VIEW tenant_analytics AS
SELECT
  p.tenant_id,
  COUNT(DISTINCT p.id) as total_properties,
  COUNT(DISTINCT u.id) as total_units,
  COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) as occupied_units,
  COUNT(DISTINCT CASE WHEN u.status = 'vacant' THEN u.id END) as vacant_units,
  SUM(CASE WHEN u.status = 'occupied' THEN u.base_rent ELSE 0 END) as monthly_revenue,
  COUNT(DISTINCT mr.id) as open_maintenance_requests
FROM properties p
LEFT JOIN units u ON p.id = u.property_id
LEFT JOIN leases l ON u.id = l.unit_id AND l.status = 'active'
LEFT JOIN maintenance_requests mr ON u.id = mr.unit_id AND mr.status IN ('submitted', 'assigned', 'in_progress')
GROUP BY p.tenant_id;

CREATE UNIQUE INDEX idx_tenant_analytics_tenant ON tenant_analytics(tenant_id);

-- Refresh schedule
REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_analytics;
```

### Connection Pooling
- **PgBouncer**: Connection pooler for efficient connection management
- **Max Connections**: 100 per instance
- **Pool Size**: 20-30 connections per application server

### Read Replicas
- Primary database for writes
- 2-3 read replicas for read-heavy queries
- Connection routing based on query type

---

## Backup & Recovery

### Backup Strategy
- **Daily Full Backups**: Automated at 2 AM UTC
- **Hourly Incremental**: Point-in-time recovery
- **WAL Archiving**: Continuous archiving for 7-day retention
- **Cross-Region Replication**: Replicate backups to secondary region

### Backup Retention
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

### Recovery Testing
- Monthly restore drills to validate backup integrity
- Documented RTO (Recovery Time Objective): < 1 hour
- Documented RPO (Recovery Point Objective): < 15 minutes

---

## Security Considerations

### Encryption
- **At Rest**: AES-256 encryption for all data
- **In Transit**: TLS 1.3 for all connections
- **Sensitive Fields**: Column-level encryption for SSNs, bank account numbers

### Access Control
- **Row-Level Security**: Tenant isolation at database level
- **Application-Level Checks**: Additional authorization in service layer
- **Audit Logging**: All data access logged

### Data Masking
- Development/Staging: Anonymized production data
- SSNs, bank accounts: Partially masked in logs
- API responses: Sensitive fields excluded by default

---

## Future Scalability Considerations

### Scaling Strategies

| Scale | Strategy | Implementation |
|-------|----------|----------------|
| **Small** (< 1K tenants) | Single database | Current design |
| **Medium** (1K-10K tenants) | Read replicas | Add read replicas |
| **Large** (10K-100K tenants) | Schema per tenant | Migrate to schema-per-tenant |
| **Enterprise** (100K+ tenants) | Database per tenant | Migrate to database-per-tenant |

### Migration Path

```sql
-- Example: Schema per tenant migration
CREATE SCHEMA tenant_123;

-- Clone schema structure
CREATE TABLE tenant_123.users (LIKE users INCLUDING ALL);
CREATE TABLE tenant_123.properties (LIKE properties INCLUDING ALL);
-- ... (clone all tables)

-- Copy data
INSERT INTO tenant_123.users SELECT * FROM users WHERE tenant_id = '123';
INSERT INTO tenant_123.properties SELECT * FROM properties WHERE tenant_id = '123';
-- ... (copy all data)

-- Update search path
SET search_path = tenant_123, public;
```

### Partitioning Strategy
- Partition large tables by `tenant_id` or date ranges
- Example: Partition `audit_logs` by month
- Automatic partition management with `pg_partman`

---

## Prisma Schema Example

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  plan      String   @default("essential")
  status    String   @default("active")
  settings  Json     @default("{}")
  users     User[]
  properties Property[]
  // ... other relations
}

model User {
  id            String   @id @default(uuid())
  tenantId      String
  organization  Organization @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  email         String
  passwordHash  String?
  firstName     String?
  lastName      String?
  role          UserRole @default("tenant")
  mfaEnabled    Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  @@unique([tenantId, email])
}

enum UserRole {
  admin
  manager
  owner
  tenant
  vendor
  accountant
}
```

This database design provides a solid foundation for the PropertyOS platform, supporting the multi-tenant architecture, data integrity, and scalability requirements outlined in the system architecture.