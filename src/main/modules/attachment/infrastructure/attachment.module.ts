import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { RolesGuard } from "@polyflix/x-utils";
import { AttachmentEntityMapper } from "./adapters/mappers/attachment.entity.mapper";
import { AttachmentRepository } from "./adapters/repositories/attachment.repository";
import {
  AttachmentEntity,
  AttachmentSchema
} from "./adapters/repositories/entities/attachment.entity";
import { AttachmentController } from "./controllers/attachment.controller";
import { AttachmentService } from "./services/attachment.service";

@Module({
  controllers: [AttachmentController],
  imports: [
    MongooseModule.forFeature([
      { name: AttachmentEntity.name, schema: AttachmentSchema }
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("database.mongo.uri")
      })
    })
  ],
  providers: [
    AttachmentRepository,
    AttachmentService,
    AttachmentEntityMapper,
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AttachmentModule {}
