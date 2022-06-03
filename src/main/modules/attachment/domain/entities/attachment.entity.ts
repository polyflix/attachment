import { v4 as uuid } from "uuid";
import { AttachmentMissingLinkError } from "../errors/attachment-missing-link.error";

export enum AttachmentStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
}

export enum AttachmentType {
  LOCAL = "LOCAL",
  EXTERNAL = "EXTERNAL"
}

export interface CreateAttachmentProps {
  id?: string;
  userId: string;
  status?: AttachmentStatus;
  type: AttachmentType;
  videos?: string[];
  modules?: string[];
  url?: string;
  title?: string;
  description?: string;
}

export class Attachment {
  private constructor(
    public readonly id: string,
    public userId: string,
    public status: AttachmentStatus,
    public type: AttachmentType,
    /** An array of the videos ids containing this attachment */
    public videos?: string[],
    /** An array of modules ids containing this attachment */
    public modules?: string[],
    public url?: string,
    public title?: string,
    public description?: string
  ) {}

  static create(props: CreateAttachmentProps): Attachment {
    if (props.type === AttachmentType.EXTERNAL && !props.url)
      throw new AttachmentMissingLinkError();
    return new Attachment(
      props.id ?? uuid(),
      props.userId,
      props.status ??
        (props.type === AttachmentType.LOCAL
          ? AttachmentStatus.IN_PROGRESS
          : AttachmentStatus.COMPLETED),
      props.type,
      props.videos,
      props.modules,
      props.url,
      props.title,
      props.description
    );
  }

  /**
   * Return true if the attachment is an external link, or if the attachment file is uploaded
   */
  // public get isAvailable(): boolean {
  //   return this.status == AttachmentStatus.COMPLETED;
  // }
}

export interface PaginatedAttachments {
  items: Attachment[];
  totalCount: number;
}
