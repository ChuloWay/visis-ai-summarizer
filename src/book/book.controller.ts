import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BookService } from './book.service';
import { Book } from './schema/book.schema'; // Assuming you're using the schema for typing

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  async create(
    @Body() book: { title: string; publisher: string; text: string },
  ): Promise<Book> {
    return this.bookService.create(book);
  }

  @Get()
  async findAll(): Promise<Book[]> {
    return this.bookService.findAll();
  }

  @Get(':title')
  async findOne(@Param('title') title: string): Promise<Book> {
    return this.bookService.findOne(title);
  }
}
