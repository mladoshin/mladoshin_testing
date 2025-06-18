import { create } from "zustand";
import { lessonApi } from "./api";
import { Lesson } from "@/entities/lesson/model/types";
import { LessonAdapter } from "@/entities/lesson/model/adapters";
import type {
  UpdateLessonRequestDto,
  CreateLessonRequestDto,
} from "@shared/types";
import { ValidationError } from "@/shared/api/errors";

interface LessonStore {
  lessons: Lesson[];
  lesson: Lesson | null;
  loading: {
    fetch: boolean;
    update: boolean;
    create: boolean;
    delete: boolean;
  };
  error: {
    fetch: string | null;
    update: string | null;
    create: string | null;
    delete: string | null;
  };
  loadAllCourseLessons: (courseId: string) => Promise<Lesson[]>;
  getLessonById: (id: string) => Promise<Lesson | null>;
  updateLesson(
    lesson: Lesson,
    data: UpdateLessonRequestDto
  ): Promise<Lesson | null>;
  deleteLesson(id: string): Promise<void>;
  createLesson(lessonData: CreateLessonRequestDto): Promise<Lesson | null>;
  setLoading: (
    key: "create" | "delete" | "fetch" | "update",
    value: boolean
  ) => void;
  setError: (
    key: "create" | "delete" | "fetch" | "update",
    value: string | null
  ) => void;
}

export const useLessonStore = create<LessonStore>((set, get) => ({
  lessons: [],
  lesson: null,
  loading: {
    create: false,
    delete: false,
    fetch: false,
    update: false,
  },
  error: {
    create: null,
    delete: null,
    fetch: null,
    update: null,
  },

  setLoading(key: "create" | "delete" | "fetch" | "update", value: boolean) {
    set((state) => ({ loading: { ...state.loading, [key]: value } }));
  },

  setError(
    key: "create" | "delete" | "fetch" | "update",
    value: string | null
  ) {
    set((state) => ({ error: { ...state.error, [key]: value } }));
  },

  async updateLesson(lesson: Lesson, data: UpdateLessonRequestDto) {
    get().setLoading("update", true);
    get().setError("update", null);

    let updatedLesson: Lesson | null = null;
    try {
      const response = await lessonApi.update(lesson.id, data);
      updatedLesson = LessonAdapter.mapFromResponse(response);
      set((state) => ({
        lessons: state.lessons.map((l) =>
          l.id === lesson.id ? (updatedLesson as Lesson) : l
        ),
        lesson: updatedLesson as Lesson,
      }));
    } catch (e: any) {
      if (e instanceof ValidationError) {
        get().setError("update", "Ошибка валидации");
      } else {
        get().setError(
          "update",
          e?.response?.data?.message || "Ошибка при сохранении"
        );
      }
    }
    get().setLoading("update", false);
    return updatedLesson;
  },

  async createLesson(lessonData: CreateLessonRequestDto) {
    get().setLoading("create", true);
    get().setError("create", null);
    let lesson: Lesson | null = null;
    try {
      const response = await lessonApi.create(lessonData);
      lesson = LessonAdapter.mapFromResponse(response);
      set((state) => ({
        lessons: [...state.lessons, lesson as Lesson],
      }));
    } catch (e: any) {
      if (e instanceof ValidationError) {
        get().setError("create", "Ошибка валидации");
      } else {
        get().setError(
          "create",
          e?.response?.data?.message || "Ошибка при создании"
        );
      }
    }
    get().setLoading("create", false);

    return lesson;
  },

  async deleteLesson(id: string) {
    get().setLoading("delete", true);
    get().setError("delete", null);

    try {
      await lessonApi.delete(id);
      set((state) => ({
        lesson: null,
        lessons: state.lessons.filter((l) => l.id !== id),
      }));
    } catch (e: any) {
      get().setError(
        "delete",
        e?.response?.data?.message || "Ошибка при удалении"
      );
    } finally {
      get().setLoading("delete", false);
    }
  },

  async loadAllCourseLessons(courseId: string) {
    get().setLoading("fetch", true);
    get().setError("fetch", null);
    let lessons: Lesson[] = [];
    try {
      const rawLessons = await lessonApi.fetchAll(courseId);
      const mapped = rawLessons.map(LessonAdapter.mapFromResponse);
      set({ lessons: mapped });
      lessons = mapped;
    } catch (e: any) {
      console.error("Ошибка загрузки уроков", e);
      get().setError("fetch", e?.message ?? "Ошибка загрузки урока");
    }
    get().setLoading("fetch", false);
    return lessons;
  },

  async getLessonById(id) {
    let lesson = null;
    get().setLoading("fetch", true);
    try {
      const res = await lessonApi.fetchOneById(id);
      lesson = LessonAdapter.mapFromResponse(res);
    } catch (e: any) {
      console.error(`Ошибка при получении урока ${id}`, e);
      get().setError("fetch", e?.message ?? "Ошибка загрузки урока");
      lesson = null;
    }
    get().setLoading("fetch", false);
    return lesson;
  },
}));
