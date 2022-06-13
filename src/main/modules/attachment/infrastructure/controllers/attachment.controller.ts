import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import {
  MeId,
  MeRoles,
  MinIOMessageValue,
  Role,
  Roles
} from "@polyflix/x-utils";
import { S3_ACTION } from "src/main/core/constants/minio.constants";
import { getMinioEventType } from "src/main/core/minio/minio.utils";
import { CreateAttachmentDto } from "../../application/dto/create-attachment.dto";
import { UpdateAttachmentDto } from "../../application/dto/update-attachment.dto";
import {
  AttachmentStatus,
  AttachmentType
} from "../../domain/entities/attachment.entity";
import { AttachmentParams } from "../filters/attachment.params";
import { AttachmentService } from "../services/attachment.service";

@Controller("attachments")
export class AttachmentController {
  private readonly logger = new Logger(AttachmentController.name);
  private static KAFKA_MINIO_TOPIC = "polyflix.minio.attachment";

  constructor(private readonly attachmentService: AttachmentService) {}

  @Get()
  @Roles(Role.Admin, Role.Contributor, Role.Member)
  find(@Query() params: AttachmentParams) {
    return this.attachmentService.find(params);
  }

  @Get(":id")
  @Roles(Role.Admin, Role.Contributor, Role.Member)
  findOne(@Param("id") id: string) {
    return this.attachmentService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Contributor)
  create(@Body() createDto: CreateAttachmentDto, @MeId() id: string) {
    return this.attachmentService.create({
      ...createDto,
      userId: id
    });
  }

  @Patch(":id")
  @Roles(Role.Admin, Role.Contributor)
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateAttachmentDto,
    @MeRoles() roles: Role[],
    @MeId() userId: string
  ) {
    const attachment = await this.attachmentService.findOne(id);
    if (!roles.includes(Role.Admin) && attachment.userId !== userId) {
      const errorMessage = `Unauthorized user (${userId}) tried to edit an attachment.`;
      this.logger.warn(errorMessage);
      throw new ForbiddenException(errorMessage);
    }
    return this.attachmentService.update(id, updateDto);
  }

  @Delete(":id")
  @Roles(Role.Admin, Role.Contributor)
  async delete(
    @Param("id") id: string,
    @MeRoles() roles: Role[],
    @MeId() userId: string
  ) {
    const attachment = await this.attachmentService.findOne(id);
    if (!roles.includes(Role.Admin) && attachment.userId !== userId) {
      const errorMessage = `Unauthorized user (${userId}) tried to delete an attachment.`;
      this.logger.warn(errorMessage);
      throw new ForbiddenException(errorMessage);
    }
    return this.attachmentService.delete(id);
  }

  @EventPattern(AttachmentController.KAFKA_MINIO_TOPIC)
  async subscribeToMinio(@Payload("value") message: MinIOMessageValue) {
    this.logger.log(
      `Event received on ${AttachmentController.KAFKA_MINIO_TOPIC} - ${message.EventName}`
    );
    const type = getMinioEventType(message);
    if (type === S3_ACTION.CREATED) {
      let attachmentId = "";
      try {
        const splittedFilename = message.Key.split("/")[1].split(".");
        attachmentId = splittedFilename[splittedFilename.length - 2];
      } catch (e) {
        throw new BadRequestException(`Unable to parse the filename : ${e}`);
      }
      this.logger.log(`Setting attachment ${attachmentId} to COMPLETED.`);
      await this.attachmentService.update(attachmentId, {
        type: AttachmentType.INTERNAL,
        status: AttachmentStatus.COMPLETED
      });
    }
  }
}
