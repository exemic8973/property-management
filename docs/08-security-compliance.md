# Security, Privacy & Compliance: PropertyOS

## Overview

PropertyOS implements enterprise-grade security, privacy, and compliance measures across all layers of the platform. This document outlines the comprehensive security framework protecting user data, ensuring regulatory compliance, and maintaining system integrity.

---

## Security Architecture

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL LAYER (Perimeter Security)                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    WAF      │  │    DDoS     │  │   CDN /     │  │   Rate      │  │   Geo       │        │
│  │  (CloudFlare)│  │ Protection  │  │  SSL/TLS    │  │  Limiting   │  │  Blocking   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            NETWORK LAYER (Infrastructure Security)                             │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   VPC /     │  │  Security   │  │   Network   │  │   Private   │  │   Endpoint  │        │
│  │  Subnets    │  │   Groups    │  │   ACLs      │  │   Links     │  │   Policies  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION LAYER (Service Security)                                │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  API Gateway│  │  Auth &     │  │  Input      │  │  Output     │  │   Service   │        │
│  │  (Kong)     │  │  AuthZ      │  │ Validation  │  │ Encoding    │  │ Mesh        │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER (Data Security)                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Encryption  │  │   Row-Level │  │   Field     │  │   Backup    │  │   Audit     │        │
│ │  (AES-256)   │  │  Security   │  │  Encryption │  │   & Restore │  │   Logging   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### Authentication Methods

#### 1. JWT-Based Authentication

```typescript
// services/auth/jwt-service.ts
import jwt from 'jsonwebtoken';
import { JWK } from 'jose';

interface JWTPayload {
  sub: string;           // User ID
  tenant_id: string;     // Tenant ID
  role: UserRole;        // User role
  email: string;         // User email
  iat: number;           // Issued at
  exp: number;           // Expiration
  jti: string;           // JWT ID (for revocation)
}

class JWTService {
  private privateKey: string;
  private publicKey: string;
  private algorithm = 'RS256';

  constructor() {
    this.privateKey = process.env.JWT_PRIVATE_KEY!;
    this.publicKey = process.env.JWT_PUBLIC_KEY!;
  }

  generateToken(user: User): string {
    const payload: JWTPayload = {
      sub: user.id,
      tenant_id: user.tenantId,
      role: user.role,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
      jti: crypto.randomUUID(),
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: this.algorithm,
      issuer: 'propertyos.com',
      audience: 'propertyos-api',
    });
  }

  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: [this.algorithm],
        issuer: 'propertyos.com',
        audience: 'propertyos-api',
      }) as JWTPayload;

      // Check if token is revoked
      if (this.isTokenRevoked(decoded.jti)) {
        throw new Error('Token revoked');
      }

      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  async revokeToken(jti: string): Promise<void> {
    const key = `revoked_token:${jti}`;
    const token = await this.verifyTokenFromStore(jti);
    const ttl = token.exp - Math.floor(Date.now() / 1000);
    await redis.setex(key, ttl, '1');
  }

  private async isTokenRevoked(jti: string): Promise<boolean> {
    const key = `revoked_token:${jti}`;
    return (await redis.exists(key)) === 1;
  }
}
```

#### 2. Passkey Authentication (WebAuthn)

```typescript
// services/auth/passkey-service.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

class PasskeyService {
  async registerPasskeyStart(userId: string): Promise<RegistrationOptions> {
    const user = await getUser(userId);

    return await generateRegistrationOptions({
      rpName: 'PropertyOS',
      rpID: process.env.RP_ID!,
      userID: user.id,
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
    });
  }

  async registerPasskeyFinish(
    userId: string,
    response: RegistrationResponseJSON
  ): Promise<void> {
    const user = await getUser(userId);
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: await this.getChallenge(userId),
      expectedOrigin: process.env.ORIGIN!,
      expectedRPID: process.env.RP_ID!,
    });

    if (!verification.verified) {
      throw new Error('Passkey verification failed');
    }

    await savePasskey({
      userId,
      credentialID: verification.registrationInfo!.credentialID,
      credentialPublicKey: verification.registrationInfo!.credentialPublicKey,
      counter: verification.registrationInfo!.counter,
      transports: verification.registrationInfo!.transports,
    });
  }

  async authenticatePasskeyStart(userId?: string): Promise<AuthenticationOptions> {
    return await generateAuthenticationOptions({
      rpID: process.env.RP_ID!,
      userVerification: 'preferred',
      timeout: 60000,
      allowCredentials: userId ? await this.getUserCredentials(userId) : undefined,
    });
  }

  async authenticatePasskeyFinish(
    response: AuthenticationResponseJSON
  ): Promise<User> {
    const credential = await this.getCredential(response.id);
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: await this.getChallenge(response.id),
      expectedOrigin: process.env.ORIGIN!,
      expectedRPID: process.env.RP_ID!,
      authenticator: {
        credentialID: credential.credentialID,
        credentialPublicKey: credential.credentialPublicKey,
        counter: credential.counter,
        transports: credential.transports,
      },
    });

    if (!verification.verified) {
      throw new Error('Passkey authentication failed');
    }

    await updateCredentialCounter(credential.id, verification.authenticationInfo.newCounter);

    return await getUser(credential.userId);
  }
}
```

