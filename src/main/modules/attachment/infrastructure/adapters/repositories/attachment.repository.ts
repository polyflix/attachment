import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Option } from "@swan-io/boxed";
import { Model } from "mongoose";
import {
  Attachment,
  PaginatedAttachments
} from "../../../domain/entities/attachment.entity";
import { AttachmentParams } from "../../filters/attachment.params";
import { AttachmentEntityMapper } from "../mappers/attachment.entity.mapper";
import { AttachmentEntity } from "./entities/attachment.entity";

@Injectable()
export class AttachmentRepository {
  private readonly logger = new Logger(AttachmentRepository.name);

  constructor(
    @InjectModel(AttachmentEntity.name)
    private readonly attachmentModel: Model<AttachmentEntity>,
    private readonly attachmentEntityMapper: AttachmentEntityMapper
  ) {}

  async findOne(id: string): Promise<Option<Attachment>> {
    this.logger.log(`Retrieving attachment with id ${id}.`);
    try {
      return Option.fromNullable<Attachment>(
        this.attachmentEntityMapper.entityToApi(
          await this.attachmentModel.findById(id).exec()
        )
      );
    } catch (e) {
      return Option.None();
    }
  }

  async findAll(params: AttachmentParams): Promise<PaginatedAttachments> {
    this.logger.log(
      `Retrieving attachments list with limit of ${params.limit} and offset of ${params.offset}.`
    );
    const query = { ...(params.userId && { userId: params.userId }) };
    const totalCount = await this.attachmentModel.countDocuments(query).exec();
    const attachments = await this.attachmentModel
      .find(query)
      .limit(params.limit || 20)
      .skip(params.offset || 0)
      .exec();
    return {
      items: this.attachmentEntityMapper.entitiesToApis(attachments),
      totalCount
    };
  }

  async save(body: Attachment): Promise<Attachment> {
    const attachment = new this.attachmentModel(
      this.attachmentEntityMapper.apiToEntity(body)
    );
    return this.attachmentEntityMapper.entityToApi(await attachment.save());
  }

  async remove(attachment: Attachment): Promise<Attachment> {
    const model = new this.attachmentModel(
      this.attachmentEntityMapper.apiToEntity(attachment)
    );
    return this.attachmentEntityMapper.entityToApi(await model.remove());
  }
}
