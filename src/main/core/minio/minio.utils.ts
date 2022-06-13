import { BadRequestException } from "@nestjs/common";
import { MinIOMessageValue } from "@polyflix/x-utils";
import { S3_ACTION } from "../constants/minio.constants";

export const getMinioEventType = (message: MinIOMessageValue): S3_ACTION => {
  try {
    return message.EventName.split(":")[1] as S3_ACTION;
  } catch (e) {
    throw new BadRequestException(`Unknown S3 action : ${message.EventName}`);
  }
};
