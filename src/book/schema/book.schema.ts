import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Summary } from '../../summary/schema/summary.schema';

export type BookDocument = HydratedDocument<Book> & {
  summary?: Summary | Types.ObjectId;
};

@Schema()
export class Book {
  @Prop({ default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  publisher: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

const BookSchema = SchemaFactory.createForClass(Book);

BookSchema.virtual('summary', {
  ref: 'Summary',
  localField: '_id',
  foreignField: 'book',
  justOne: true,
});

// Populate the summary automatically when fetching books
BookSchema.set('toJSON', { virtuals: true });
BookSchema.set('toObject', { virtuals: true });

export { BookSchema };
