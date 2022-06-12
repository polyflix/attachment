import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
  AttachmentStatus,
  AttachmentType
} from "src/main/modules/attachment/domain/entities/attachment.entity";

@Schema({ timestamps: true })
export class AttachmentEntity {
  @Prop()
  _id: string;

  @Prop()
  userId: string;

  @Prop({ enum: Object.values(AttachmentStatus) })
  status: string;

  @Prop({ enum: Object.values(AttachmentType) })
  type: string;

  @Prop()
  videos?: string[];

  @Prop()
  modules?: string[];

  @Prop()
  extension?: string;

  @Prop()
  url?: string;

  @Prop()
  title?: string;

  @Prop()
  description?: string;
}

export const AttachmentSchema = SchemaFactory.createForClass(AttachmentEntity);
