# Authentication Service Setup Guide

This guide explains how to set up and use the authentication service for the PropertyOS backend.

## Overview

The authentication service provides:
- User registration with organization creation
- JWT-based authentication (RS256)
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)
- Token refresh mechanism
- Password reset flow
- Email verification

## Prerequisites

1. Node.js and npm installed
2. PostgreSQL database running
3. Generate RSA key pair for JWT signing

## Step 1: Generate JWT Keys

Generate RSA keys for RS256 JWT signing:

```bash
# Using the provided script
node scripts/generate-jwt-keys.js

# Or manually using OpenSSL
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

## Step 2: Configure Environment Variables

Add the following to your `.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/property_os?schema=public"

# JWT Configuration
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkq..."

# Backend
BACKEND_PORT=3001
BACKEND_HOST=localhost

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

## Step 3: Initialize Database

Generate Prisma client and push schema:

```bash
cd packages/database
npm run generate
npm run push
```

## Step 4: Install Dependencies

Install all dependencies:

```bash
npm install
```

## Step 5: Start the Backend

```bash
cd apps/backend
npm run dev
```

The API will be available at `http://localhost:3001/api`

## API Documentation

Swagger documentation is available at: `http://localhost:3001/api/docs`

## Authentication Endpoints

### Register (Public)
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
```

### Login (Public)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

### Refresh Token (Public)
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout (Protected)
```http
POST /api/auth/logout
Authorization: Bearer {access_token}
```

### Forgot Password (Public)
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@acme.com"
}
```

### Reset Password (Public)
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "password": "NewSecurePass123!"
}
```

### Verify Email (Public)
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_here"
}
```

### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer {access_token}
```

## JWT Token Structure

```typescript
{
  "sub": "user_id",           // User ID
  "tenant_id": "tenant_id",   // Organization ID
  "role": "ADMIN",            // User role
  "email": "user@email.com",  // User email
  "iat": 1234567890,          // Issued at
  "exp": 1234568790,          // Expiration (15 minutes)
  "jti": "token_id"           // JWT ID for revocation
}
```

## Roles

The following roles are supported:

- `ADMIN` - Full access to all resources
- `MANAGER` - Operational access to properties, units, leases, etc.
- `MEMBER` - Basic read access
- `TENANT` - Self-service access for tenants

## Using Guards

### JWT Authentication Guard

Protect routes with JWT authentication:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('properties')
export class PropertiesController {
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    // req.user contains the decoded JWT payload
    return this.propertiesService.findAll();
  }
}
```

### Role-Based Access Control

Protect routes based on user roles:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles, UserRole } from './auth/roles.decorator';

@Controller('properties')
export class PropertiesController {
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Request() req) {
    return this.propertiesService.create();
  }
}
```

### Public Routes

Mark routes as public (no authentication required):

```typescript
import { Public } from './auth/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login() {
    return this.authService.login();
  }
}
```

## Password Requirements

Passwords must:
- Be at least 8 characters long
- Contain at least one uppercase letter
- Contain at least one lowercase letter
- Contain at least one number
- Contain at least one special character (@$!%*?&)

## Token Expiration

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

## Security Features

1. **RS256 Algorithm**: Uses asymmetric cryptography (public/private key)
2. **Password Hashing**: Bcrypt with 10 rounds
3. **Token Revocation**: JWT ID (jti) for token revocation support
4. **Role-Based Access Control**: Fine-grained permissions
5. **Tenant Isolation**: Multi-tenant architecture with tenant_id in JWT

## Troubleshooting

### "JWT keys are not configured" Error

Ensure you have added the JWT_PRIVATE_KEY and JWT_PUBLIC_KEY to your `.env` file.

### "Database connection failed" Error

Check that:
1. PostgreSQL is running
2. DATABASE_URL is correct
3. Database exists

### "Invalid token" Error

Check that:
1. Token is not expired
2. Token is signed with the correct private key
3. Public key matches the private key used for signing

## Next Steps

1. Implement email service for password reset and email verification
2. Add Redis for token revocation/blacklisting
3. Implement multi-factor authentication (MFA)
4. Add audit logging for authentication events
5. Implement rate limiting for authentication endpoints