import { useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Lesson } from "@/entities/lesson/model/types";
import { useEditLessonFormModel } from "../model/model";
import { Input } from "@/shared/ui/Input";
import { TextArea } from "@/shared/ui/TextArea/TextArea";
import { Button } from "@/shared/ui/Button";

interface LessonFormProps {
  lesson: Lesson;
  onClose: () => void;
}

export const EditLessonForm: React.FC<LessonFormProps> = ({
  lesson,
  onClose,
}) => {
  const [title, setTitle] = useState(lesson.title);
  const [date, setDate] = useState(
    new Date(lesson.date).toISOString().slice(0, 10)
  );
  const [duration, setDuration] = useState(lesson.duration);
  const [content, setContent] = useState(lesson.content);

  const { updateLesson, deleteLesson, loading, error } =
    useEditLessonFormModel();

  const handleSave = async () => {
    const updatedLesson = await updateLesson(lesson, {
      title,
      content,
      date: new Date(date).toISOString(),
      duration,
    });
    if (updatedLesson) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (confirm("Удалить урок?")) {
      await deleteLesson(lesson.id);
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error.update}</div>}

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

      <Input
        min={0}
        value={duration}
        onChange={(e) => setDuration(+e.target.value)}
        label="Длительность, мин"
        placeholder="Введите длительность урока"
        type="number"
      />

      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        label="Контент"
        placeholder="Введите текст урока"
      />

      <div className="flex justify-between pt-2">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm cursor-pointer"
          disabled={loading.delete}
        >
          <TrashIcon className="w-5 h-5" />
          Удалить
        </button>

        <Button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm !w-[160px]"
          disabled={loading.update}
          loading={loading.update}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
};
