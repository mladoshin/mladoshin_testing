import React from "react";
import { useCourseScheduleModel } from "./model";
import { UserScheduleItem } from "@/entities/user-schedule/ui/UserScheduleItem";
import { SpinnerIcon } from "@/shared/ui/SpinnerIcon";
import { Button } from "@/shared/ui/Button";
import { TrashIcon } from "@heroicons/react/24/outline";

interface CourseScheduleProps {
  courseId: string;
}

function CourseSchedule({ courseId }: CourseScheduleProps) {
  const {
    schedules,
    loading,
    isScheduleCreated,
    isScheduleGenerated,
    generate,
    create,
    deleteSchedule,
  } = useCourseScheduleModel({ courseId });

  if (loading.fetch) {
    return (
      <div className="flex flex-col gap-3 items-center justify-center">
        <SpinnerIcon className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-5">
      {schedules?.length === 0 && (
        <div className="flex flex-row items-center gap-5 ">
          <p className="text-gray-500">Нет доступного расписания</p>
          <Button
            className="text-sm !w-[200px]"
            loading={loading.generate}
            onClick={generate}
          >
            Составить расписание
          </Button>
        </div>
      )}

      {schedules?.map((s) => <UserScheduleItem key={s.id} item={s} />)}

      {isScheduleGenerated && !isScheduleCreated && (
        <Button
          className="text-sm !w-[200px] mt-5"
          onClick={create}
          loading={loading.create}
        >
          Сохранить расписание
        </Button>
      )}

      {isScheduleCreated && (
        <button
          onClick={deleteSchedule}
          className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm cursor-pointer mt-5"
          disabled={loading.delete}
        >
          <TrashIcon className="w-5 h-5" />
          Удалить расписание
        </button>
      )}
    </div>
  );
}

export default CourseSchedule;
