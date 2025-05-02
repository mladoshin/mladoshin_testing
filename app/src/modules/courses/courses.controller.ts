import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResponse } from './dto/course-response.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  async create(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseResponse> 
  {
    const course = await this.coursesService.create(createCourseDto);
    return CourseResponse.make(course);
  }

  @Get()
  async findAll(): Promise<CourseResponse[]> 
  {
    const courses = await this.coursesService.findAll();
    return CourseResponse.collection(courses);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CourseResponse> 
  {
    const course = await this.coursesService.findOne(id);
    return CourseResponse.make(course);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponse> 
  {
    const course = await this.coursesService.update(id, updateCourseDto);
    return CourseResponse.make(course);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<CourseResponse> 
  {
    const course = await this.coursesService.remove(id);
    return CourseResponse.make(course);
  }
}
