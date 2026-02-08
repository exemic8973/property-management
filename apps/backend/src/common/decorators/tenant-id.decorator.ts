import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract tenant_id from request headers or user claims
 * For multi-tenant data isolation
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    // Try to get tenant_id from header first (for service-to-service calls)
    if (request.headers['x-tenant-id']) {
      return request.headers['x-tenant-id'];
    }
    
    // Fall back to user's tenantId from JWT payload
    return request.user?.tenantId;
  },
);