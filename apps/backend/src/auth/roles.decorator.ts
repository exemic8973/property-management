import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'ADMIN',        // Full access to all tenant resources
  MANAGER = 'MANAGER',    // Property manager with operational access
  OWNER = 'OWNER',        // Property owner with financial access
  TENANT = 'TENANT',      // Tenant with self-service access
  VENDOR = 'VENDOR',      // Vendor with limited access
  ACCOUNTANT = 'ACCOUNTANT',  // Accountant with financial reporting access
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);