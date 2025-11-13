import { CourseEnrollmentStatus } from "@shared/types";

export interface Course {
  id: string;
  name: string;
  price: number;
  priceWithCommission: number;
  startDate: Date;
  endDate: Date;
  enrollment_status?: CourseEnrollmentStatus | null;
}
