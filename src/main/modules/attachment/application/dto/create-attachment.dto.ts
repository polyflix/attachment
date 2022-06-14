import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AttachmentType } from "../../domain/entities/attachment.entity";

export class CreateAttachmentDto {
  @IsEnum(AttachmentType)
  @IsNotEmpty()
  type: AttachmentType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  extension?: string;
}
