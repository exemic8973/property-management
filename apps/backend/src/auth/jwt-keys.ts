import { ConfigService } from '@nestjs/config';

/**
 * Decode a JWT key from environment variable.
 * Supports both raw PEM format and base64-encoded PEM.
 * Base64 encoding allows multiline PEM keys to be stored as single-line env vars.
 */
export function getJwtKey(configService: ConfigService, key: string): string {
  const value = configService.get<string>(key);
  if (!value) return '';

  // If it already looks like a PEM key, return as-is
  if (value.includes('-----BEGIN')) {
    return value;
  }

  // Otherwise, assume it's base64-encoded
  return Buffer.from(value, 'base64').toString('utf-8');
}
