import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Decorator to extract tenant_id from the authenticated user's JWT claims.
 * Always uses the JWT tenant_id to prevent cross-tenant access via header spoofing.
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    const tenantId = request.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Missing tenant context');
    }

    return tenantId;
  },
);