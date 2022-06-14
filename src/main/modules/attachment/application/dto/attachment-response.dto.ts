import {
  Attachment,
  AttachmentStatus,
  AttachmentType,
  PaginatedAttachments
} from "../../domain/entities/attachment.entity";

export class AttachmentResponse {
  private constructor(
    public id: string,
    public userId: string,
    public status: AttachmentStatus,
    public type: AttachmentType,
    public videos: string[],
    public modules: string[],
    public url: string,
    public extension?: string,
    public title?: string,
    public description?: string
  ) {}

  public static of(attachment: Attachment): AttachmentResponse {
    return new AttachmentResponse(
      attachment.id,
      attachment.userId,
      attachment.status,
      attachment.type,
      attachment.videos || [],
      attachment.modules || [],
      attachment.url,
      attachment.extension,
      attachment.title,
      attachment.description
    );
  }
}

export class PaginatedAttachmentsResponse {
  private constructor(
    public items: AttachmentResponse[],
    public totalCount: number
  ) {}

  public static of(
    attachments: PaginatedAttachments
  ): PaginatedAttachmentsResponse {
    return new PaginatedAttachmentsResponse(
      attachments.items.map((attachment) => AttachmentResponse.of(attachment)),
      attachments.totalCount
    );
  }
}
