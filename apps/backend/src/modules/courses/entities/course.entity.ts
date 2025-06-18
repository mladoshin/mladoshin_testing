import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CourseLesson } from '../../lessons/entities/course-lesson.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';
import { UserAvailability } from 'src/modules/user-availability/entities/user-availability.entity';

@Entity('course')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'double precision', default: 0 })
  price: number;

  @Column({ type: 'text' })
  name: string;

  @Column({
    type: 'timestamptz',
  })
  date_start: string;

  @Column({
    type: 'timestamptz',
  })
  date_finish: string;

  @OneToMany(() => CourseLesson, (lesson) => lesson.course)
  lessons?: CourseLesson[];

  @OneToMany(() => Payment, (payment) => payment.course)
  payments?: Payment[];

  @OneToMany(
    () => CourseEnrollment,
    (courseEnrollment) => courseEnrollment.course,
  )
  courseEnrollments?: CourseEnrollment[];

  @OneToMany(
    () => UserAvailability,
    (userAvailability) => userAvailability.course,
  )
  availabilities?: UserAvailability[];
}
