export interface CreateLessonRequestDto {
  course_id: string;
  title: string;
  content: string;
  date: string;
  duration: number;
}
