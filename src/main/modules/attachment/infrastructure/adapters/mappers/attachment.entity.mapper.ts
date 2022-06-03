import { Injectable } from "@nestjs/common";
import { AbstractMapper } from "src/main/core/helpers/abstract.mapper";
import {
  Attachment,
  AttachmentStatus,
  AttachmentType
} from "../../../domain/entities/attachment.entity";
import { AttachmentEntity } from "../repositories/entities/attachment.entity";

@Injectable()
export class AttachmentEntityMapper extends AbstractMapper<
  AttachmentEntity,
  Attachment
> {
  apiToEntity(apiModel: Attachment): AttachmentEntity {
    const entity = new AttachmentEntity();
    return { ...entity, ...apiModel, _id: apiModel.id };
  }

  entityToApi(entity: AttachmentEntity): Attachment {
    return Attachment.create({
      id: entity._id,
      userId: entity.userId,
      status: entity.status as AttachmentStatus,
      type: entity.type as AttachmentType,
      videos: entity.videos,
      modules: entity.modules,
      url: entity.url,
      title: entity.title,
      description: entity.description
    });
  }
}
