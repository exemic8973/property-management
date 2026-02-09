import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from './roles.decorator';
import { getJwtKey } from './jwt-keys';

export interface JwtPayload {
  sub: string;
  tenant_id: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtKey(configService, 'JWT_PUBLIC_KEY'),
      algorithms: ['RS256'],
      issuer: 'propertyos.com',
      audience: 'propertyos-api',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.tenant_id || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}