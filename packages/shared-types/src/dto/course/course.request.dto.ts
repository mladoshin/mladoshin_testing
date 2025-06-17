export interface CreateCourseDto {
  name: string;
  price: number;
  date_start: string;
  date_finish: string;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {}
