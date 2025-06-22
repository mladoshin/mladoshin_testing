import { create } from "zustand";
import { userScheduleApi } from "./api";
import type { UserSchedule } from "@/entities/user-schedule/model/types";
import { UserScheduleAdapter } from "@/entities/user-schedule/model/adapters";
import type {
  ICreateUserScheduleDto,
  IGenerateUserScheduleDto,
} from "@shared/types";
import { ValidationError } from "@/shared/api/errors";

interface UserScheduleStore {
  schedules: UserSchedule[];
  isScheduleGenerated: boolean;
  isScheduleCreated: boolean;
  loading: {
    fetch: boolean;
    generate: boolean;
    delete: boolean;
    create: boolean;
  };
  error: {
    fetch: string | null;
    generate: string | null;
    delete: string | null;
    create: string | null;
  };
  loadByCourse: (courseId: string) => Promise<UserSchedule[]>;
  generate: (data: IGenerateUserScheduleDto) => Promise<UserSchedule[]>;
  create: (data: ICreateUserScheduleDto[]) => Promise<UserSchedule[]>;
  delete: (courseId: string) => Promise<void>;
  setLoading: (key: keyof UserScheduleStore["loading"], value: boolean) => void;
  setError: (
    key: keyof UserScheduleStore["error"],
    value: string | null
  ) => void;
}

export const useUserScheduleStore = create<UserScheduleStore>((set, get) => ({
  schedules: [],
  isScheduleCreated: false,
  isScheduleGenerated: false,
  loading: {
    fetch: false,
    generate: false,
    create: false,
    delete: false,
  },
  error: {
    fetch: null,
    generate: null,
    create: null,

    delete: null,
  },

  setLoading(key, value) {
    set((state) => ({ loading: { ...state.loading, [key]: value } }));
  },

  setError(key, value) {
    set((state) => ({ error: { ...state.error, [key]: value } }));
  },

  async loadByCourse(courseId) {
    get().setLoading("fetch", true);
    get().setError("fetch", null);
    let schedules: UserSchedule[] = [];
    try {
      const data = await userScheduleApi.fetchByCourse(courseId);
      schedules = data.map(UserScheduleAdapter.mapFromResponse);
      set({ schedules, isScheduleCreated: true });
    } catch (e: any) {
      get().setError("fetch", e?.message ?? "Ошибка загрузки расписания");
      set({ isScheduleCreated: false });
    } finally {
      get().setLoading("fetch", false);
    }
    return schedules;
  },

  async generate(data) {
    get().setLoading("generate", true);
    get().setError("generate", null);
    let schedules: UserSchedule[] = [];
    try {
      const res = await userScheduleApi.generate(data);
      schedules = res.map(UserScheduleAdapter.mapFromResponse);
      set({ schedules, isScheduleGenerated: true });
    } catch (e: any) {
      if (e instanceof ValidationError) {
        get().setError("generate", "Ошибка валидации");
      } else {
        get().setError("generate", e?.message ?? "Ошибка генерации расписания");
      }
      set({ isScheduleGenerated: false });
    } finally {
      get().setLoading("generate", false);
    }
    return schedules;
  },

  async create(data) {
    get().setLoading("create", true);
    get().setError("create", null);
    let schedules: UserSchedule[] = [];
    set({ schedules: [] });
    try {
      const res = await userScheduleApi.create(data);
      schedules = res.map(UserScheduleAdapter.mapFromResponse);
      set({ schedules, isScheduleCreated: true });
    } catch (e: any) {
      if (e instanceof ValidationError) {
        get().setError("create", "Ошибка валидации");
      } else {
        get().setError("create", e?.message ?? "Ошибка создания расписания");
      }
    } finally {
      get().setLoading("create", false);
    }
    return schedules;
  },

  async delete(courseId) {
    get().setLoading("delete", true);
    get().setError("delete", null);
    try {
      await userScheduleApi.delete(courseId);
      set((state) => ({
        schedules: [],
        isScheduleCreated: false,
      }));
    } catch (e: any) {
      get().setError("delete", e?.message ?? "Ошибка при удалении");
    } finally {
      get().setLoading("delete", false);
    }
  },
}));
