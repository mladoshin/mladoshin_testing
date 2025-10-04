import { LoginUserDto } from 'src/modules/auth/dto/login.dto';
import { RegisterUserDto } from 'src/modules/auth/dto/register.dto';
import { CreateCourseDto } from 'src/modules/courses/dto/create-course.dto';
import { UpdateCourseDto } from 'src/modules/courses/dto/update-course.dto';

export class CourseObjectMother {
  static buildCreateDto(
    overrides?: Partial<CreateCourseDto>,
  ): CreateCourseDto {
    const dto: CreateCourseDto = {
      name: 'Course Name',
      date_start: '2025-01-01T18:37:00',
      date_finish: '2025-01-01T18:37:00',
      price: 100,
      ...overrides,
    };

    return dto;
  }

  static buildUpdateDto(overrides?: Partial<UpdateCourseDto>): UpdateCourseDto {
    const dto: UpdateCourseDto = {
      name: 'Updated Name',
      ...overrides,
    };

    return dto;
  }
}
