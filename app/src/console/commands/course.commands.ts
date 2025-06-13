import { Inject, Injectable } from '@nestjs/common';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import {
  CoursesService,
  ICoursesService,
} from 'src/modules/courses/courses.service';
import { CreateCourseDto } from 'src/modules/courses/dto/create-course.dto';
import { UpdateCourseDto } from 'src/modules/courses/dto/update-course.dto';

// Команда для покупки курса пользователем (только если уже зарегистрировался)
// pnpm run console course:purchase -u fe045e65-5d45-4165-925d-a48c809779e9 -c d279f85c-9eda-469c-9e26-de79dce92638
@Command({
  name: 'course:purchase',
  description: 'Оплатить курс пользователем',
})
export class PurchaseCourseCommand extends CommandRunner {
  constructor(
    @Inject('ICoursesService') private readonly coursesService: ICoursesService,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options: Record<string, any>,
  ): Promise<void> {
    const payment = await this.coursesService.purchaseCourse(
      options.user,
      options.course,
    );
    console.log('Оплата прошла успешно:', payment);
  }

  @Option({ flags: '-u, --user <userId>', description: 'ID пользователя' })
  parseUser(val: string): string {
    return val;
  }

  @Option({ flags: '-c, --course <courseId>', description: 'ID курса' })
  parseCourse(val: string): string {
    return val;
  }
}

// Команда для регистрации на курс пользователя
// pnpm run console course:register -u fe045e65-5d45-4165-925d-a48c809779e9 -c d279f85c-9eda-469c-9e26-de79dce92638
@Command({
  name: 'course:register',
  description: 'Зарегистрировать на курс пользователя',
})
export class RegisterCourseCommand extends CommandRunner {
  constructor(
    @Inject('ICoursesService') private readonly coursesService: ICoursesService,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options: Record<string, any>,
  ): Promise<void> {
    const courseEnrollment = await this.coursesService.registerUser(
      options.user,
      options.course,
    );
    console.log('Регистрация прошла успешно:', courseEnrollment);
  }

  @Option({ flags: '-u, --user <userId>', description: 'ID пользователя' })
  parseUser(val: string): string {
    return val;
  }

  @Option({ flags: '-c, --course <courseId>', description: 'ID курса' })
  parseCourse(val: string): string {
    return val;
  }
}

// pnpm run console course:create --name "Курс 2" --price 100 --start "2025-01-01" --finish "2025-01-10"
@Command({ name: 'course:create', description: 'Создать новый курс' })
export class CreateCourseCommand extends CommandRunner {
  constructor(
    @Inject('ICoursesService') private readonly coursesService: ICoursesService,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options: Record<string, any>,
  ): Promise<void> {
    const dto: CreateCourseDto = {
      name: options.name,
      price: parseFloat(options.price),
      date_start: options.start,
      date_finish: options.finish,
    };
    const course = await this.coursesService.create(dto);
    console.log('Курс создан:', course);
  }

  @Option({ flags: '-n, --name <name>', description: 'Название курса' })
  parseName(val: string): string {
    return val;
  }

  @Option({ flags: '-p, --price <price>', description: 'Цена курса' })
  parsePrice(val: string): string {
    return val;
  }

  @Option({ flags: '-s, --start <date>', description: 'Дата начала (ISO)' })
  parseStart(val: string): string {
    return val;
  }

  @Option({ flags: '-f, --finish <date>', description: 'Дата окончания (ISO)' })
  parseFinish(val: string): string {
    return val;
  }
}

@Command({ name: 'course:list', description: 'Показать все курсы' })
export class ListCourseCommand extends CommandRunner {
  constructor(
    @Inject('ICoursesService') private readonly coursesService: ICoursesService,
  ) {
    super();
  }

  async run(): Promise<void> {
    const courses = await this.coursesService.findAll();
    console.table(courses, [
      'id',
      'name',
      'price',
      'date_start',
      'date_finish',
    ]);
  }
}

// pnpm run console course:enrollments
@Command({
  name: 'course:enrollments',
  description: 'Показать всех участников',
})
export class ListCourseEnrollmentsCommand extends CommandRunner {
  constructor(
    @Inject('ICoursesService') private readonly coursesService: ICoursesService,
  ) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const [id] = passedParams;
    const courseEnrollments = await this.coursesService.findAllEnrollments(id);
    console.table(courseEnrollments, [
      'id',
      'user_id',
      'course_id',
      'created_at',
      'status',
    ]);
  }
}

@Command({
  name: 'course:get',
  arguments: '<id>',
  description: 'Получить курс по ID',
})
export class GetCourseCommand extends CommandRunner {
  constructor(
    @Inject('ICoursesService') private readonly coursesService: ICoursesService,
  ) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const [id] = passedParams;
    const course = await this.coursesService.findOne(id);
    console.log('Курс:', course);
  }
}

@Command({
  name: 'course:update',
  arguments: '<id>',
  description: 'Обновить курс',
})
export class UpdateCourseCommand extends CommandRunner {
  constructor(
    @Inject('ICoursesService') private readonly coursesService: ICoursesService,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options: Record<string, any>,
  ): Promise<void> {
    const [id] = passedParams;
    const dto: UpdateCourseDto = {};
    if (options.name) dto.name = options.name;
    if (options.price) dto.price = parseFloat(options.price);
    if (options.start) dto.date_start = options.start;
    if (options.finish) dto.date_finish = options.finish;
    const updated = await this.coursesService.update(id, dto);
    console.log('Курс обновлен:', updated);
  }

  @Option({ flags: '-n, --name <name>', description: 'Название курса' })
  parseName(val: string): string {
    return val;
  }

  @Option({ flags: '-p, --price <price>', description: 'Цена курса' })
  parsePrice(val: string): string {
    return val;
  }

  @Option({ flags: '-s, --start <date>', description: 'Дата начала (ISO)' })
  parseStart(val: string): string {
    return val;
  }

  @Option({ flags: '-f, --finish <date>', description: 'Дата окончания (ISO)' })
  parseFinish(val: string): string {
    return val;
  }
}

@Command({
  name: 'course:remove',
  arguments: '<id>',
  description: 'Удалить курс',
})
export class RemoveCourseCommand extends CommandRunner {
  constructor(
    @Inject('ICoursesService') private readonly coursesService: ICoursesService,
  ) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const [id] = passedParams;
    await this.coursesService.remove(id);
    console.log('Курс удален:', id);
  }
}

@Command({
  name: 'course',
  description: 'Manage courses',
})
export class CourseCommands extends CommandRunner {
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    console.log(
      'Available subcommands: create, list, get <id>, update <id>, remove <id>',
    );
  }
}
