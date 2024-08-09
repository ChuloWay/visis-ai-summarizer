import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SummaryService } from 'src/summary/summary.service';
import { Book, BookDocument } from './schema/book.schema';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    private readonly summaryService: SummaryService,
    @InjectQueue('summary-queue') private readonly summaryQueue: Queue,
  ) {}

  async create(bookDto: {
    title: string;
    publisher: string;
    text: string;
  }): Promise<Book> {
    try {
      const createdBook = new this.bookModel({
        title: bookDto.title,
        publisher: bookDto.publisher,
      });

      const savedBook = await createdBook.save();

      await this.summaryQueue.add('generate-summary', {
        bookId: savedBook._id,
        text: bookDto.text,
      });

      return savedBook;
    } catch (error) {
      console.error('Failed to create book and enqueue summary job:', error);
      throw new Error('Book creation failed');
    }
  }

  async findAll(): Promise<Book[]> {
    return this.bookModel.find().populate('summary').exec();
  }

  async findOneByTitle(title: string): Promise<Book> {
    return this.bookModel.findOne({ title }).populate('summary').exec();
  }

  async findOneById(id: string): Promise<Book> {
    return this.bookModel.findById({ id }).populate('summary').exec();
  }

  async update(
    id: string,
    bookDto: { title?: string; publisher?: string; text?: string },
  ): Promise<Book> {
    try {
      const book = await this.bookModel.findById(id).exec();
      if (!book) {
        throw new Error('Book not found');
      }

      if (bookDto.text) {
        const summaryText = await this.summaryService.generateSummary(
          bookDto.text,
          5,
        );
        await this.summaryService.update(book.summary, summaryText);
      }

      return this.bookModel
        .findByIdAndUpdate(id, bookDto, { new: true })
        .exec();
    } catch (error) {
      console.error('Failed to update book:', error);
      throw new Error('Book update failed');
    }
  }

  async delete(id: string): Promise<any> {
    try {
      const book = await this.bookModel.findById(id).exec();
      if (!book) {
        throw new Error('Book not found');
      }

      await this.summaryService.delete(book.summary);
      return this.bookModel.findByIdAndDelete(id).exec();
    } catch (error) {
      console.error('Failed to delete book:', error);
      throw new Error('Book deletion failed');
    }
  }
}