#### 3. Multi-Factor Authentication (MFA)

```typescript
// services/auth/mfa-service.ts
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

class MFAService {
  async enableMFA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await getUser(userId);
    const secret = authenticator.generateSecret();

    const otpauthUrl = authenticator.keyuri(
      user.email,
      'PropertyOS',
      secret
    );

    const qrCode = await qrcode.toDataURL(otpauthUrl);

    // Store secret temporarily (not yet verified)
    await redis.setex(`mfa_setup:${userId}`, 300, secret);

    return { secret, qrCode };
  }

  async verifyAndEnableMFA(userId: string, token: string): Promise<void> {
    const secret = await redis.get(`mfa_setup:${userId}`);
    if (!secret) {
      throw new Error('MFA setup expired');
    }

    const isValid = authenticator.verify({
      token,
      secret,
    });

    if (!isValid) {
      throw new Error('Invalid token');
    }

    // Enable MFA for user
    await updateUser(userId, {
      mfaEnabled: true,
      mfaSecret: secret,
    });

    // Clean up temporary secret
    await redis.del(`mfa_setup:${userId}`);
  }

  async verifyMFA(userId: string, token: string): Promise<boolean> {
    const user = await getUser(userId);

    if (!user.mfaEnabled || !user.mfaSecret) {
      return true; // MFA not enabled
    }

    return authenticator.verify({
      token,
      secret: user.mfaSecret,
    });
  }

  async disableMFA(userId: string, password: string): Promise<void> {
    const user = await getUser(userId);

    // Verify password before disabling MFA
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    await updateUser(userId, {
      mfaEnabled: false,
      mfaSecret: null,
    });
  }
}
```

### Authorization (RBAC)

