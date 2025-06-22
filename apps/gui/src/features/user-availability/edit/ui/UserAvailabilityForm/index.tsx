import { Button } from "@/shared/ui/Button";
import UserAvailabilitySlot from "@/widgets/UserAvailabilitySlot/UserAvailabilitySlot";
import { PlusIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import { useUserAvailabilityFormModel } from "../../model/model";
import { weekDays } from "@/shared/constants";

export interface UserAvailability {
  id: string;
  weekDay: number;
  startTime: string;
  endTime: string;
}

interface UserAvailabilityEditorProps {
  courseId: string;
}

export default function UserAvailabilityForm({
  courseId,
}: UserAvailabilityEditorProps) {
  const { availabilities, onAddEmptySlot, onDelete, onSave } =
    useUserAvailabilityFormModel({ courseId });

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
