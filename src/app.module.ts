import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/book.module';
import { SummaryModule } from './summary/summary.module';

@Module({
  imports: [BookModule, SummaryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
