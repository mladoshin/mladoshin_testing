import axios from "@/shared/api/axios";
import type {
  CreateLessonRequestDto,
  LessonResponse,
  UpdateLessonRequestDto,
} from "@shared/types";

export const lessonApi = {
  async update(
    lessonId: string,
    data: UpdateLessonRequestDto
  ): Promise<LessonResponse> {
    const res = await axios.patch(`/lessons/${lessonId}`, data);
    return res.data;
  },
  async create(data: CreateLessonRequestDto): Promise<LessonResponse> {
    const res = await axios.post(`/lessons`, data);
    return res.data;
  },
  async delete(lessonId: string): Promise<LessonResponse> {
    const res = await axios.delete(`/lessons/${lessonId}`);
    return res.data;
  },
  async fetchAll(lessonId: string): Promise<LessonResponse[]> {
    const res = await axios.get(`/courses/${lessonId}/lessons`);
    return res.data;
  },
  async fetchOneById(lessonId: string): Promise<LessonResponse> {
    const res = await axios.get(`/lessons/${lessonId}`);
    return res.data;
  },
};
