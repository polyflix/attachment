export class AttachmentMissingExtensionError extends Error {
  constructor(message?: string) {
    super(message ?? `The file extension of the attachment must be defined.`);
  }
}
