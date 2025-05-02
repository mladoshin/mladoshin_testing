import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';

@Entity('course_lesson')
export class CourseLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'double precision', default: 0 })
  price: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'timestamptz' })
  date_start: string;

  @Column({ type: 'timestamptz' })
  date_finish: string;

  @ManyToOne(() => Course, (course) => course.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'uuid' })
  course_id: string;
}
