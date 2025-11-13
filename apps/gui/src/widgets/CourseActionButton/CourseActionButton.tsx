import { Course } from "@/entities/course/model/types";
import { CourseEnrollmentStatus } from "@shared/types";
import React from "react";
import { Link } from "react-router-dom";
import { useCourseActionButtonModel } from "./model";
import { Button } from "@/shared/ui/Button";

interface CourseActionButtonProps {
  course: Course;
  handleAction?: (
    courseId: string,
    action: "register" | "pay"
  ) => Promise<void>;
}

export const CourseActionButton: React.FC<CourseActionButtonProps> = ({
  course,
  handleAction,
}) => {
  const {
    loading,
    handlePayButtonClick,
    handleRegisterButtonClick,
    handleOpenButtonClick,
  } = useCourseActionButtonModel({ handleAction });

  if (course.enrollment_status === CourseEnrollmentStatus.PAID) {
    return (
      <Button
        onClick={(e) => {
          e.stopPropagation(); // ❗️ остановка всплытия
          handleOpenButtonClick(course.id);
        }}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Перейти
      </Button>
    );
  } else if (course.enrollment_status === CourseEnrollmentStatus.NEW) {
    return (
      <Button
        loading={loading.pay}
        onClick={(e) => {
          e.stopPropagation(); // ❗️ остановка всплытия
          handlePayButtonClick(course.id);
        }}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Оплатить {course.price} ₽
      </Button>
    );
  }

  return (
    <Button
      loading={loading.register}
      onClick={(e) => {
        e.stopPropagation(); // ❗️ остановка всплытия
        handleRegisterButtonClick(course.id);
      }}
      className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Записаться
    </Button>
  );
};
