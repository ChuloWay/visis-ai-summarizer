import { Controller, Post, Body } from '@nestjs/common';
import { SummaryService } from './summary.service';

@Controller('summaries')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Post()
  generate(@Body('text') text: string): string {
    return this.summaryService.generateSummary(text);
  }
}
