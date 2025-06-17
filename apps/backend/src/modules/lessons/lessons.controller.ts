import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
} from '@nestjs/common';
import { ILessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CourseLessonResponse } from './dto/lesson-response.dto';
import { AccessLog } from 'src/common/logging/access-log.decorator';

@Controller('lessons')
export class LessonsController {
  constructor(
    @Inject('ILessonsService') private readonly lessonsService: ILessonsService,
  ) {}

  @Post()
  @AccessLog()
  async create(
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<CourseLessonResponse> {
    const lesson = await this.lessonsService.create(createLessonDto);
    return CourseLessonResponse.make(lesson);
  }

  @Get()
  @AccessLog()
  async findAll(): Promise<CourseLessonResponse[]> {
    const lessons = await this.lessonsService.findAll();
    return CourseLessonResponse.collection(lessons);
  }

  @Get(':id')
  @AccessLog()
  async findOne(@Param('id') id: string): Promise<CourseLessonResponse> {
    const lesson = await this.lessonsService.findOne(id);
    return CourseLessonResponse.make(lesson);
  }

  @Patch(':id')
  @AccessLog()
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ): Promise<CourseLessonResponse> {
    const lesson = await this.lessonsService.update(id, updateLessonDto);
    return CourseLessonResponse.make(lesson);
  }

  @Delete(':id')
  @AccessLog()
  async remove(@Param('id') id: string): Promise<CourseLessonResponse> {
    const lesson = await this.lessonsService.remove(id);
    return CourseLessonResponse.make(lesson);
  }
}
