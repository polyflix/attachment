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
  AttachmentType,
  CreateAttachmentProps
} from "../../domain/entities/attachment.entity";
import { AttachmentMissingLinkError } from "../../domain/errors/attachment-missing-link.error";
import { AttachmentRepository } from "../adapters/repositories/attachment.repository";
import { AttachmentParams } from "../filters/attachment.params";

@Injectable()
export class AttachmentService {
  private readonly logger = new Logger(AttachmentService.name);

  constructor(private readonly attachmentRepository: AttachmentRepository) {}

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
    return AttachmentResponse.of(await this.getAttachment(id));
  }

  async find(params: AttachmentParams): Promise<PaginatedAttachmentsResponse> {
    const paginatedAttachments = await this.attachmentRepository.findAll(
      params
    );
    return PaginatedAttachmentsResponse.of(paginatedAttachments);
  }

  async create(props: CreateAttachmentProps): Promise<AttachmentResponse> {
    const attachment = Result.fromExecution(() =>
      Attachment.create(props)
    ).match({
      Ok: (attachment) => attachment,
      Error: (error: Error) => {
        switch (error.constructor) {
          case AttachmentMissingLinkError:
            this.logger.warn(error.message);
            throw new BadRequestException(error.message);
          default:
            this.logger.error(error.message);
            throw new InternalServerErrorException(error.message);
        }
      }
    });
    return AttachmentResponse.of(
      await this.attachmentRepository.create(attachment)
    );
  }

  async update(
    id: string,
    props: UpdateAttachmentDto
  ): Promise<AttachmentResponse> {
    const attachment = await this.getAttachment(id);
    if (props.url && attachment.type === AttachmentType.INTERNAL) {
      const errorMessage =
        "The url cannot be updated if the attachment is an internal file.";
      this.logger.warn(errorMessage);
      throw new BadRequestException(errorMessage);
    }
    return AttachmentResponse.of(
      await this.attachmentRepository.update({ ...attachment, ...props })
    );
  }

  async delete(id: string): Promise<AttachmentResponse> {
    const attachment = await this.getAttachment(id);
    return AttachmentResponse.of(
      await this.attachmentRepository.remove(attachment)
    );
  }
}
