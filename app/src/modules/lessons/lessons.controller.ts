import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CourseLessonResponse } from './dto/lesson-response.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  async create(
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<CourseLessonResponse> {
    const lesson = await this.lessonsService.create(createLessonDto);
    return CourseLessonResponse.make(lesson);
  }

  @Get()
  async findAll(): Promise<CourseLessonResponse[]> {
    const lessons = await this.lessonsService.findAll();
    return CourseLessonResponse.collection(lessons);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CourseLessonResponse> {
    const lesson = await this.lessonsService.findOne(id);
    return CourseLessonResponse.make(lesson);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ): Promise<CourseLessonResponse> {
    const lesson = await this.lessonsService.update(id, updateLessonDto);
    return CourseLessonResponse.make(lesson);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<CourseLessonResponse> {
    const lesson = await this.lessonsService.remove(id);
    return CourseLessonResponse.make(lesson);
  }
}
