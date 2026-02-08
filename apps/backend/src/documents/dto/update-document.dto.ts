import {
  IsString,
  IsEnum,
  IsOptional,
  IsDate,
  IsArray,
  IsObject,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, AccessLevel } from './upload-document.dto';

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Document type',
    enum: DocumentType,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({
    description: 'Document description',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Document expiration date',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Access level for the document',
    enum: AccessLevel,
  })
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({
    description: 'Tags for document categorization',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}