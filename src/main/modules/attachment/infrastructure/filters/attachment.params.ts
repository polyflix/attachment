import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class AttachmentParams {
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsUUID(4)
  @IsOptional()
  userId?: string;

  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsString({ each: true })
  @IsOptional()
  modules?: string[];
}
