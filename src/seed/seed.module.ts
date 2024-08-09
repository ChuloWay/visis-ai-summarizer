import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookService } from 'src/book/book.service';
import { BookSchema } from 'src/book/schema/book.schema';
import { SummarySchema } from 'src/summary/schema/summary.schema';
import { SummaryService } from '../summary/summary.service';
import { SeedService } from './seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Book', schema: BookSchema }]),
    MongooseModule.forFeature([{ name: 'Summary', schema: SummarySchema }]),
  ],
  providers: [BookService, SummaryService, SeedService],
})
export class SeedModule {}
