import { IsOptional, IsString } from "class-validator";

export class UpdateAttachmentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsString({ each: true })
  @IsOptional()
  modules?: string[];
}
