import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Summary } from '../../summary/schema/summary.schema';
export type BookDocument = HydratedDocument<Book>;

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

  @Prop({ type: Types.ObjectId, ref: 'Summary' })
  summary: Types.ObjectId;
}

const BookSchema = SchemaFactory.createForClass(Book);

export { BookSchema };
