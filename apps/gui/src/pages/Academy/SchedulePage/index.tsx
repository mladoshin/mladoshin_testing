import UserAvailabilityForm from "@/features/user-availability/edit/ui/UserAvailabilityForm";
import { AcademyLayout } from "@/layouts/AcademyLayout/AcademyLayout";
import React from "react";
import { useParams } from "react-router-dom";

function SchedulePage() {
  const { id = "" } = useParams();
  return (
    <AcademyLayout>
      <h2 className="text-2xl font-bold text-black mb-5">
        Ваши свободные слоты в течении курса
      </h2>

      <UserAvailabilityForm courseId={id} />

      <h2 className="text-2xl font-bold text-black mt-10 nb-5">
        Персональное расписание
      </h2>
    </AcademyLayout>
  );
}

export default SchedulePage;
