import { CourseDomain } from '../../domains/course.domain';
import { CourseLessonDomain } from 'src/modules/lessons/domains/lesson.domain';
import { PaymentDomain } from 'src/modules/payments/domains/payment.domain';
import { CourseEnrollmentDomain } from 'src/modules/course-enrollments/domains/course-enrollment.domain';

export class CourseDomainBuilder {
  private _id = 'course-1';
  private _price = 1000;
  private _name = 'Test Course';
  private _date_start = '2025-01-01';
  private _date_finish = '2025-12-31';
  private _lessons?: CourseLessonDomain[];
  private _payments?: PaymentDomain[];
  private _courseEnrollments?: CourseEnrollmentDomain[];

  id(id: string) {
    this._id = id;
    return this;
  }

  price(price: number) {
    this._price = price;
    return this;
  }

  name(name: string) {
    this._name = name;
    return this;
  }

  dateStart(date: string) {
    this._date_start = date;
    return this;
  }

  dateFinish(date: string) {
    this._date_finish = date;
    return this;
  }

  lessons(lessons: CourseLessonDomain[]) {
    this._lessons = lessons;
    return this;
  }

  payments(payments: PaymentDomain[]) {
    this._payments = payments;
    return this;
  }

  courseEnrollments(enrollments: CourseEnrollmentDomain[]) {
    this._courseEnrollments = enrollments;
    return this;
  }

  default() {
    return {
      id: this._id ?? '006aeece-b464-4968-8c34-23e581a1cf9b',
      price: this._price ?? 100,
      name: this._name ?? 'Test',
      date_start: this._date_start ?? new Date().toISOString(),
      date_finish:
        this._date_finish ?? new Date(Date.now() + 3600 * 1000).toISOString(),
      lessons: this._lessons ?? [],
      payments: this._payments ?? [],
      courseEnrollments: this._courseEnrollments ?? [],
    };
  }

  build(): CourseDomain {
    return {
      id: this._id,
      price: this._price,
      name: this._name,
      date_start: this._date_start,
      date_finish: this._date_finish,
      lessons: this._lessons,
      payments: this._payments,
      courseEnrollments: this._courseEnrollments,
    };
  }
}