```typescript
// services/auth/authorization.ts
import { Permission, Role, UserRole } from './types';

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Properties
    Permission.CREATE_PROPERTY,
    Permission.READ_PROPERTY,
    Permission.UPDATE_PROPERTY,
    Permission.DELETE_PROPERTY,
    // Units
    Permission.CREATE_UNIT,
    Permission.READ_UNIT,
    Permission.UPDATE_UNIT,
    Permission.DELETE_UNIT,
    // Leases
    Permission.CREATE_LEASE,
    Permission.READ_LEASE,
    Permission.UPDATE_LEASE,
    Permission.DELETE_LEASE,
    // Payments
    Permission.CREATE_PAYMENT,
    Permission.READ_PAYMENT,
    Permission.REFUND_PAYMENT,
    // Maintenance
    Permission.CREATE_MAINTENANCE_REQUEST,
    Permission.READ_MAINTENANCE_REQUEST,
    Permission.UPDATE_MAINTENANCE_REQUEST,
    Permission.ASSIGN_MAINTENANCE_REQUEST,
    Permission.RESOLVE_MAINTENANCE_REQUEST,
    // Documents
    Permission.UPLOAD_DOCUMENT,
    Permission.READ_DOCUMENT,
    Permission.DELETE_DOCUMENT,
    // Analytics
    Permission.READ_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    // Users
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
  ],
  manager: [
    Permission.READ_PROPERTY,
    Permission.UPDATE_PROPERTY,
    Permission.CREATE_UNIT,
    Permission.READ_UNIT,
    Permission.UPDATE_UNIT,
    Permission.CREATE_LEASE,
    Permission.READ_LEASE,
    Permission.UPDATE_LEASE,
    Permission.CREATE_PAYMENT,
    Permission.READ_PAYMENT,
    Permission.REFUND_PAYMENT,
    Permission.CREATE_MAINTENANCE_REQUEST,
    Permission.READ_MAINTENANCE_REQUEST,
    Permission.UPDATE_MAINTENANCE_REQUEST,
    Permission.ASSIGN_MAINTENANCE_REQUEST,
    Permission.RESOLVE_MAINTENANCE_REQUEST,
    Permission.UPLOAD_DOCUMENT,
    Permission.READ_DOCUMENT,
    Permission.DELETE_DOCUMENT,
    Permission.READ_ANALYTICS,
  ],
  owner: [
    Permission.READ_PROPERTY,
    Permission.READ_UNIT,
    Permission.READ_LEASE,
    Permission.READ_PAYMENT,
    Permission.READ_MAINTENANCE_REQUEST,
    Permission.READ_DOCUMENT,
    Permission.READ_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
  ],
  tenant: [
    Permission.READ_PROPERTY,
    Permission.READ_UNIT,
    Permission.READ_LEASE,
    Permission.CREATE_PAYMENT,
    Permission.READ_PAYMENT,
    Permission.CREATE_MAINTENANCE_REQUEST,
    Permission.READ_MAINTENANCE_REQUEST,
    Permission.UPLOAD_DOCUMENT,
    Permission.READ_DOCUMENT,
  ],
  vendor: [
    Permission.READ_MAINTENANCE_REQUEST,
    Permission.UPDATE_MAINTENANCE_REQUEST,
    Permission.RESOLVE_MAINTENANCE_REQUEST,
  ],
  accountant: [
    Permission.READ_PROPERTY,
    Permission.READ_UNIT,
    Permission.READ_LEASE,
    Permission.READ_PAYMENT,
    Permission.READ_MAINTENANCE_REQUEST,
    Permission.READ_DOCUMENT,
    Permission.READ_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
  ],
};

class AuthorizationService {
  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const permissions = rolePermissions[userRole] || [];
    return permissions.includes(permission);
  }

  hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    const userPermissions = rolePermissions[userRole] || [];
    return permissions.some(p => userPermissions.includes(p));
  }

  hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    const userPermissions = rolePermissions[userRole] || [];
    return permissions.every(p => userPermissions.includes(p));
  }

  // Tenant-level authorization
  canAccessTenant(user: User, tenantId: string): boolean {
    return user.tenantId === tenantId;
  }

  // Resource-level authorization
  canAccessResource(user: User, resourceTenantId: string): boolean {
    return user.tenantId === resourceTenantId;
  }
}

export enum Permission {
  // Properties
  CREATE_PROPERTY = 'create:property',
  READ_PROPERTY = 'read:property',
  UPDATE_PROPERTY = 'update:property',
  DELETE_PROPERTY = 'delete:property',

  // Units
  CREATE_UNIT = 'create:unit',
  READ_UNIT = 'read:unit',
  UPDATE_UNIT = 'update:unit',
  DELETE_UNIT = 'delete:unit',

  // Leases
  CREATE_LEASE = 'create:lease',
  READ_LEASE = 'read:lease',
  UPDATE_LEASE = 'update:lease',
  DELETE_LEASE = 'delete:lease',

  // Payments
  CREATE_PAYMENT = 'create:payment',
  READ_PAYMENT = 'read:payment',
  REFUND_PAYMENT = 'refund:payment',

  // Maintenance
  CREATE_MAINTENANCE_REQUEST = 'create:maintenance_request',
  READ_MAINTENANCE_REQUEST = 'read:maintenance_request',
  UPDATE_MAINTENANCE_REQUEST = 'update:maintenance_request',
  ASSIGN_MAINTENANCE_REQUEST = 'assign:maintenance_request',
  RESOLVE_MAINTENANCE_REQUEST = 'resolve:maintenance_request',

  // Documents
  UPLOAD_DOCUMENT = 'upload:document',
  READ_DOCUMENT = 'read:document',
  DELETE_DOCUMENT = 'delete:document',

  // Analytics
  READ_ANALYTICS = 'read:analytics',
  EXPORT_ANALYTICS = 'export:analytics',

  // Users
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
}
```

