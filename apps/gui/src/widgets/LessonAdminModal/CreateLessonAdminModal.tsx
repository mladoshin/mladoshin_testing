import React from "react";
import { Modal } from "@/shared/ui/Modal";
import { Course } from "@/entities/course/model/types";
import { CreateLessonForm } from "@/features/lesson/create/ui/CreateLessonForm";

interface CreateLessonModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLessonAdminModal: React.FC<CreateLessonModalProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создание урока">
      <CreateLessonForm onClose={onClose} course={course} />
    </Modal>
  );
};
