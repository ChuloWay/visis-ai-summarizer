import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BookService } from './book.service';
import { Book } from './interfaces/book.interface';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  create(@Body() book: Book) {
    this.bookService.create(book);
  }

  @Get()
  findAll(): Book[] {
    return this.bookService.findAll();
  }

  @Get(':title')
  findOne(@Param('title') title: string): Book {
    return this.bookService.findOne(title);
  }
}
