import { CourseEnrollmentStatus } from "../../enums";

export interface CourseResponse {
  id: string;
  name: string;
  price: number;
  price_with_commission: number;
  commision: number;
  date_start: string;
  date_finish: string;
  enrollment_status?: CourseEnrollmentStatus | null;
}
