import { create } from "zustand";
import { userAvailabilityApi } from "./api";
import type { UserAvailability } from "@/entities/user-availability/model/types";
import type {
  ICreateUserAvailabilityDto,
  IUpdateUserAvailabilityDto,
} from "@shared/types";
import { ValidationError } from "@/shared/api/errors";
import { UserAvailabilityAdapter } from "@/entities/user-availability/model/adapters";

interface UserAvailabilityStore {
  availabilities: UserAvailability[];
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
  loadAllSlots: (courseId: string) => Promise<UserAvailability[]>;
  createSlot: (
    data: ICreateUserAvailabilityDto
  ) => Promise<UserAvailability | null>;
  updateSlot: (
    id: string,
    data: IUpdateUserAvailabilityDto
  ) => Promise<UserAvailability | null>;
  deleteSlot: (id: string) => Promise<UserAvailability | null>;
  setLoading: (
    key: "create" | "delete" | "fetch" | "update",
    value: boolean
  ) => void;
  setError: (
    key: "create" | "delete" | "fetch" | "update",
    value: string | null
  ) => void;
  onAddEmptySlot(weekDay: number): void;
  deleteFromState(id: string): UserAvailability | null;
}

export const useUserAvailabilityStore = create<UserAvailabilityStore>(
  (set, get) => ({
    availabilities: [],
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

    setLoading(key, value) {
      set((state) => ({ loading: { ...state.loading, [key]: value } }));
    },

    setError(key, value) {
      set((state) => ({ error: { ...state.error, [key]: value } }));
    },

    deleteFromState(id: string) {
      const result: UserAvailability | null =
        get().availabilities.find((a) => a.id === id) ?? null;

      set((state) => ({
        availabilities: state.availabilities.filter((a) => a.id !== id),
      }));
      return result;
    },

    onAddEmptySlot(weekDay: number) {
      const emptySlot: UserAvailability = {
        id: `new.${Date.now()}`,
        startTime: "00:00",
        endTime: "00:00",
        weekDay,
      };
      set((state) => ({
        availabilities: [...state.availabilities, emptySlot],
      }));
    },

    async loadAllSlots(courseId) {
      get().setLoading("fetch", true);
      get().setError("fetch", null);
      let availabilities = [] as UserAvailability[];
      try {
        const data = await userAvailabilityApi.fetchAllByCourse(courseId);
        availabilities = data.map(UserAvailabilityAdapter.mapFromResponse);
        set({ availabilities: availabilities });
      } catch (e: any) {
        get().setError("fetch", e?.message ?? "Ошибка загрузки слотов");
      } finally {
        get().setLoading("fetch", false);
      }
      return availabilities;
    },

    async createSlot(data) {
      get().setLoading("create", true);
      get().setError("create", null);
      let availability: UserAvailability | null = null;
      try {
        const result = await userAvailabilityApi.create(data);
        availability = UserAvailabilityAdapter.mapFromResponse(result);
        set((state) => ({
          availabilities: [
            ...state.availabilities,
            availability as UserAvailability,
          ],
        }));
      } catch (e: any) {
        if (e instanceof ValidationError) {
          get().setError("create", "Ошибка валидации");
        } else {
          get().setError("create", e?.message ?? "Ошибка при создании");
        }
        return null;
      } finally {
        get().setLoading("create", false);
      }
      return availability;
    },

    async updateSlot(id, data) {
      get().setLoading("update", true);
      get().setError("update", null);
      let availability: UserAvailability | null = null;
      try {
        const result = await userAvailabilityApi.update(id, data);
        availability = UserAvailabilityAdapter.mapFromResponse(result);
        set((state) => ({
          availabilities: state.availabilities.map((a) =>
            a.id === id ? (availability as UserAvailability) : a
          ),
        }));
      } catch (e: any) {
        if (e instanceof ValidationError) {
          get().setError("update", "Ошибка валидации");
        } else {
          get().setError("update", e?.message ?? "Ошибка при обновлении");
        }
      } finally {
        get().setLoading("update", false);
      }
      return availability;
    },

    async deleteSlot(id) {
      get().setLoading("delete", true);
      get().setError("delete", null);
      let availability: UserAvailability | null = null;
      try {
        const result = await userAvailabilityApi.delete(id);
        availability = UserAvailabilityAdapter.mapFromResponse(result);
        set((state) => ({
          availabilities: state.availabilities.filter((a) => a.id !== id),
        }));
      } catch (e: any) {
        get().setError("delete", e?.message ?? "Ошибка при удалении");
      } finally {
        get().setLoading("delete", false);
      }
      return availability;
    },
  })
);
