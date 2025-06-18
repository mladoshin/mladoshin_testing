import { UserEntity } from './user.entity';
import {CourseEntity} from "./course.entity"

export interface UserAvailabilityEntity {
  id: string;
  user: UserEntity;
  course: CourseEntity;
  week_day: number;
  start_time: string;
  end_time: string;
}
