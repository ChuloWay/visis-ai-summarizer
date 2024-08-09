import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SummaryDocument = HydratedDocument<Summary>;

@Schema()
export class Summary {
  @Prop({ default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

const SummarySchema = SchemaFactory.createForClass(Summary);

export { SummarySchema };
