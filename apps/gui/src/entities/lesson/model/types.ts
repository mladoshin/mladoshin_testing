import { Course } from "@/entities/course/model/types";

export interface Lesson {
  id: string;
  title: string;
  content: string;
  date: Date;
  course?: Course;
  course_id: string;
}
