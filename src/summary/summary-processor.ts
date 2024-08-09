import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SummaryService } from './summary.service';
import { Types } from 'mongoose';
import { Logger } from '@nestjs/common';

@Processor('summary-queue')
export class SummaryProcessor extends WorkerHost {
  private readonly logger = new Logger(SummaryService.name);
  constructor(private readonly summaryService: SummaryService) {
    super();
  }

  async process(job: Job<{ bookId: string; text: string }>) {
    const { bookId, text } = job.data;

    try {
      const summaryText = await this.summaryService.generateSummary(text, 5);
      await this.summaryService.create(new Types.ObjectId(bookId), summaryText);
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }
}
