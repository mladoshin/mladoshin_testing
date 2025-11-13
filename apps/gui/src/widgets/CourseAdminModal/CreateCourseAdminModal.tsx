import React from "react";
import { Modal } from "@/shared/ui/Modal";
import { CreateCourseForm } from "@/features/course/create/ui/CreateCourseForm";

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCourseAdminModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создание курса">
      <CreateCourseForm onClose={onClose} />
    </Modal>
  );
};
