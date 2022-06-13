export const GET_PSU_EXPIRY = 60 * 60;
export const PUT_PSU_EXPIRY = 60 * 60;

export const MINIO_ATTACHMENTS_BUCKET = "attachments";

export enum S3_ACTION {
  CREATED = "ObjectCreated",
  ACCESSED = "ObjectAccessed",
  REMOVED = "ObjectRemoved"
}
