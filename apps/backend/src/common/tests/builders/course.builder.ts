import { Course } from 'src/modules/courses/entities/course.entity';
import { v4 as uuidv4 } from 'uuid';

export class CourseBuilder {
  private course: Course;

  constructor() {
    const now = new Date();
    this.course = {
      id: uuidv4(),
      name: 'Default Course',
      price: 0,
      date_start: now.toISOString(),
      date_finish: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 дней
      lessons: [],
      payments: [],
      courseEnrollments: [],
      availabilities: [],
    };
  }

  withId(id: string): this {
    this.course.id = id;
    return this;
  }

  withName(name: string): this {
    this.course.name = name;
    return this;
  }

  withPrice(price: number): this {
    this.course.price = price;
    return this;
  }

  withDateStart(date: string): this {
    this.course.date_start = date;
    return this;
  }

  withDateFinish(date: string): this {
    this.course.date_finish = date;
    return this;
  }

  build(): Course {
    return this.course;
  }
}
