import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseLesson } from './entities/course-lesson.entity';
import { CourseLessonRepo } from './lessons.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CourseLesson])],
  controllers: [LessonsController],
  providers: [
    { provide: 'ILessonsService', useClass: LessonsService },
    { provide: 'ICourseLessonRepo', useClass: CourseLessonRepo },
  ],
  exports: ['ICourseLessonRepo', 'ILessonsService'],
})
export class LessonsModule {}
