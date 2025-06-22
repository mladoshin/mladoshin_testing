import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { UserSchedule } from './entities/user-schedule.entity';
import { GenerateUserScheduleDto } from './dto/generate-user-schedule.dto';
import { UserScheduleDomain } from './domains/user-schedule.domain';
import { GenerateUserScheduleResponseDto } from './dto/generate-schedule-response.dto';
import { UserScheduleMapper } from './user-schedule.mapper';
import { Course } from '../courses/entities/course.entity';
import { CreateUserScheduleDto } from './dto/create-user-schedule.dto';

export interface IUserScheduleRepo {
  generate(userId: string, courseId: string): Promise<UserScheduleDomain[]>;
  create(
    userId: string,
    dataItems: CreateUserScheduleDto[],
  ): Promise<UserScheduleDomain[]>;
  getByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<UserScheduleDomain[]>;
  deleteByUserAndCourse(userId: string, courseId: string): Promise<boolean>;
}

@Injectable()
export class UserScheduleRepo implements IUserScheduleRepo {
  constructor(
    @InjectRepository(UserSchedule)
    private readonly repository: Repository<UserSchedule>,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {
    // this.generate(
    //   'fe045e65-5d45-4165-925d-a48c809779e9',
    //   'd279f85c-9eda-469c-9e26-de79dce92638',
    // ).then((res) => console.log(res));
  }

  async generate(
    userId: string,
    courseId: string,
  ): Promise<UserScheduleDomain[]> {
    const doesCourseExist = await this.dataSource
      .getRepository(Course)
      .existsBy({ id: courseId });
    if (!doesCourseExist) {
      throw new RepositoryNotFoundError('Такого курса нет.', Course.name);
    }
    const result: GenerateUserScheduleResponseDto[] =
      await this.dataSource.query(
        `SELECT *, l.title, l.date, l.duration FROM pick_student_schedule($1::uuid, $2::uuid) as s
        JOIN course_lesson l ON l.id = s.lesson_id;`,
        [userId, courseId],
      );
    return result.map((item) =>
      UserScheduleMapper.fromFunctionToDomainEntity(item, courseId, userId),
    );
  }

  async getByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<UserScheduleDomain[]> {
    const doesCourseExist = await this.dataSource
      .getRepository(Course)
      .existsBy({ id: courseId });
    if (!doesCourseExist) {
      throw new RepositoryNotFoundError('Такого курса нет.', Course.name);
    }

    const rawEntities = await this.repository.find({
      where: { user_id: userId, course_id: courseId },
      order: { scheduled_date: 'ASC', start_time: 'asc' },
      relations: { lesson: true },
    });
    if (rawEntities.length === 0) {
      throw new RepositoryNotFoundError(
        'Расписание на курсе не найдено.',
        UserSchedule.name,
      );
    }

    return rawEntities.map(UserScheduleMapper.toDomainEntity);
  }

  async deleteByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<boolean> {
    const doesCourseExist = await this.dataSource
      .getRepository(Course)
      .existsBy({ id: courseId });
    if (!doesCourseExist) {
      throw new RepositoryNotFoundError('Такого курса нет.', Course.name);
    }

    await this.repository.delete({
      course_id: courseId,
      user_id: userId,
    });

    return true;
  }

  async create(
    userId: string,
    dataItems: CreateUserScheduleDto[],
  ): Promise<UserScheduleDomain[]> {
    const entities = this.repository.create(
      dataItems.map((di) => ({ ...di, user_id: userId })),
    );
    const rawEntities = await this.repository.save(entities);
    const ids = rawEntities.map((e) => e.id);
    const entitiesWithLessons = await this.repository.find({
      where: { id: In(ids) },
      relations: { lesson: true },
    });
    return entitiesWithLessons.map(UserScheduleMapper.toDomainEntity);
  }
}
