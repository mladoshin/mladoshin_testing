import axios from "@/shared/api/axios";
import type { CourseResponse, CourseEnrollmentResponse, CreateCourseRequestDto, UpdateCourseRequestDto } from "@shared/types";

export const courseApi = {
  async fetchAll(): Promise<CourseResponse[]> {
    const res = await axios.get("/courses");
    return res.data;
  },
  async create(data: CreateCourseRequestDto): Promise<CourseResponse> {
    const res = await axios.post("/courses", data);
    return res.data;
  },
  async update(courseId: string, data: UpdateCourseRequestDto): Promise<CourseResponse> {
    const res = await axios.patch(`/courses/${courseId}`, data);
    return res.data;
  },
  async delete(courseId: string): Promise<CourseResponse> {
    const res = await axios.delete(`/courses/${courseId}`);
    return res.data;
  },
  async register(courseId: string): Promise<CourseEnrollmentResponse> {
    const res = await axios.post(`/courses/${courseId}/register`);
    return res.data;
  },
  async purchase(courseId: string): Promise<void> {
    const res = await axios.post(`/courses/${courseId}/pay`);
    return res.data;
  },
  async fetchOneById(courseId: string): Promise<CourseResponse> {
    const res = await axios.get(`/courses/${courseId}`);
    return res.data;
  },
};
