import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectMinioClient, MinioClient } from "@svtslv/nestjs-minio";
import {
  GET_PSU_EXPIRY,
  MINIO_ATTACHMENTS_BUCKET,
  PUT_PSU_EXPIRY
} from "src/main/core/constants/minio.constants";
import { Attachment } from "../../domain/entities/attachment.entity";

@Injectable()
export class MinioService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectMinioClient() private readonly minioClient: MinioClient,
    private readonly configService: ConfigService
  ) {}

  public getMinioBaseUrl(): string {
    const { host, port, ssl } = this.configService.get("minio");
    const protocol = ssl === "true" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;
    if (port) return `${baseUrl}:${port}`;
    return baseUrl;
  }

  public async getPSU(attachment: Attachment): Promise<string> {
    this.logger.log(`Getting GET PSU for ${this.buildFileName(attachment)}`);
    return await this.minioClient.presignedGetObject(
      MINIO_ATTACHMENTS_BUCKET,
      this.buildFileName(attachment),
      GET_PSU_EXPIRY
    );
  }

  public async putPSU(attachment: Attachment): Promise<string> {
    this.logger.log(`Getting PUT PSU for ${this.buildFileName(attachment)} `);
    return await this.minioClient.presignedPutObject(
      MINIO_ATTACHMENTS_BUCKET,
      this.buildFileName(attachment),
      PUT_PSU_EXPIRY
    );
  }

  public async deleteFile(attachment: Attachment): Promise<void> {
    this.logger.log(`Deleting MinIO file ${this.buildFileName(attachment)}`);
    try {
      await this.minioClient.removeObject(
        MINIO_ATTACHMENTS_BUCKET,
        this.buildFileName(attachment)
      );
    } catch (e) {
      this.logger.error(e);
      this.logger.warn(
        `Unable to delete file related to attachment ${attachment.id}, still deleting the attachment entity.`
      );
    }
  }

  private buildFileName(attachment: Attachment): string {
    return `${attachment.id}.${attachment.extension}`;
  }
}
