import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { PrismaService } from '@property-os/database';

@Module({
  controllers: [UnitsController],
  providers: [UnitsService, PrismaService],
  exports: [UnitsService],
})
export class UnitsModule {}