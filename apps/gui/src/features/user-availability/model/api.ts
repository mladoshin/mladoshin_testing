import axios from "@/shared/api/axios";
import type {
  ICreateUserAvailabilityDto,
  IUpdateUserAvailabilityDto,
  IUserAvailabilityResponse,
} from "@shared/types";

export const userAvailabilityApi = {
  async create(
    data: ICreateUserAvailabilityDto
  ): Promise<IUserAvailabilityResponse> {
    const res = await axios.post(`/user-availability`, data);
    return res.data;
  },
  async update(
    id: string,
    data: IUpdateUserAvailabilityDto
  ): Promise<IUserAvailabilityResponse> {
    const res = await axios.patch(`/user-availability/${id}`, data);
    return res.data;
  },
  async fetchAllByCourse(
    courseId: string
  ): Promise<IUserAvailabilityResponse[]> {
    const res = await axios.get(`/user-availability`, {
      params: {
        course_id: courseId,
      },
    });
    return res.data;
  },
  async fetchOne(id: string): Promise<IUserAvailabilityResponse> {
    const res = await axios.get(`/user-availability/${id}`);
    return res.data;
  },
  async delete(id: string): Promise<IUserAvailabilityResponse> {
    const res = await axios.delete(`/user-availability/${id}`);
    return res.data;
  },
};
