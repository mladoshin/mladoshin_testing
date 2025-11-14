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
  Req,
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
import { OptionalJwtAuthGuard } from '../auth/guards/OptionalAuthGuard';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

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
    @Req() req,
  ): Promise<CourseResponse> {
    const course = await this.coursesService.create(createCourseDto, {schema: req.headers['x-test-schema']});
    return CourseResponse.make(course);
  }

  @Post('/:id/register')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async register(
    @User() user: JWTPayload,
    @Param('id') courseId: string,
    @Req() req,
  ): Promise<CourseEnrollmentResponse> {
    const courseEnrollment = await this.coursesService.registerUser(
      user.id,
      courseId,
      {schema: req.headers['x-test-schema']},
    );
    return CourseEnrollmentResponse.make(courseEnrollment);
  }

  @Post('/:id/pay')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async purchaseCourse(
    @User() user: JWTPayload,
    @Param('id') courseId: string,
    @Req() req,
  ): Promise<any> {
    const courseEnrollment = await this.coursesService.purchaseCourse(
      user.id,
      courseId,
      {schema: req.headers['x-test-schema']},
    );
    return { success: true };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @AccessLog()
  async findAll(@User() user?: JWTPayload, @Req() req?): Promise<CourseResponse[]> {
    const courses = await this.coursesService.findAll(user, {schema: req.headers['x-test-schema']});
    return CourseResponse.collection(courses);
  }

  @Get('/:id/lessons')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async findAllLessons(
    @User() user: JWTPayload,
    @Param('id') courseId: string,
    @Req() req,
  ): Promise<CourseLessonResponse[]> {
    const lessons = await this.coursesService.findAllLessons(user, courseId, {schema: req.headers['x-test-schema']});
    return CourseLessonResponse.collection(lessons);
  }

  @Get(':id/enrollments')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async findAllEnrollments(
    @Param('id') courseId: string,
    @Req() req,
  ): Promise<CourseEnrollmentResponse[]> {
    const courseEnrollments =
      await this.coursesService.findAllEnrollments(courseId, {schema: req.headers['x-test-schema']});
    return CourseEnrollmentResponse.collection(courseEnrollments);
  }

  @Get(':id/payments')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async findAllPayments(
    @Param('id') courseId: string,
    @Req() req,
  ): Promise<PaymentResponse[]> {
    const coursePayments = await this.coursesService.findAllPayments(courseId, {schema: req.headers['x-test-schema']});
    return PaymentResponse.collection(coursePayments);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @AccessLog()
  async findOne(
    @Param('id') id: string,
    @User() user?: JWTPayload,
    @Req() req?,
  ): Promise<CourseResponse> {
    const course = await this.coursesService.findOne(id, user, {schema: req.headers['x-test-schema']});
    return CourseResponse.make(course);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req,
  ): Promise<CourseResponse> {
    const course = await this.coursesService.update(id, updateCourseDto, {schema: req.headers['x-test-schema']});
    return CourseResponse.make(course);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @AccessLog()
  async remove(@Param('id') id: string, @Req() req): Promise<CourseResponse> {
    const course = await this.coursesService.remove(id, {schema: req.headers['x-test-schema']});
    return CourseResponse.make(course);
  }
}
