import {
  ICreateUserAvailabilityDto,
  IUpdateUserAvailabilityDto,
} from "@shared/types";
import { useUserAvailabilityStore } from "../../model/store";
import { UserAvailability } from "../ui/UserAvailabilityForm";
import { UserAvailabilitySlotState } from "@/widgets/UserAvailabilitySlot/UserAvailabilitySlot";
import { useEffect } from "react";

interface UseUserAvailabilityFormModelProps {
  courseId: string;
}

export function useUserAvailabilityFormModel({
  courseId,
}: UseUserAvailabilityFormModelProps) {
  const {
    availabilities,
    loadAllSlots,
    createSlot,
    updateSlot,
    deleteSlot,
    onAddEmptySlot,
    deleteFromState,
  } = useUserAvailabilityStore();

  useEffect(() => {
    if (!courseId) return;
    loadAllSlots(courseId);
  }, [courseId]);

  const onSave = async (
    slot: UserAvailability,
    data: UserAvailabilitySlotState
  ) => {
    const slotData: ICreateUserAvailabilityDto | IUpdateUserAvailabilityDto = {
      course_id: courseId,
      week_day: slot.weekDay,
      start_time: data.startTime,
      end_time: data.endTime,
    };
    if (slot.id.includes("new")) {
      await createSlot(slotData as ICreateUserAvailabilityDto);
      deleteFromState(slot.id);
    } else {
      await updateSlot(slot.id, slotData as IUpdateUserAvailabilityDto);
    }
    return slot;
  };

  const onDelete = async (slot: UserAvailability) => {
    let result: UserAvailability | null;
    if (slot.id.includes("new")) {
      result = deleteFromState(slot.id);
    } else {
      result = await deleteSlot(slot.id);
    }
    return result;
  };

  return { availabilities, onSave, onDelete, onAddEmptySlot };
}