### Middleware Implementation

```typescript
// middleware/auth-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/auth/jwt-service';
import { AuthorizationService, Permission } from '../services/auth/authorization';

const jwtService = new JWTService();
const authService = new AuthorizationService();

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyToken(token);

    // Attach user info to request
    req.user = {
      id: payload.sub,
      tenantId: payload.tenant_id,
      role: payload.role,
      email: payload.email,
    };

    // Set tenant context for database queries
    req.tenantId = payload.tenant_id;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(permission: Permission | Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasPermission = authService.hasAnyPermission(req.user.role, permissions);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

export function requireMFA(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user has MFA enabled
  getUser(req.user.id).then(user => {
    if (user.mfaEnabled && !req.session.mfaVerified) {
      return res.status(403).json({ error: 'MFA required' });
    }
    next();
  });
}

// Usage example
app.get('/api/properties', authenticate, authorize(Permission.READ_PROPERTY), getProperties);
app.post('/api/properties', authenticate, authorize(Permission.CREATE_PROPERTY), createProperty);
app.delete('/api/properties/:id', authenticate, authorize(Permission.DELETE_PROPERTY), deleteProperty);
```

---

## Data Protection

### Encryption

#### At Rest Encryption

```typescript
// services/encryption/encryption-service.ts
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16;  // 128 bits
  private authTagLength = 16;

  private getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY!;
    return crypto.scryptSync(key, 'salt', this.keyLength);
  }

  encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
    const key = this.getKey();
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(encrypted: string, iv: string, authTag: string): string {
    const key = this.getKey();
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Encrypt sensitive fields before database storage
  encryptSensitiveField(value: string): string {
    const { encrypted, iv, authTag } = this.encrypt(value);
    return `${encrypted}.${iv}.${authTag}`;
  }

  decryptSensitiveField(encryptedValue: string): string {
    const [encrypted, iv, authTag] = encryptedValue.split('.');
    return this.decrypt(encrypted, iv, authTag);
  }
}

// Prisma middleware for automatic encryption/decryption
export const encryptionMiddleware = {
  async beforeCreate(params: any) {
    const encryptionService = new EncryptionService();

    if (params.model === 'User' && params.args.data.socialSecurityNumber) {
      params.args.data.socialSecurityNumber = encryptionService.encryptSensitiveField(
        params.args.data.socialSecurityNumber
      );
    }

    return params;
  },

  async afterFind(result: any) {
    const encryptionService = new EncryptionService();

    if (result && result.socialSecurityNumber) {
      result.socialSecurityNumber = encryptionService.decryptSensitiveField(
        result.socialSecurityNumber
      );
    }

    return result;
  },
};
```

#### In Transit Encryption

```typescript
// ssl-config.ts
export const sslConfig = {
  // TLS 1.3 only
  minVersion: 'TLSv1.3',
  maxVersion: 'TLSv1.3',

  // Strong ciphers
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
  ],

  // HSTS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // OCSP Stapling
  ocspStapling: true,
};

// Express SSL configuration
import helmet from 'helmet';
import hsts from 'hsts';

app.use(helmet({
  hsts: sslConfig.hsts,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
```

### Data Masking

```typescript
// services/data/data-masking.ts
class DataMaskingService {
  maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2
      ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
      : '*'.repeat(username.length);
    return `${maskedUsername}@${domain}`;
  }

  maskPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const lastFour = digits.slice(-4);
    return `***-***-${lastFour}`;
  }

  maskSSN(ssn: string): string {
    const digits = ssn.replace(/\D/g, '');
    if (digits.length === 9) {
      return `***-**-${digits.slice(-4)}`;
    }
    return '***-**-****';
  }

  maskCreditCard(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '');
    const lastFour = digits.slice(-4);
    return `****-****-****-${lastFour}`;
  }

  maskBankAccount(accountNumber: string): string {
    const digits = accountNumber.replace(/\D/g, '');
    const lastFour = digits.slice(-4);
    return `****${lastFour}`;
  }

  // Mask sensitive data in logs
  maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const masked = { ...data };

    // Mask known sensitive fields
    const sensitiveFields = [
      'password',
      'socialSecurityNumber',
      'ssn',
      'creditCardNumber',
      'cardNumber',
      'bankAccountNumber',
      'accountNumber',
      'routingNumber',
    ];

    sensitiveFields.forEach(field => {
      if (masked[field]) {
        switch (field) {
          case 'email':
            masked[field] = this.maskEmail(masked[field]);
            break;
          case 'phone':
            masked[field] = this.maskPhoneNumber(masked[field]);
            break;
          case 'socialSecurityNumber':
          case 'ssn':
            masked[field] = this.maskSSN(masked[field]);
            break;
          case 'creditCardNumber':
          case 'cardNumber':
            masked[field] = this.maskCreditCard(masked[field]);
            break;
          case 'bankAccountNumber':
          case 'accountNumber':
            masked[field] = this.maskBankAccount(masked[field]);
            break;
          default:
            masked[field] = '***';
        }
      }
    });

    return masked;
  }
}
```

