import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CourseLesson } from '../../lessons/entities/course-lesson.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';

@Entity('course')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'double precision', default: 0 })
  price: number;

  @Column({ type: 'text' })
  name: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz',
  })
  date_start: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz',
  })
  date_finish: string;

  @OneToMany(() => CourseLesson, (lesson) => lesson.course)
  lessons: CourseLesson[];

  @OneToMany(() => Payment, (payment) => payment.course)
  payments: Payment[];
}
