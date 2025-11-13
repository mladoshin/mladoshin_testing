import { UserScheduleAdapter } from "@/entities/user-schedule/model/adapters";
import { useUserScheduleStore } from "@/features/user-schedule/model/store";
import { useEffect } from "react";

interface UseCourseScheduleModelProps {
  courseId: string;
}
export function useCourseScheduleModel({
  courseId,
}: UseCourseScheduleModelProps) {
  const model = useUserScheduleStore();

  useEffect(() => {
    model.loadByCourse(courseId);
  }, [courseId]);

  const generateSchedule = () => {
    model.generate({ course_id: courseId });
  };

  const createSchedule = () => {
    const dto = model.schedules.map(UserScheduleAdapter.mapToDto);
    model.create(dto);
  };

  const deleteSchedule = () => {
    model.delete(courseId);
  };

  return {
    ...model,
    generate: generateSchedule,
    create: createSchedule,
    deleteSchedule,
  };
}
