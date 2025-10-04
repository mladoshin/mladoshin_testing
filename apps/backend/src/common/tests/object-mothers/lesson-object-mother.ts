import { CreateLessonDto } from 'src/modules/lessons/dto/create-lesson.dto';
import { UpdateLessonDto } from 'src/modules/lessons/dto/update-lesson.dto';
import { v4 as uuidv4 } from 'uuid';

export class CourseLessonObjectMother {
  static buildCreateDto(overrides?: Partial<CreateLessonDto>): CreateLessonDto {
    const dto: CreateLessonDto = {
      content: 'Lesson content',
      date: '2025-01-01T18:37:00',
      duration: 60,
      title: 'Название урока',
      course_id: uuidv4(),
      ...overrides,
    };

    return dto;
  }

  static buildUpdateDto(overrides?: Partial<UpdateLessonDto>): UpdateLessonDto {
    const dto: UpdateLessonDto = {
      title: 'Updated title',
      ...overrides,
    };

    return dto;
  }
}
