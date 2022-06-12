import { ConfigService } from "@nestjs/config";
import { MinioModuleOptions } from "@svtslv/nestjs-minio";

export const minioConfig = (
  configService: ConfigService
): MinioModuleOptions => ({
  config: {
    endPoint: configService.get<string>("minio.host") ?? "localhost",
    port: +configService.get<number>("minio.port") ?? 9000,
    useSSL: configService.get<string>("minio.ssl") === "true",
    accessKey: configService.get<string>("minio.accessKey"),
    secretKey: configService.get<string>("minio.secretKey")
  }
});
