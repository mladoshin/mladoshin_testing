import { LessonResponse } from "@shared/types";
import { Lesson } from "./types";

export class LessonAdapter {
  static mapFromResponse = (res: LessonResponse): Lesson => ({
    id: res.id,
    title: res.title,
    content: res.content,
    date: new Date(res.date),
    //course: res.course,
    course_id: res.course_id,
  });
}
