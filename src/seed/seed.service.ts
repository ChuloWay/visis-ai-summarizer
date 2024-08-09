import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '../book/schema/book.schema';
import { Summary, SummaryDocument } from '../summary/schema/summary.schema';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(Summary.name)
    private readonly summaryModel: Model<SummaryDocument>,
  ) {}

  async seed() {
    await this.clearDatabase();

    const booksData = [
      {
        title: 'The Great Adventure',
        publisher: 'Adventure Press',
        text: 'This book details the exciting adventures of a group of explorers in uncharted territories.',
      },
      {
        title: 'Mystery of the Lost City',
        publisher: 'Mystery Books Ltd.',
        text: 'An enthralling tale of a detective unraveling the secrets of a lost city.',
      },
      {
        title: 'Journey to the Unknown',
        publisher: 'Exploration Publishing',
        text: 'A captivating account of an expedition to unexplored regions of the world.',
      },
    ];

    for (const bookData of booksData) {
      const createdBook = new this.bookModel({
        title: bookData.title,
        publisher: bookData.publisher,
      });
      await createdBook.save();

      const summaryText = `Summary for: ${bookData.title}`;
      const createdSummary = new this.summaryModel({
        book: createdBook._id,
        summary: summaryText,
      });

      await createdSummary.save();
    }

    console.log(
      'Seeding completed: Books and Summaries have been added or updated.',
    );
  }

  private async clearDatabase() {
    await this.summaryModel.deleteMany({}).exec();
    await this.bookModel.deleteMany({}).exec();
    console.log(
      'Database cleared: Existing books and summaries have been removed.',
    );
  }
}
