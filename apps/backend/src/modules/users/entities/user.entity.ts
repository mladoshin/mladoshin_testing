import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';
import { UserAvailability } from 'src/modules/user-availability/entities/user-availability.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 128 })
  email: string;

  @Column({ type: 'varchar', length: 128 })
  password: string;

  @Column({ enum: UserRole, default: UserRole.USER, type: 'enum' })
  role: UserRole;

  @OneToOne(() => UserProfile, (profile) => profile.user, {
    eager: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: UserProfile;

  // @Column({ type: 'uuid', nullable: true })
  // profile_id: string;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments?: Payment[];

  @OneToMany(
    () => CourseEnrollment,
    (courseEnrollment) => courseEnrollment.user,
  )
  courseEnrollments?: CourseEnrollment[];

  @OneToMany(
    () => UserAvailability,
    (userAvailability) => userAvailability.user,
  )
  availabilities?: UserAvailability[];
}
