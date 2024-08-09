import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schema/book.schema';
import { SummaryModule } from 'src/summary/summary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
    SummaryModule,
  ],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {}