---

## PCI DSS Compliance

### Payment Card Industry Data Security Standard

#### Scope Reduction

```typescript
// services/payments/pci-compliance.ts
class PCIComplianceService {
  // Store only last 4 digits and token from Stripe
  async savePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Store only non-sensitive data
    await createPaymentMethod({
      userId,
      stripePaymentMethodId: paymentMethodId,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      expMonth: paymentMethod.card.exp_month,
      expYear: paymentMethod.card.exp_year,
      fingerprint: paymentMethod.card.fingerprint,
    });
  }

  // Never store full card numbers, CVV, or track data
  // All card data processed through Stripe
  // Stripe is PCI DSS Level 1 compliant
}
```

#### Secure Payment Flow

```typescript
// services/payments/payment-service.ts
class PaymentService {
  async processPayment(
    leaseId: string,
    amount: number,
    paymentMethodId: string
  ): Promise<Payment> {
    // 1. Validate input
    const lease = await getLease(leaseId);
    if (!lease) {
      throw new NotFoundError('Lease not found');
    }

    // 2. Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      customer: await this.getStripeCustomerId(lease.tenantId),
      confirm: true,
      setup_future_usage: 'off_session',
      metadata: {
        leaseId,
        tenantId: lease.tenantId,
        propertyId: lease.unit.propertyId,
      },
    });

    // 3. Create payment record in database
    const payment = await createPayment({
      leaseId,
      amount,
      method: paymentMethodId.startsWith('pm_') ? 'card' : 'ach',
      status: this.mapStripeStatus(paymentIntent.status),
      stripePaymentIntentId: paymentIntent.id,
      dueDate: new Date(),
    });

    // 4. Handle webhook for final status update
    return payment;
  }

  // Webhook handler for Stripe events
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.requires_action':
        await this.handlePaymentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await updatePaymentByStripeId(paymentIntent.id, {
      status: 'completed',
      paidAt: new Date(),
    });

    // Trigger post-payment workflows
    await this.sendPaymentConfirmation(paymentIntent);
    await this.scheduleOwnerDistribution(paymentIntent);
  }
}
```

---

## Audit Logging

### Comprehensive Audit Trail

```typescript
// services/audit/audit-service.ts
class AuditService {
  async logAction(params: {
    userId: string;
    tenantId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        tenantId: params.tenantId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: params.changes ? JSON.stringify(params.changes) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        createdAt: new Date(),
      },
    });
  }

  async getAuditLogs(params: {
    tenantId: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<AuditLog[]> {
    const where: any = { tenantId: params.tenantId };

    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = params.action;
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = params.fromDate;
      if (params.toDate) where.createdAt.lte = params.toDate;
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: ((params.page || 1) - 1) * (params.limit || 20),
      take: params.limit || 20,
    });
  }
}

// Prisma middleware for automatic audit logging
export const auditMiddleware = {
  async beforeUpdate(params: any) {
    if (params.model === 'User' || params.model === 'Property') {
      // Store previous state for change tracking
      const previous = await prisma[params.model].findFirst({
        where: params.args.where,
      });
      params.args._auditPrevious = previous;
    }
    return params;
  },

  async afterUpdate(params: any) {
    if (params.model === 'User' || params.model === 'Property') {
      const auditService = new AuditService();
      const previous = params.args._auditPrevious;
      const current = await prisma[params.model].findFirst({
        where: params.args.where,
      });

      const changes = {};
      for (const key in params.args.data) {
        if (previous[key] !== current[key]) {
          changes[key] = {
            from: previous[key],
            to: current[key],
          };
        }
      }

      if (Object.keys(changes).length > 0) {
        await auditService.logAction({
          userId: params.args._userId,
          tenantId: previous.tenantId,
          action: 'update',
          entityType: params.model.toLowerCase(),
          entityId: params.args.where.id,
          changes,
        });
      }
    }
    return params;
  },

  async afterDelete(params: any) {
    const auditService = new AuditService();
    await auditService.logAction({
      userId: params.args._userId,
      tenantId: params.args._tenantId,
      action: 'delete',
      entityType: params.model.toLowerCase(),
      entityId: params.args.where.id,
    });
    return params;
  },
};
```

