import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class AttachmentParams {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;

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
