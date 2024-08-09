import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SummaryService } from './summary.service';

@Controller('ai')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Post('summarize')
  async summarize(@Body() body: { text: string; maxSentences?: number }) {
    try {
      const maxSentences = body.maxSentences || 5;
      const summary = await this.summaryService.generateSummary(
        body.text,
        maxSentences,
      );
      return { summary };
    } catch (error) {
      throw new HttpException(
        'Failed to generate summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