---

## Privacy & GDPR Compliance

### GDPR Implementation

```typescript
// services/privacy/gdpr-service.ts
class GDPRService {
  // Right to Access (Data Subject Access Request)
  async getUserDataExport(userId: string): Promise<UserDataExport> {
    const user = await getUser(userId);

    return {
      personalInformation: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
      accountData: {
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        preferences: user.preferences,
      },
      propertyData: await this.getUserProperties(userId),
      leaseData: await this.getUserLeases(userId),
      paymentData: await this.getUserPayments(userId),
      maintenanceRequests: await this.getUserMaintenanceRequests(userId),
      documents: await this.getUserDocuments(userId),
      auditLogs: await this.getUserAuditLogs(userId),
      createdAt: new Date(),
    };
  }

  // Right to Rectification
  async updateUserData(userId: string, updates: UserDataUpdates): Promise<void> {
    await updateUser(userId, updates);

    // Log the update for audit trail
    await this.auditService.logAction({
      userId,
      tenantId: (await getUser(userId)).tenantId,
      action: 'gdpr_rectification',
      entityType: 'user',
      entityId: userId,
      changes: updates,
    });
  }

  // Right to Erasure (Right to be Forgotten)
  async deleteUserAccount(userId: string, adminUserId: string): Promise<void> {
    const user = await getUser(userId);

    // 1. Verify admin authorization
    const admin = await getUser(adminUserId);
    if (admin.role !== 'admin' && admin.tenantId !== user.tenantId) {
      throw new ForbiddenError('Unauthorized');
    }

    // 2. Anonymize user data instead of hard delete
    await updateUser(userId, {
      email: `deleted_${userId}@deleted.local`,
      firstName: 'Deleted',
      lastName: 'User',
      phone: null,
      socialSecurityNumber: null,
      driverLicense: null,
      preferences: {},
      deletedAt: new Date(),
    });

    // 3. Anonymize tenant data
    await updateTenantByUserId(userId, {
      firstName: 'Deleted',
      lastName: 'User',
      dateOfBirth: null,
      driverLicense: null,
    });

    // 4. Log the deletion
    await this.auditService.logAction({
      userId: adminUserId,
      tenantId: user.tenantId,
      action: 'gdpr_erasure',
      entityType: 'user',
      entityId: userId,
      changes: { deletedAt: new Date() },
    });

    // 5. Notify user via email
    await this.sendDeletionNotification(user.email);
  }

  // Right to Portability
  async exportUserData(userId: string, format: 'json' | 'csv'): Promise<Buffer> {
    const data = await this.getUserDataExport(userId);

    if (format === 'json') {
      return Buffer.from(JSON.stringify(data, null, 2));
    } else {
      // Convert to CSV
      return this.convertToCSV(data);
    }
  }

  // Right to Restrict Processing
  async restrictProcessing(userId: string): Promise<void> {
    await updateUser(userId, {
      preferences: {
        ... (await getUser(userId)).preferences,
        processingRestricted: true,
      },
    });
  }

  // Right to Object
  async objectionToProcessing(userId: string, reason: string): Promise<void> {
    await this.auditService.logAction({
      userId,
      tenantId: (await getUser(userId)).tenantId,
      action: 'gdpr_objection',
      entityType: 'user',
      entityId: userId,
      changes: { objectionReason: reason },
    });

    // Notify compliance team
    await this.notifyComplianceTeam(userId, reason);
  }
}
```

### Cookie Consent

