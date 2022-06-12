import { IsEnum, IsOptional, IsString } from "class-validator";
import { AttachmentType } from "../../domain/entities/attachment.entity";

export class UpdateAttachmentDto {
  @IsEnum(AttachmentType)
  @IsOptional()
  type: AttachmentType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  extension?: string;

  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsString({ each: true })
  @IsOptional()
  modules?: string[];
}
