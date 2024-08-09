import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SummaryService } from 'src/summary/summary.service';
import { Book, BookDocument } from './schema/book.schema';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    private readonly summaryService: SummaryService,
  ) {}

  async create(bookDto: {
    title: string;
    publisher: string;
    text: string;
  }): Promise<Book> {
    const createdBook = new this.bookModel({
      title: bookDto.title,
      publisher: bookDto.publisher,
    });

    const summaryText = await this.summaryService.generateSummary(
      bookDto.text,
      5,
    );

    const summary = await this.summaryService.create(
      createdBook._id,
      summaryText,
    );
    createdBook.summary = summary._id;

    return createdBook.save();
  }

  async findAll(): Promise<Book[]> {
    return this.bookModel.find().populate('summary').exec();
  }

  async findOne(title: string): Promise<Book> {
    return this.bookModel.findOne({ title }).populate('summary').exec();
  }

  async update(
    id: string,
    bookDto: { title?: string; publisher?: string; text?: string },
  ): Promise<Book> {
    if (bookDto.text) {
      const book = await this.bookModel.findById(id).exec();
      if (!book) {
        throw new Error('Book not found');
      }
      const summaryText = await this.summaryService.generateSummary(
        bookDto.text,
        5,
      );
      await this.summaryService.update(book.summary._id, summaryText);
    }

    return this.bookModel.findByIdAndUpdate(id, bookDto, { new: true }).exec();
  }

  async delete(id: string): Promise<any> {
    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new Error('Book not found');
    }

    await this.summaryService.delete(book.summary._id);
    return this.bookModel.findByIdAndDelete(id).exec();
  }
}
