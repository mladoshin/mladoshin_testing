import { useUserAvailabilityStore } from "@/features/user-availability/model/store";
import { Button } from "@/shared/ui/Button";
import UserAvailabilitySlot, {
  UserAvailabilitySlotState,
} from "@/widgets/UserAvailabilitySlot/UserAvailabilitySlot";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  ICreateUserAvailabilityDto,
  ICreateUserScheduleDto,
  IUpdateUserAvailabilityDto,
} from "@shared/types";
import classNames from "classnames";
import React, { useEffect, useState } from "react";

export interface UserAvailability {
  id: string;
  weekDay: number;
  startTime: string;
  endTime: string;
}

const weekDays = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

interface UserAvailabilityEditorProps {
  courseId: string;
}

export default function UserAvailabilityForm({
  courseId,
}: UserAvailabilityEditorProps) {
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

  return (
    <div className="overflow-x-auto text-black">
      <div className="grid grid-cols-7 min-w-[1750px]">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={classNames(
              "p-4 w-[250px] border-gray-200 border-r-2 border-t-2 border-b-2",
              index === 0 && "border-l-2"
            )}
          >
            <h4 className="font-semibold mb-2 text-center">{day}</h4>
            {availabilities
              .filter((slot) => slot.weekDay === index)
              .map((slot) => (
                <UserAvailabilitySlot
                  key={slot.id}
                  slot={slot}
                  onDelete={() => onDelete(slot)}
                  onSave={(data) => onSave(slot, data)}
                />
              ))}
            <Button
              onClick={() => onAddEmptySlot(index)}
              iconLeft={<PlusIcon />}
              className="text-blue-600 text-sm !mt-4"
            >
              Добавить слот
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
