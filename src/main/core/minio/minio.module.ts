import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MinioModule as NestJSMinioModule } from "@svtslv/nestjs-minio";
import { minioConfig } from "src/main/config/minio.config";

@Global()
@Module({
  imports: [
    NestJSMinioModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: minioConfig
    })
  ]
})
export class MinioModule {}
