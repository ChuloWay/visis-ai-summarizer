import { Injectable } from '@nestjs/common';

@Injectable()
export class SummaryService {
  generateSummary(text: string): string {
    // Placeholder for AI model integration
    return `Summary of: ${text}`;
  }
}
