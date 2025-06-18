import React from "react";
import { Modal } from "@/shared/ui/Modal";
import { EditCourseForm } from "@/features/course/edit/ui/EditCourseForm";
import { Course } from "@/entities/course/model/types";

interface EditCourseModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

export const EditCourseAdminModal: React.FC<EditCourseModalProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактирование курса">
      <EditCourseForm onClose={onClose} course={course} />
    </Modal>
  );
};
