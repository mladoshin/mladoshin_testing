export interface ICreateUserScheduleDto {
  course_id: string;
  lesson_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration: number;
}
