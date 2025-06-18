import { create } from "zustand";
import type { Course } from "@/entities/course/model/types";
import { courseApi } from "./api";
import { CourseAdapter } from "@/entities/course/model/adapters";
import type {
  CreateCourseRequestDto,
  UpdateCourseRequestDto,
} from "@shared/types";
import { ValidationError } from "@/shared/api/errors";

interface CourseStore {
  allCourses: Course[];
  course: Course | null;
  loading: {
    fetch: boolean;
    update: boolean;
    create: boolean;
    delete: boolean;
    register: boolean;
    purchase: boolean;
  };
  error: {
    fetch: string | null;
    update: string | null;
    create: string | null;
    delete: string | null;
    register: string | null;
    purchase: string | null;
  };
  loadAllCourses: () => Promise<void>;
  getCourseById: (id: string) => Promise<Course | null>;
  registerForCourse(courseId: string): Promise<void>;
  purchaseCourse(courseId: string): Promise<void>;
  createCourse(data: CreateCourseRequestDto): Promise<Course | null>;
  updateCourse(
    courseId: string,
    data: UpdateCourseRequestDto
  ): Promise<Course | null>;
  deleteCourse(courseId: string): Promise<Course | null>;
  setLoading: (
    key: "create" | "delete" | "fetch" | "update" | "register" | "purchase",
    value: boolean
  ) => void;
  setError: (
    key: "create" | "delete" | "fetch" | "update" | "register" | "purchase",
    value: string | null
  ) => void;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  allCourses: [],
  course: null,
  loading: {
    fetch: false,
    update: false,
    create: false,
    delete: false,
    register: false,
    purchase: false,
  },
  error: {
    fetch: null,
    update: null,
    create: null,
    delete: null,
    register: null,
    purchase: null,
  },

  setLoading(
    key: "create" | "delete" | "fetch" | "update" | "register" | "purchase",
    value: boolean
  ) {
    set((state) => ({ loading: { ...state.loading, [key]: value } }));
  },

  setError(
    key: "create" | "delete" | "fetch" | "update" | "register" | "purchase",
    value: string | null
  ) {
    set((state) => ({ error: { ...state.error, [key]: value } }));
  },

  async createCourse(data: CreateCourseRequestDto) {
    get().setLoading("create", true);
    get().setError("create", null);
    let course: Course | null = null;
    try {
      const response = await courseApi.create(data);
      course = CourseAdapter.mapFromResponse(response);
      set((state) => ({
        allCourses: [...state.allCourses, course as Course],
        course: course,
      }));
    } catch (e: any) {
      console.error("Ошибка загрузки курсов", e);
      if (e instanceof ValidationError) {
        get().setError("create", "Ошибка валидации");
      } else {
        get().setError(
          "create",
          e?.response?.data?.message || "Ошибка при создании курса"
        );
      }
    } finally {
      get().setLoading("create", false);
    }
    return course;
  },

  async updateCourse(courseId: string, data: UpdateCourseRequestDto) {
    get().setLoading("update", true);
    get().setError("update", null);
    let course: Course | null = null;
    try {
      const response = await courseApi.update(courseId, data);
      course = CourseAdapter.mapFromResponse(response);
      set((state) => ({
        allCourses: state.allCourses.map((c) =>
          c.id === courseId ? (course as Course) : c
        ),
        course: course as Course,
      }));
    } catch (e: any) {
      console.error("Ошибка загрузки курсов", e);
      if (e instanceof ValidationError) {
        get().setError("update", "Ошибка валидации");
      } else {
        get().setError(
          "update",
          e?.response?.data?.message || "Ошибка при сохранении курса"
        );
      }
    } finally {
      get().setLoading("update", false);
    }
    return course;
  },

  async deleteCourse(courseId: string) {
    get().setLoading("delete", true);
    get().setError("delete", null);
    let course: Course | null = null;
    try {
      const response = await courseApi.delete(courseId);
      course = CourseAdapter.mapFromResponse(response);
      set((state) => ({
        allCourses: state.allCourses.filter((c) => c.id !== courseId),
        course: null,
      }));
    } catch (e: any) {
      console.error("Ошибка удаления курса", e);
      get().setError("create", e?.message ?? "Ошибка удаления курса");
    } finally {
      get().setLoading("delete", false);
    }
    return course;
  },

  async loadAllCourses() {
    get().setLoading("fetch", true);
    get().setError("fetch", null);
    try {
      const rawCourses = await courseApi.fetchAll();
      const mapped = rawCourses.map(CourseAdapter.mapFromResponse);
      set({ allCourses: mapped });
    } catch (e: any) {
      console.error("Ошибка загрузки курсов", e);
      get().setError("fetch", e?.message ?? "Ошибка загрузки курсов");
    } finally {
      get().setLoading("fetch", false);
    }
  },

  async registerForCourse(courseId: string) {
    try {
      get().setLoading("register", true);
      get().setError("register", null);

      await courseApi.register(courseId);
      // После регистрации можно обновить список курсов или текущий курс
      const updatedCourse = await get().getCourseById(courseId);
      if (updatedCourse) {
        set((state) => ({
          allCourses: state.allCourses.map((c) =>
            c.id === courseId ? updatedCourse : c
          ),
          course: updatedCourse,
        }));
      }
    } catch (e: any) {
      console.error(`Ошибка при регистрации на курс ${courseId}`, e);
      get().setError("register", e?.message ?? "Ошибка регистрации на курс");
    }
    get().setLoading("register", false);
  },

  async purchaseCourse(courseId: string) {
    try {
      get().setLoading("purchase", true);
      get().setError("purchase", null);

      await courseApi.purchase(courseId);
      // После регистрации можно обновить список курсов или текущий курс
      const updatedCourse = await get().getCourseById(courseId);
      if (updatedCourse) {
        set((state) => ({
          allCourses: state.allCourses.map((c) =>
            c.id === courseId ? updatedCourse : c
          ),
          course: updatedCourse,
        }));
      }
    } catch (e: any) {
      console.error(`Ошибка при покупке курса ${courseId}`, e);
      get().setError("purchase", e?.message ?? "Ошибка покупки курса");
    }
    get().setLoading("purchase", false);
  },

  async getCourseById(id) {
    get().setLoading("fetch", true);
    get().setError("fetch", null);
    let course: Course | null = null;
    try {
      const res = await courseApi.fetchOneById(id);
      course = CourseAdapter.mapFromResponse(res);
      set({ course: course });
    } catch (e: any) {
      console.error(`Ошибка при получении курса ${id}`, e);
      get().setError("fetch", e?.message ?? "Ошибка загрузки курса");
    } finally {
      get().setLoading("fetch", false);
    }
    return course;
  },
}));
