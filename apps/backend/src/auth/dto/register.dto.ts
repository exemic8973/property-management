import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Acme Properties',
    description: 'Organization name'
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  tenant_name: string;

  @ApiProperty({
    example: 'admin@acme.com',
    description: 'User email address'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password (minimum 8 characters, must contain uppercase, lowercase, number and special character)'
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character'
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  first_name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  last_name: string;
}