import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ICoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResponse } from './dto/course-response.dto';
import { User } from '../auth/decorators/UserDecorator';
import { JwtAuthGuard, JWTPayload } from '../auth/guards/AuthGuard';
import { CourseEnrollmentResponse } from '../course-enrollments/dto/course-enrollment-response.dto';
import { PaymentResponse } from '../payments/dto/payment-response.dto';
import { CourseLessonResponse } from '../lessons/dto/lesson-response.dto';
import { AccessLog } from 'src/common/logging/access-log.decorator';

@Controller('courses')
export class CoursesController {
  constructor(
    @Inject('ICoursesService') private readonly coursesService: ICoursesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async create(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseResponse> {
    const course = await this.coursesService.create(createCourseDto);
    return CourseResponse.make(course);
  }

  @Post('/:id/register')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async register(
    @User() user: JWTPayload,
    @Param('id') courseId: string,
  ): Promise<CourseEnrollmentResponse> {
    const courseEnrollment = await this.coursesService.registerUser(
      user.id,
      courseId,
    );
    return CourseEnrollmentResponse.make(courseEnrollment);
  }

  @Post('/:id/pay')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async purchaseCourse(
    @User() user: JWTPayload,
    @Param('id') courseId: string,
  ): Promise<any> {
    const courseEnrollment = await this.coursesService.purchaseCourse(
      user.id,
      courseId,
    );
    return { success: true };
  }

  @Get()
  @AccessLog()
  async findAll(): Promise<CourseResponse[]> {
    const courses = await this.coursesService.findAll();
    return CourseResponse.collection(courses);
  }

  @Get('/:id/lessons')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async findAllLessons(
    @User() user: JWTPayload,
    @Param('id') courseId: string,
  ): Promise<CourseLessonResponse[]> {
    const lessons = await this.coursesService.findAllLessons(user, courseId);
    return CourseLessonResponse.collection(lessons);
  }

  @Get(':id/enrollments')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async findAllEnrollments(
    @Param('id') courseId: string,
  ): Promise<CourseEnrollmentResponse[]> {
    const courseEnrollments =
      await this.coursesService.findAllEnrollments(courseId);
    return CourseEnrollmentResponse.collection(courseEnrollments);
  }

  @Get(':id/payments')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async findAllPayments(
    @Param('id') courseId: string,
  ): Promise<PaymentResponse[]> {
    const coursePayments = await this.coursesService.findAllPayments(courseId);
    return PaymentResponse.collection(coursePayments);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async findOne(@Param('id') id: string): Promise<CourseResponse> {
    const course = await this.coursesService.findOne(id);
    return CourseResponse.make(course);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponse> {
    const course = await this.coursesService.update(id, updateCourseDto);
    return CourseResponse.make(course);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async remove(@Param('id') id: string): Promise<CourseResponse> {
    const course = await this.coursesService.remove(id);
    return CourseResponse.make(course);
  }
}
