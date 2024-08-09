import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Summary, SummarySchema } from './schema/summary.schema';
import { BullModule } from '@nestjs/bullmq';
import { SummaryProcessor } from './summary-processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'summaryQueue',
    }),
    MongooseModule.forFeature([{ name: Summary.name, schema: SummarySchema }]),
  ],
  controllers: [SummaryController],
  providers: [SummaryService, SummaryProcessor],
  exports: [SummaryService],
})
export class SummaryModule {}
