import {
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
import { MeId, MeRoles, Role, Roles } from "@polyflix/x-utils";
import { CreateAttachmentDto } from "../../application/dto/create-attachment.dto";
import { UpdateAttachmentDto } from "../../application/dto/update-attachment.dto";
import { AttachmentParams } from "../filters/attachment.params";
import { AttachmentService } from "../services/attachment.service";

@Controller("attachments")
export class AttachmentController {
  private readonly logger = new Logger(AttachmentController.name);

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
}
