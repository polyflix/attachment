import { v4 as uuid } from "uuid";
import { AttachmentMissingExtensionError } from "../errors/attachment-missing-extension";
import { AttachmentMissingLinkError } from "../errors/attachment-missing-link.error";

export enum AttachmentStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
}

export enum AttachmentType {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL"
}

export enum ElementType {
  VIDEOS = "videos",
  MODULES = "modules"
}

export interface CreateAttachmentProps {
  id?: string;
  userId: string;
  status?: AttachmentStatus;
  type: AttachmentType;
  videos?: string[];
  modules?: string[];
  url?: string;
  extension?: string;
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
    public extension?: string,
    public title?: string,
    public description?: string
  ) {}

  static create(props: CreateAttachmentProps): Attachment {
    if (!props.id && props.type === AttachmentType.EXTERNAL && !props.url)
      throw new AttachmentMissingLinkError();
    if (!props.id && props.type === AttachmentType.INTERNAL && !props.extension)
      throw new AttachmentMissingExtensionError();
    return new Attachment(
      props.id ?? uuid(),
      props.userId,
      props.status ??
        (props.type === AttachmentType.INTERNAL
          ? AttachmentStatus.IN_PROGRESS
          : AttachmentStatus.COMPLETED),
      props.type,
      props.videos,
      props.modules,
      props.url,
      props.extension,
      props.title,
      props.description
    );
  }
}

export interface PaginatedAttachments {
  items: Attachment[];
  totalCount: number;
}
