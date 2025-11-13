export interface CreateCourseRequestDto {
  name: string;
  price: number;
  date_start: string;
  date_finish: string;
}

export interface UpdateCourseRequestDto extends Partial<CreateCourseRequestDto> {}
