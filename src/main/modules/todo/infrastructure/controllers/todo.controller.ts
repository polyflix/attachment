import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post
} from "@nestjs/common";
import { CreateTodoDto } from "../../application/dto/create-todo.dto";
import { TodoService } from "../services/todo.service";

@Controller()
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  find() {
    return this.todoService.find();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.todoService.findOne(id);
  }

  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(createTodoDto);
  }

  @Patch(":id/complete")
  completeOne(@Param("id") id: string) {
    return this.todoService.completeTodo(id);
  }

  @Delete(":id")
  deleteOne(@Param("id") id: string) {
    return this.todoService.delete(id);
  }
}
