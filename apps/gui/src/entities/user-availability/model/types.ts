import { Course } from "@/entities/course/model/types";
import { User } from "@/entities/user/model/types";

export interface UserAvailability {
  id: string;
  user?: User | null;
  course?: Course | null;
  weekDay: number;
  startTime: string;
  endTime: string;
}
