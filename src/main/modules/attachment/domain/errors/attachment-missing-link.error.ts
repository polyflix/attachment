export class AttachmentMissingLinkError extends Error {
  constructor(message?: string) {
    super(message ?? `The URL of the attachment must be defined.`);
  }
}
