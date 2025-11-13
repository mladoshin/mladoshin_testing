import { CourseResponse } from "@shared/types";
import { Course } from "./types";

export class CourseAdapter {
  static mapFromResponse = (res: CourseResponse): Course => ({
    id: res.id,
    name: res.name,
    startDate: new Date(res.date_start),
    endDate: new Date(res.date_finish),
    price: Number(res.price),
    priceWithCommission: Number(res.price_with_commission),
    enrollment_status: res.enrollment_status,
  });
}
