import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';

export class UpdatePropertyDto extends PartialType(
  OmitType(CreatePropertyDto, ['name'] as const),
) {}