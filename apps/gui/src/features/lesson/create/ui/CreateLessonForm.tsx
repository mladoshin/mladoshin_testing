import { useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Lesson } from "@/entities/lesson/model/types";
import { Input } from "@/shared/ui/Input";
import { TextArea } from "@/shared/ui/TextArea/TextArea";
import { Button } from "@/shared/ui/Button";
import { Course } from "@/entities/course/model/types";
import { useCreateLessonFormModel } from "../model/model";

interface LessonFormProps {
  course: Course;
  onClose: () => void;
}

export const CreateLessonForm: React.FC<LessonFormProps> = ({
  course,
  onClose,
}) => {
  const { createLesson, loading, error } = useCreateLessonFormModel();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState("");

  const handleSave = async () => {
    debugger;
    const lesson = await createLesson({
      course_id: course.id,
      title,
      content,
      date: new Date(date).toISOString(),
    });
    if (lesson) {
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error.create}</div>}

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        label="Название"
        placeholder="Введите название урока"
        type="text"
      />

      <Input
        value={date}
        onChange={(e) => setDate(e.target.value)}
        label="Дата"
        placeholder="Введите дату урока"
        type="date"
      />

      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        label="Контент"
        placeholder="Введите текст урока"
      />

      <div className="flex justify-between pt-2">
        <Button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm !w-[160px]"
          disabled={loading.create}
          loading={loading.create}
        >
          Создать
        </Button>
      </div>
    </div>
  );
};
