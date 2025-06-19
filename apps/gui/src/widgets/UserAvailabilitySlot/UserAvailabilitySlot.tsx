import { UserAvailability } from "@/entities/user-availability/model/types";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { Input } from "@/shared/ui/Input";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import React, { useState } from "react";

interface UserAvailabilitySlotProps {
  slot: UserAvailability;
  onDelete(): Promise<UserAvailability | null>;
  onSave(data: UserAvailabilitySlotState): Promise<UserAvailability | null>;
}

export interface UserAvailabilitySlotState {
  startTime: string;
  endTime: string;
}

function UserAvailabilitySlot({
  slot,
  onSave,
  onDelete,
}: UserAvailabilitySlotProps) {
  const isSynced = !slot?.id.includes("new.");
  const [startTime, setStartTime] = useState<string>(slot.startTime);
  const [endTime, setEndTime] = useState<string>(slot.endTime);

  const _onSave = async () => {
    onSave({
      startTime,
      endTime,
    });
  };

  return (
    <div
      key={slot.id}
      className="flex flex-col gap-1 mb-2 bg-white p-2 rounded shadow-lg"
    >
      <Input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        className="rounded border px-2 py-1"
      />
      <Input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        className="rounded border px-2 py-1"
      />
      <div className="flex flex-row justify-between items-center gap-4">
        <IconButton
          icon={<TrashIcon />}
          className="text-red-500 !w-9 !h-9 !min-w-9"
          onClick={onDelete}
        />
        <Button
          iconLeft={isSynced ? null : <PlusIcon />}
          onClick={() => _onSave()}
          className={classNames(
            "text-sm",
            isSynced ? "bg-blue-500" : "bg-gray-200 !text-gray-800 hover:bg-gray-300"
          )}
        >
          {isSynced ? "Обновить" : "Добавить"}
        </Button>
      </div>
    </div>
  );
}

export default UserAvailabilitySlot;
