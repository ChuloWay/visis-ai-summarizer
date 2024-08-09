import { Injectable, Logger } from '@nestjs/common';
import { TfIdf } from 'natural';
import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';
// import synonyms from 'synonyms';

import { stopWords } from '../utils/stopwords';
import { InjectModel } from '@nestjs/mongoose';
import { Summary, SummaryDocument } from './schema/summary.schema';
import { Model, Types } from 'mongoose';
import { SummarizerUtil } from '../utils/ai-summarizer.util';
@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);
  private summarizerUtil: SummarizerUtil;
  private model: any;

  constructor(
    @InjectModel(Summary.name) private summaryModel: Model<SummaryDocument>,
  ) {
    this.summarizerUtil = new SummarizerUtil();
  }

  async create(bookId: Types.ObjectId, summaryText: string): Promise<Summary> {
    try {
      const createdSummary = new this.summaryModel({
        book: bookId,
        summary: summaryText,
      });

      return await createdSummary.save();
    } catch (error) {
      console.error('Failed to create summary:', error);
      throw new Error('Summary creation failed');
    }
  }

  async generateSummary(text: string, maxSentences: number): Promise<string> {
    return this.summarizerUtil.generateSummary(text, maxSentences);
  }

  async update(id: any, summaryText: string): Promise<Summary> {
    return this.summaryModel
      .findByIdAndUpdate(id, { summary: summaryText }, { new: true })
      .exec();
  }

  async delete(id: any): Promise<any> {
    return this.summaryModel.findByIdAndDelete(id).exec();
  }
}
