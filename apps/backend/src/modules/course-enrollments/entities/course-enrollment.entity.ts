import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { CourseEnrollmentStatus } from '../types/course-enrollments.types';
import { Course } from 'src/modules/courses/entities/course.entity';

@Entity('course_enrollment')
@Unique(['user_id', 'course_id'])
export class CourseEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.courseEnrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'uuid' })
  user_id: string

  @ManyToOne(() => Course, (course) => course.courseEnrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({ type: 'uuid' })
  course_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ default: CourseEnrollmentStatus.NEW, enum: CourseEnrollmentStatus, type: 'enum' })
  status: CourseEnrollmentStatus;
}
