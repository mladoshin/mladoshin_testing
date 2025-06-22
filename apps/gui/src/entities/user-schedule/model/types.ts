import { Course } from "@/entities/course/model/types";
import { Lesson } from "@/entities/lesson/model/types";
import { User } from "@/entities/user/model/types";

export interface UserSchedule {
  id: string;
  user?: User | null;
  userId: string;
  course?: Course | null;
  courseId: string;
  lesson?: Lesson | null;
  lessonId: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
}
