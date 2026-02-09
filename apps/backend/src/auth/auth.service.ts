import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@property-os/database';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtPayload } from './jwt.strategy';
import { UserRole } from './roles.decorator';
import { randomBytes } from 'crypto';
import { getJwtKey } from './jwt-keys';

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    tenant_id: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    tenant_id: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if organization with this slug already exists
    const existingOrg = await this.prisma.organization.findFirst({
      where: {
        slug: this.slugify(dto.tenant_name),
      },
    });

    if (existingOrg) {
      throw new ConflictException('Organization with this name already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    // Create organization
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.tenant_name,
        slug: this.slugify(dto.tenant_name),
        status: 'ACTIVE',
        plan: 'essential',
      },
    });

    // Create user
    const user = await this.prisma.user.create({
      data: {
        tenantId: organization.id,
        email: dto.email,
        passwordHash: hashedPassword,
        firstName: dto.first_name,
        lastName: dto.last_name,
        role: 'ADMIN',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, organization.id, user.email, user.role as UserRole);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        role: user.role as UserRole,
        tenant_id: organization.id,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    // Find user with organization - email is unique per tenant, so we need to search by email first
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await this.validatePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check organization status
    if (user.organization.status !== 'ACTIVE') {
      throw new UnauthorizedException('Organization account is not active');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.tenantId,
      user.email,
      user.role as UserRole,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        role: user.role as UserRole,
        tenant_id: user.tenantId,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        plan: user.organization.plan,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  }

  async logout(userId: string): Promise<void> {
    // In a production environment, you would add the token to a blacklist
    // For now, we'll just log the logout action
    // This can be enhanced with Redis for token revocation
  }

  async refreshToken(dto: RefreshTokenDto): Promise<Tokens> {
    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify<JwtPayload>(dto.refresh_token, {
        secret: getJwtKey(this.configService, 'JWT_PUBLIC_KEY'),
        algorithms: ['RS256'],
        issuer: 'propertyos.com',
        audience: 'propertyos-api',
      });

      // Check if user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { organization: true },
      });

      if (!user || user.organization.status !== 'ACTIVE') {
        throw new UnauthorizedException('User or organization is not active');
      }

      // Generate new tokens
      return this.generateTokens(
        user.id,
        user.tenantId,
        user.email,
        user.role as UserRole,
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return;
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token (you would typically store this in Redis or a separate table)
    // For now, we'll just simulate this
    // In production, you would save this to a password_reset_tokens table

    // Send email with reset link
    // This would integrate with your email service
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Verify reset token (in production, this would check against stored tokens)
    // For now, we'll implement a basic version

    if (!token || token.length !== 64) {
      throw new BadRequestException('Invalid reset token');
    }

    // In production, you would:
    // 1. Find the reset token in the database
    // 2. Check if it's expired
    // 3. Get the user email from the token
    // 4. Update the user's password
    // 5. Delete the reset token

    // For now, this is a placeholder
    throw new BadRequestException('Password reset not fully implemented yet');
  }

  async verifyEmail(token: string): Promise<void> {
    // Verify email token
    // In production, this would check against stored verification tokens

    if (!token) {
      throw new BadRequestException('Invalid verification token');
    }

    // For now, this is a placeholder
    throw new BadRequestException('Email verification not fully implemented yet');
  }

  async generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: UserRole,
  ): Promise<Tokens> {
    const payload = {
      sub: userId,
      tenant_id: tenantId,
      role,
      email,
    };

    const privateKey = getJwtKey(this.configService, 'JWT_PRIVATE_KEY');
    const publicKey = getJwtKey(this.configService, 'JWT_PUBLIC_KEY');

    if (!privateKey || !publicKey) {
      throw new Error('JWT keys are not configured');
    }

    const access_token = this.jwtService.sign(payload, {
      privateKey,
      algorithm: 'RS256',
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'propertyos.com',
      audience: 'propertyos-api',
      jwtid: randomBytes(16).toString('hex'),
    });

    const refresh_token = this.jwtService.sign(
      { sub: userId, tenant_id: tenantId, type: 'refresh' },
      {
        privateKey,
        algorithm: 'RS256',
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'propertyos.com',
        audience: 'propertyos-api',
        jwtid: randomBytes(16).toString('hex'),
      },
    );

    return {
      access_token,
      refresh_token,
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }
}