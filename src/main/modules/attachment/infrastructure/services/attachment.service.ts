import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { Result } from "@swan-io/boxed";
import {
  AttachmentResponse,
  PaginatedAttachmentsResponse
} from "../../application/dto/attachment-response.dto";
import { UpdateAttachmentDto } from "../../application/dto/update-attachment.dto";
import {
  Attachment,
  AttachmentStatus,
  AttachmentType,
  CreateAttachmentProps
} from "../../domain/entities/attachment.entity";
import { AttachmentMissingExtensionError } from "../../domain/errors/attachment-missing-extension";
import { AttachmentMissingLinkError } from "../../domain/errors/attachment-missing-link.error";
import { AttachmentRepository } from "../adapters/repositories/attachment.repository";
import { AttachmentParams } from "../filters/attachment.params";
import { MinioService } from "./minio.service";

@Injectable()
export class AttachmentService {
  private readonly logger = new Logger(AttachmentService.name);

  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly minioService: MinioService
  ) {}

  private async getAttachment(id: string): Promise<Attachment> {
    return (await this.attachmentRepository.findOne(id)).match({
      Some: (attachment) => attachment,
      None: () => {
        const errorMessage = `Attachment not found with id=${id}`;
        this.logger.warn(errorMessage);
        throw new NotFoundException(errorMessage);
      }
    });
  }

  async findOne(id: string): Promise<AttachmentResponse> {
    const attachment = await this.getAttachment(id);
    return AttachmentResponse.of({
      ...attachment,
      ...(attachment.type === AttachmentType.INTERNAL && {
        url: await this.minioService.getPSU(attachment)
      })
    });
  }

  async find(params: AttachmentParams): Promise<PaginatedAttachmentsResponse> {
    const paginatedAttachments = await this.attachmentRepository.findAll(
      params
    );
    return PaginatedAttachmentsResponse.of({
      totalCount: paginatedAttachments.totalCount,
      items: await Promise.all(
        paginatedAttachments.items.map(async (attachment) => ({
          ...attachment,
          url:
            attachment.type === AttachmentType.INTERNAL
              ? await this.minioService.getPSU(attachment)
              : attachment.url
        }))
      )
    });
  }

  async create(props: CreateAttachmentProps): Promise<AttachmentResponse> {
    const attachment = Result.fromExecution(() =>
      Attachment.create(props)
    ).match({
      Ok: (attachment) => attachment,
      Error: (error: Error) => {
        switch (error.constructor) {
          case AttachmentMissingLinkError:
          case AttachmentMissingExtensionError:
            this.logger.warn(error.message);
            throw new BadRequestException(error.message);
          default:
            this.logger.error(error.message);
            throw new InternalServerErrorException(error.message);
        }
      }
    });
    if (attachment.type === AttachmentType.INTERNAL) {
      attachment.url = await this.minioService.putPSU(attachment);
    }
    return AttachmentResponse.of(
      await this.attachmentRepository.create(attachment)
    );
  }

  async update(
    id: string,
    props: UpdateAttachmentDto & { status?: AttachmentStatus }
  ): Promise<AttachmentResponse> {
    const attachment = await this.getAttachment(id);
    // If old type is EXTERNAL, and new type is INTERNAL
    if (
      attachment.type === AttachmentType.EXTERNAL &&
      props.type === AttachmentType.INTERNAL
    ) {
      if (!props.extension)
        throw new BadRequestException(
          `The extension field must be set for an INTERNAL attachment.`
        );
      attachment.url = await this.minioService.putPSU({
        ...attachment,
        extension: props.extension
      });
      attachment.status = AttachmentStatus.IN_PROGRESS;
      delete props.url;
    }
    // If old type is INTERNAL, and new type is INTERNAL
    else if (
      attachment.type === AttachmentType.INTERNAL &&
      props.type === AttachmentType.EXTERNAL
    ) {
      if (!props.url)
        throw new BadRequestException(
          `The url field must be set for an EXTERNAL attachment.`
        );
      this.minioService.deleteFile(attachment);
      attachment.status = AttachmentStatus.COMPLETED;
      props.extension = null;
    }
    // If type is INTERNAL, and the file needs to be updated
    else if (props.extension && attachment.type === AttachmentType.INTERNAL) {
      this.logger.log(
        `Generating new put PSU in order to update internal attachment ${attachment.id}.`
      );
      this.minioService.deleteFile(attachment);
      attachment.url = await this.minioService.putPSU({
        ...attachment,
        extension: props.extension
      });
      attachment.status = AttachmentStatus.IN_PROGRESS;
      delete props.url;
    }
    return AttachmentResponse.of(
      await this.attachmentRepository.update({ ...attachment, ...props })
    );
  }

  async delete(id: string): Promise<AttachmentResponse> {
    const attachment = await this.getAttachment(id);
    if (attachment.type === AttachmentType.INTERNAL) {
      this.minioService.deleteFile(attachment);
    }
    return AttachmentResponse.of(
      await this.attachmentRepository.remove(attachment)
    );
  }
}
