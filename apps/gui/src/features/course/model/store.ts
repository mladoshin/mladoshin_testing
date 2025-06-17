import { create } from "zustand";
import type { Course } from "@/entities/course/model/types";
import { courseApi } from "./api";
import { CourseAdapter } from "@/entities/course/model/adapters";
import { c } from "node_modules/vite/dist/node/moduleRunnerTransport.d-DJ_mE5sf";

interface CourseStore {
  allCourses: Course[];
  course: Course | null;
  loading: boolean;
  error: string | null;
  loadAllCourses: () => Promise<void>;
  getCourseById: (id: string) => Promise<Course | null>;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  allCourses: [],
  course: null,
  loading: false,
  error: null,

  async loadAllCourses() {
    set({ loading: true });
    try {
      const rawCourses = await courseApi.fetchAll();
      const mapped = rawCourses.map(CourseAdapter.mapFromResponse);
      set({ allCourses: mapped });
    } catch (e: any) {
      console.error("Ошибка загрузки курсов", e);
      set({ error: e?.message ?? "Ошибка загрузки курсов" });
    } finally {
      set({ loading: false });
    }
  },

  async registerForCourse(courseId: string) {
    try {
      set({ loading: true });
      await courseApi.register(courseId);
      // После регистрации можно обновить список курсов или текущий курс
      const updatedCourse = await get().getCourseById(courseId);
      if (updatedCourse) {
        set((state) => ({
          allCourses: state.allCourses.map((c) =>
            c.id === courseId ? updatedCourse : c
          ),
          course: updatedCourse,
          error: null,
        }));
      }
    } catch (e: any) {
      console.error(`Ошибка при регистрации на курс ${courseId}`, e);
      set({ error: e?.message ?? "Ошибка регистрации на курс" });
    }
  },

  async getCourseById(id) {
    try {
      const res = await courseApi.fetchOneById(id);
      return CourseAdapter.mapFromResponse(res);
    } catch (e: any) {
      console.error(`Ошибка при получении курса ${id}`, e);
      set({ error: e?.message ?? "Ошибка загрузки курсов" });
      return null;
    }
  },
}));
