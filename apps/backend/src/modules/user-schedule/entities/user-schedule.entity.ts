import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('user_schedule')
export class UserSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({type: "uuid"})
  user_id: string;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({type: "uuid"})
  course_id: string;

  @ManyToOne(() => CourseLesson, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: CourseLesson;

  @Column({type: "uuid"})
  lesson_id: string;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduled_date: string;

  @Column({ name: 'start_time', type: 'time' })
  start_time: string;

  @Column({ name: 'end_time', type: 'time' })
  end_time: string;

  @Column({ name: 'duration', type: 'int', unsigned: true })
  duration: number;
}