```typescript
// services/privacy/cookie-consent.ts
class CookieConsentService {
  async recordConsent(userId: string, preferences: CookiePreferences): Promise<void> {
    await saveCookieConsent({
      userId,
      necessary: true, // Always true
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      functional: preferences.functional,
      consentedAt: new Date(),
    });

    // Set cookies based on preferences
    if (!preferences.analytics) {
      // Disable analytics cookies
      this.disableAnalyticsCookies();
    }

    if (!preferences.marketing) {
      // Disable marketing cookies
      this.disableMarketingCookies();
    }
  }

  async withdrawConsent(userId: string): Promise<void> {
    await saveCookieConsent({
      userId,
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      consentedAt: null,
      withdrawnAt: new Date(),
    });

    // Delete all non-essential cookies
    this.deleteNonEssentialCookies();
  }
}
```

---

## Security Monitoring & Incident Response

### Security Event Monitoring

```typescript
// services/security/security-monitoring.ts
class SecurityMonitoringService {
  async detectAnomalousActivity(params: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    action: string;
  }): Promise<SecurityAlert | null> {
    const alerts: SecurityAlert[] = [];

    // 1. Check for impossible travel (login from different location within short time)
    const lastLogin = await this.getLastLogin(params.userId);
    if (lastLogin && this.isImpossibleTravel(lastLogin, params.ipAddress)) {
      alerts.push({
        type: 'impossible_travel',
        severity: 'high',
        details: {
          previousLocation: lastLogin.ipAddress,
          currentLocation: params.ipAddress,
          timeDifference: Date.now() - lastLogin.createdAt.getTime(),
        },
      });
    }

    // 2. Check for brute force attempts
    const failedAttempts = await this.getFailedAttempts(params.userId, params.ipAddress);
    if (failedAttempts >= 5) {
      alerts.push({
        type: 'brute_force',
        severity: 'high',
        details: { attempts: failedAttempts },
      });
    }

    // 3. Check for unusual access patterns
    const accessPattern = await this.analyzeAccessPattern(params.userId);
    if (accessPattern.isUnusual) {
      alerts.push({
        type: 'unusual_access_pattern',
        severity: 'medium',
        details: accessPattern,
      });
    }

    // 4. Create alerts and notify security team
    if (alerts.length > 0) {
      for (const alert of alerts) {
        await this.createSecurityAlert(params.userId, alert);
        await this.notifySecurityTeam(alert);
      }
      return alerts[0];
    }

    return null;
  }

  private isImpossibleTravel(lastLogin: Login, currentIP: string): boolean {
    const distance = this.calculateDistance(lastLogin.ipAddress, currentIP);
    const timeDiff = Date.now() - lastLogin.createdAt.getTime();
    const maxSpeed = 1000; // km/h (airplane speed)

    const timeInHours = timeDiff / (1000 * 60 * 60);
    const possibleDistance = maxSpeed * timeInHours;

    return distance > possibleDistance;
  }
}
```

### Incident Response Plan

```typescript
// services/security/incident-response.ts
class IncidentResponseService {
  async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // 1. Log the incident
    await this.logIncident(incident);

    // 2. Assess severity
    const severity = this.assessSeverity(incident);

    // 3. Take immediate actions based on severity
    switch (severity) {
      case 'critical':
        await this.handleCriticalIncident(incident);
        break;
      case 'high':
        await this.handleHighSeverityIncident(incident);
        break;
      case 'medium':
        await this.handleMediumSeverityIncident(incident);
        break;
      case 'low':
        await this.handleLowSeverityIncident(incident);
        break;
    }

    // 4. Notify stakeholders
    await this.notifyStakeholders(incident, severity);

    // 5. Initiate investigation
    await this.initiateInvestigation(incident);
  }

  private async handleCriticalIncident(incident: SecurityIncident): Promise<void> {
    // 1. Isolate affected systems
    await this.isolateSystems(incident.affectedSystems);

    // 2. Lock affected accounts
    await this.lockAffectedAccounts(incident.affectedUsers);

    // 3. Disable vulnerable features
    await this.disableFeatures(incident.vulnerableFeatures);

    // 4. Activate emergency response team
    await this.activateEmergencyResponseTeam();
  }
}
```

---

## Compliance Certifications

### SOC 2 Type II

