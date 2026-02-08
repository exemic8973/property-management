import { Module } from '@nestjs/common';
import { LeasesController } from './leases.controller';
import { LeasesService } from './leases.service';
import { PrismaService } from '@property-os/database';

@Module({
  controllers: [LeasesController],
  providers: [LeasesService, PrismaService],
  exports: [LeasesService],
})
export class LeasesModule {}