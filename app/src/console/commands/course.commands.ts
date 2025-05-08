import { Inject, Injectable } from '@nestjs/common';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import { CoursesService } from 'src/modules/courses/courses.service';
import { CreateCourseDto } from 'src/modules/courses/dto/create-course.dto';
import { UpdateCourseDto } from 'src/modules/courses/dto/update-course.dto';

@Command({ name: 'course:create', description: 'Создать новый курс' })
export class CreateCourseCommand extends CommandRunner {
  constructor(private readonly coursesService: CoursesService) {
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
    @Inject(CoursesService) private readonly coursesService: CoursesService,
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

@Command({ name: 'course:get', arguments: '<id>', description: 'Получить курс по ID' })
export class GetCourseCommand extends CommandRunner {
  constructor(
    @Inject(CoursesService) private readonly coursesService: CoursesService,
  ) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const [id] = passedParams;
    const course = await this.coursesService.findOne(id);
    console.log('Курс:', course);
  }
}

@Command({ name: 'course:update', arguments: '<id>', description: 'Обновить курс' })
export class UpdateCourseCommand extends CommandRunner {
  constructor(
    @Inject(CoursesService) private readonly coursesService: CoursesService,
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

@Command({ name: 'course:remove', arguments: '<id>', description: 'Удалить курс' })
export class RemoveCourseCommand extends CommandRunner {
  constructor(
    @Inject(CoursesService) private readonly coursesService: CoursesService,
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