import axios from "@/shared/api/axios";
import type { LessonResponse } from "@shared/types";

export const lessonApi = {
  async fetchAll(courseId: string): Promise<LessonResponse[]> {
    const res = await axios.get(`/courses/${courseId}/lessons`);
    return res.data;
  },
  async fetchOneById(lessonId: string): Promise<LessonResponse> {
    const res = await axios.get(`/lessons/${lessonId}`);
    return res.data;
  }
};
