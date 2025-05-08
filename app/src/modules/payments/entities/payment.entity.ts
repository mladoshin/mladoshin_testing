import { Course } from 'src/modules/courses/entities/course.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz',
    default: () => process.env.NODE_ENV === 'test' ? "CURRENT_TIMESTAMP" : "now()",
  })
  timestamp: string;

  @Column({ type: 'double precision' })
  amount: number;

  @ManyToOne(() => Course, (course) => course.payments, { cascade: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'uuid' })
  course_id: string;

  @ManyToOne(() => User, (user) => user.payments, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  user_id: string;
}
