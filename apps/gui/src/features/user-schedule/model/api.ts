import axios from "@/shared/api/axios";
import type {
  ICreateUserScheduleDto,
  IGenerateUserScheduleDto,
  IUserScheduleResponseDto,
} from "@shared/types";

export const userScheduleApi = {
  async generate(
    data: IGenerateUserScheduleDto
  ): Promise<IUserScheduleResponseDto[]> {
    const res = await axios.post(`/user-schedule/generate`, data);
    return res.data;
  },
  async create(
    data: ICreateUserScheduleDto[]
  ): Promise<IUserScheduleResponseDto[]> {
    const res = await axios.post(`/user-schedule`, { data });
    return res.data;
  },
  async fetchByCourse(courseId: string): Promise<IUserScheduleResponseDto[]> {
    const res = await axios.get(`/user-schedule`, {
      params: {
        course_id: courseId,
      },
    });
    return res.data;
  },
  async delete(courseId: string): Promise<void> {
    const res = await axios.delete(`/user-schedule`, {
      params: {
        course_id: courseId,
      },
    });
    return res.data;
  },
};
