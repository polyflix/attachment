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
import { ConfigService } from "@nestjs/config";
import { ClientKafka, EventPattern, Payload } from "@nestjs/microservices";
import {
  InjectKafkaClient,
  MeId,
  MeRoles,
  MinIOMessageValue,
  PolyflixKafkaMessage,
  Role,
  Roles,
  TriggerType
} from "@polyflix/x-utils";
import { difference } from "lodash";
import { S3_ACTION } from "src/main/core/constants/minio.constants";
import { getMinioEventType } from "src/main/core/minio/minio.utils";
import { PolyflixKafkaTypedValue } from "src/main/core/types/kafkaevent.type";
import { CreateAttachmentDto } from "../../application/dto/create-attachment.dto";
import { UpdateAttachmentDto } from "../../application/dto/update-attachment.dto";
import {
  Attachment,
  AttachmentStatus,
  AttachmentType,
  ElementType
} from "../../domain/entities/attachment.entity";
import { Element } from "../../domain/entities/element.entity";
import { AttachmentParams } from "../filters/attachment.params";
import { AttachmentService } from "../services/attachment.service";

@Controller("attachments")
export class AttachmentController {
  private readonly logger = new Logger(AttachmentController.name);
  private static KAFKA_MINIO_TOPIC = "polyflix.minio.attachment";
  private static KAFKA_VIDEO_TOPIC = "polyflix.video";
  private static KAFKA_MODULE_TOPIC = "polyflix.catalog.module";
  private readonly KAFKA_ATTACHMENT_TOPIC: string;

  constructor(
    private readonly attachmentService: AttachmentService,
    @InjectKafkaClient() private readonly kafcaClient: ClientKafka,
    private readonly configService: ConfigService
  ) {
    this.KAFKA_ATTACHMENT_TOPIC = this.configService.get<string>(
      "kafka.topics.attachment"
    );
  }

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
  async create(@Body() createDto: CreateAttachmentDto, @MeId() id: string) {
    const newAttachment = await this.attachmentService.create({
      ...createDto,
      userId: id
    });
    this.publishAttachment(TriggerType.CREATE, newAttachment);
    return newAttachment;
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
    const updatadAttachment = await this.attachmentService.update(
      id,
      updateDto
    );
    this.publishAttachment(TriggerType.UPDATE, updatadAttachment);
    return updatadAttachment;
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
    const deletedAttachment = await this.attachmentService.delete(id);
    this.publishAttachment(TriggerType.DELETE, deletedAttachment);
    return deletedAttachment;
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
      const updatedAttachment = await this.attachmentService.update(
        attachmentId,
        {
          type: AttachmentType.INTERNAL,
          status: AttachmentStatus.COMPLETED
        }
      );
      this.publishAttachment(TriggerType.UPDATE, updatedAttachment);
    }
  }

  /**
   * Receive a message from the video Kafka topic
   * @param message The video event
   */
  @EventPattern(AttachmentController.KAFKA_VIDEO_TOPIC)
  async subscribeToVideo(
    @Payload("value") message: PolyflixKafkaTypedValue<Element>
  ) {
    this.logger.log(
      `Recieve message from topic: polyflix.legacy.video - trigger: ${message.trigger}`
    );
    this.handleElementUpdate(ElementType.VIDEOS, message);
  }

  /**
   * Receive a message from the module Kafka topic
   * @param message The module event
   */
  @EventPattern(AttachmentController.KAFKA_MODULE_TOPIC)
  async subscribeToModule(
    @Payload("value") message: PolyflixKafkaTypedValue<Element>
  ) {
    this.handleElementUpdate(ElementType.MODULES, message);
  }

  private async handleElementUpdate(
    elementType: ElementType,
    message: PolyflixKafkaTypedValue<Element>
  ) {
    switch (message.trigger) {
      case TriggerType.CREATE:
        /* If an element is created and contains attachments,
        we add the element in each attachment */
        for (const id of message.payload.attachments) {
          const attachment = await this.attachmentService.findOne(id);
          await this.attachmentService.handleElementUpdate(
            attachment,
            elementType,
            message.trigger,
            message.payload.id
          );
        }
        break;
      case TriggerType.UPDATE:
        /* If an element is updated, we observe the difference between old attachments elements and the updated one.
        Then, we remove / add the elements for the needed attachments. */
        const oldAttachments = (
          await this.attachmentService.find({
            [elementType]: [message.payload.id]
          })
        ).items.map((attachment) => attachment.id);

        const elementsToAdd = difference(
          message.payload.attachments,
          oldAttachments
        );
        for (const id of elementsToAdd) {
          const attachment = await this.attachmentService.findOne(id);
          await this.attachmentService.handleElementUpdate(
            attachment,
            elementType,
            TriggerType.CREATE,
            message.payload.id
          );
        }
        const elementsToDelete = difference(
          oldAttachments,
          message.payload.attachments
        );
        for (const id of elementsToDelete) {
          const attachment = await this.attachmentService.findOne(id);
          await this.attachmentService.handleElementUpdate(
            attachment,
            elementType,
            TriggerType.DELETE,
            message.payload.id
          );
        }
        break;
      case TriggerType.DELETE:
        /* If an element is deleted, we look for each attachment that contains this element,
        and we remove this element from each attachment. */
        for (const attachment of (
          await this.attachmentService.find({
            [elementType]: [message.payload.id]
          })
        ).items) {
          await this.attachmentService.handleElementUpdate(
            attachment,
            elementType,
            TriggerType.DELETE,
            message.payload.id
          );
        }
        break;
    }
  }

  /**
   * Sends an attachment in a Kafka topic
   * @param type The type of the event
   * @param payload The attachment
   */
  publishAttachment(type: TriggerType, payload: Attachment) {
    for (const topic of [this.KAFKA_ATTACHMENT_TOPIC]) {
      this.logger.log(
        `Publishing ${type} event in topic ${topic} for attachment ${payload.id}`
      );
      this.kafcaClient.emit<string, PolyflixKafkaMessage>(topic, {
        key: payload.id,
        value: { trigger: type, payload }
      });
    }
  }
}
