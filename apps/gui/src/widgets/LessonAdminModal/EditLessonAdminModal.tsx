import React from "react";
import { Lesson } from "@/entities/lesson/model/types";
import { Modal } from "@/shared/ui/Modal";
import { EditLessonForm } from "@/features/lesson/edit";

interface EditLessonModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
}

export const EditLessonAdminModal: React.FC<EditLessonModalProps> = ({
  lesson,
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактирование урока">
      <EditLessonForm onClose={onClose} lesson={lesson} />
    </Modal>
  );
};
