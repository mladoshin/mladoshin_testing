// src/console/commands/lesson.commands.ts

import { Inject } from '@nestjs/common';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import { CreateLessonDto } from 'src/modules/lessons/dto/create-lesson.dto';
import { UpdateLessonDto } from 'src/modules/lessons/dto/update-lesson.dto';
import { ILessonsService } from 'src/modules/lessons/lessons.service';

@Command({ name: 'lesson:create', description: 'Create a new lesson' })
export class CreateLessonCommand extends CommandRunner {
  constructor(
    @Inject('ILessonsService') private readonly lessonsService: ILessonsService,
  ) {
    super();
  }

  async run(_params: string[], options: Record<string, any>): Promise<void> {
    const dto: CreateLessonDto = {
      course_id: options.course,
      title: options.title,
      content: options.content,
      date: options.date,
    };

    const lesson = await this.lessonsService.create(dto);
    console.log('Created lesson:', lesson);
  }

  @Option({ flags: '-c, --course <courseId>', description: 'Course ID (UUID)' })
  parseCourse(val: string) {
    return val;
  }

  @Option({ flags: '-t, --title <title>', description: 'Lesson title' })
  parseTitle(val: string) {
    return val;
  }

  @Option({ flags: '-b, --content <content>', description: 'Lesson content' })
  parseContent(val: string) {
    return val;
  }

  @Option({ flags: '-d, --date <date>', description: 'Lesson date (ISO)' })
  parseDate(val: string) {
    return val;
  }
}

@Command({ name: 'lesson:list', description: 'List all lessons' })
export class ListLessonCommand extends CommandRunner {
  constructor(
    @Inject('ILessonsService') private readonly lessonsService: ILessonsService,
  ) {
    super();
  }

  async run(): Promise<void> {
    const lessons = await this.lessonsService.findAll();
    console.table(lessons, ['id', 'title', 'date', 'course_id']);
  }
}

@Command({ name: 'lesson:get', arguments: '<id>', description: 'Get lesson by ID' })
export class GetLessonCommand extends CommandRunner {
  constructor(
    @Inject('ILessonsService') private readonly lessonsService: ILessonsService,
  ) {
    super();
  }

  async run([id]: string[]): Promise<void> {
    const lesson = await this.lessonsService.findOne(id);
    console.log('Lesson:', lesson);
  }
}

@Command({
  name: 'lesson:update',
  arguments: '<id>',
  description: 'Update a lesson',
})
export class UpdateLessonCommand extends CommandRunner {
  constructor(
    @Inject('ILessonsService') private readonly lessonsService: ILessonsService,
  ) {
    super();
  }

  async run([id]: string[], options: Record<string, any>): Promise<void> {
    const dto: UpdateLessonDto = {};
    if (options.title) dto.title = options.title;
    if (options.content) dto.content = options.content;
    if (options.date) dto.date = options.date;

    const updated = await this.lessonsService.update(id, dto);
    console.log('Updated lesson:', updated);
  }

  @Option({ flags: '-t, --title <title>', description: 'Lesson title' })
  parseTitle(val: string) {
    return val;
  }

  @Option({ flags: '-b, --content <content>', description: 'Lesson content' })
  parseContent(val: string) {
    return val;
  }

  @Option({ flags: '-d, --date <date>', description: 'Lesson date (ISO)' })
  parseDate(val: string) {
    return val;
  }
}

@Command({
  name: 'lesson:remove',
  arguments: '<id>',
  description: 'Remove a lesson',
})
export class RemoveLessonCommand extends CommandRunner {
  constructor(
    @Inject('ILessonsService') private readonly lessonsService: ILessonsService,
  ) {
    super();
  }

  async run([id]: string[]): Promise<void> {
    await this.lessonsService.remove(id);
    console.log('Removed lesson with ID:', id);
  }
}

@Command({
  name: 'lesson',
  description: 'Manage lessons'
})
export class LessonCommands extends CommandRunner {
  async run(): Promise<void> {
    console.log(
      'Available subcommands: create, list, get <id>, update <id>, remove <id>',
    );
  }
}
