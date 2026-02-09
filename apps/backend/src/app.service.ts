import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AppService {
  private prisma = new PrismaClient();

  constructor(private configService: ConfigService) {}

  getStatus() {
    return {
      status: 'ok',
      message: 'PropertyOS API is running',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async getDiagnostics() {
    const diagnostics: Record<string, unknown> = {
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
      jwt_private_key_set: !!this.configService.get('JWT_PRIVATE_KEY'),
      jwt_public_key_set: !!this.configService.get('JWT_PUBLIC_KEY'),
      jwt_private_key_length: (this.configService.get('JWT_PRIVATE_KEY') || '').length,
      jwt_public_key_length: (this.configService.get('JWT_PUBLIC_KEY') || '').length,
      database_url_set: !!this.configService.get('DATABASE_URL'),
    };

    try {
      await this.prisma.$connect();
      diagnostics.db_connected = true;

      // Check if tables exist
      const tables = await this.prisma.$queryRaw`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      ` as { table_name: string }[];
      diagnostics.tables = tables.map(t => t.table_name);
    } catch (e) {
      diagnostics.db_connected = false;
      diagnostics.db_error = (e as Error).message;
    }

    return diagnostics;
  }
}