```typescript
// services/compliance/soc2-service.ts
class SOC2Service {
  // Security Principle
  async implementSecurityControls(): Promise<void> {
    // Access controls
    await this.implementAccessControls();

    // Encryption
    await this.implementEncryptionControls();

    // Network security
    await this.implementNetworkSecurity();

    // Incident response
    await this.implementIncidentResponse();
  }

  // Availability Principle
  async ensureAvailability(): Promise<void> {
    // High availability architecture
    await this.implementHighAvailability();

    // Disaster recovery
    await this.implementDisasterRecovery();

    // Monitoring and alerting
    await this.implementMonitoring();
  }

  // Processing Integrity Principle
  async ensureProcessingIntegrity(): Promise<void> {
    // Data validation
    await this.implementDataValidation();

    // Audit logging
    await this.implementAuditLogging();

    // Change management
    await this.implementChangeManagement();
  }

  // Confidentiality Principle
  async ensureConfidentiality(): Promise<void> {
    // Data classification
    await this.implementDataClassification();

    // Access restrictions
    await this.implementAccessRestrictions();

    // Encryption at rest and in transit
    await this.implementEncryption();
  }

  // Privacy Principle
  async ensurePrivacy(): Promise<void> {
    // GDPR compliance
    await this.implementGDPRCompliance();

    // Data retention policies
    await this.implementDataRetention();

    // User consent management
    await this.implementConsentManagement();
  }
}
```

---

## Security Best Practices

### 1. Regular Security Audits

```typescript
// services/security/security-audit.ts
class SecurityAuditService {
  async performSecurityAudit(): Promise<SecurityAuditReport> {
    const report: SecurityAuditReport = {
      timestamp: new Date(),
      findings: [],
    };

    // 1. Check for vulnerabilities
    const vulnerabilities = await this.scanForVulnerabilities();
    report.findings.push(...vulnerabilities);

    // 2. Review access controls
    const accessIssues = await this.reviewAccessControls();
    report.findings.push(...accessIssues);

    // 3. Validate encryption settings
    const encryptionIssues = await this.validateEncryption();
    report.findings.push(...encryptionIssues);

    // 4. Check for exposed secrets
    const exposedSecrets = await this.checkForExposedSecrets();
    report.findings.push(...exposedSecrets);

    // 5. Review audit logs for suspicious activity
    const suspiciousActivity = await this.reviewAuditLogs();
    report.findings.push(...suspiciousActivity);

    return report;
  }
}
```

### 2. Dependency Scanning

```bash
# Automated dependency scanning in CI/CD
npm audit --audit-level=moderate
snyk test
trivy fs .
```

### 3. Penetration Testing

```typescript
// Schedule regular penetration tests
// - External penetration testing: Quarterly
// - Internal penetration testing: Semi-annually
// - Application security testing: Monthly
```

---

## Security Checklist

### Authentication & Authorization
- ✅ JWT-based authentication with RS256
- ✅ Passkey (WebAuthn) support
- ✅ Multi-factor authentication (TOTP)
- ✅ Role-based access control (RBAC)
- ✅ Row-level security (RLS) in database
- ✅ Session management with Redis
- ✅ Token revocation support

### Data Protection
- ✅ AES-256 encryption at rest
- ✅ TLS 1.3 encryption in transit
- ✅ Field-level encryption for sensitive data
- ✅ Data masking for logs and exports
- ✅ Secure key management (AWS KMS)
- ✅ Regular backups with encryption

### Compliance
- ✅ GDPR compliance (data portability, right to erasure)
- ✅ PCI DSS compliance (payment processing)
- ✅ SOC 2 Type II controls
- ✅ HIPAA readiness (optional)
- ✅ CCPA compliance

### Monitoring & Logging
- ✅ Comprehensive audit logging
- ✅ Real-time security monitoring
- ✅ Anomaly detection
- ✅ Intrusion detection
- ✅ Security event alerts
- ✅ Incident response procedures

### Network Security
- ✅ WAF (CloudFlare)
- ✅ DDoS protection
- ✅ Rate limiting
- ✅ IP whitelisting/blacklisting
- ✅ VPC with private subnets
- ✅ Security groups and NACLs

### Application Security
- ✅ Input validation and sanitization
- ✅ Output encoding
- ✅ SQL injection prevention (ORM)
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Secure headers (helmet.js)

This comprehensive security framework ensures PropertyOS maintains the highest standards of data protection, regulatory compliance, and system integrity.