import { Injectable } from '@nestjs/common';
import { CoursesService } from './modules/courses/courses.service';

@Injectable()
export class AppService {
  constructor(private readonly coursesService: CoursesService){
    console.log(coursesService)
  }
  getHello(): string {
    return 'Hello World!';
  }
}
