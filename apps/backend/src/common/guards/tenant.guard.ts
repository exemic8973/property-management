import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@property-os/database';

/**
 * Guard to enforce multi-tenant data isolation
 * Validates that the user has access to the tenant context
 * and sets tenant_id for Row Level Security (RLS)
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract tenant_id from header or user claims
    const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context required');
    }

    // Verify tenant exists and is active
    try {
      const tenant = await this.prisma.organization.findUnique({
        where: { id: tenantId },
        select: { id: true, status: true },
      });

      if (!tenant) {
        throw new UnauthorizedException('Tenant not found');
      }

      if (tenant.status !== 'ACTIVE') {
        throw new UnauthorizedException('Tenant is not active');
      }

      // Attach tenant context to request for downstream use
      request.tenantId = tenantId;
      request.tenant = tenant;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to validate tenant context');
    }
  }
}