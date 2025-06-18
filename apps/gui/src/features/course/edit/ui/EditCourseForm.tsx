import { useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { useEditCourseFormModel } from "../model/model";
import { Course } from "@/entities/course/model/types";

interface LessonFormProps {
  course: Course;
  onClose: () => void;
}

export const EditCourseForm: React.FC<LessonFormProps> = ({
  course,
  onClose,
}) => {
  const [name, setName] = useState(course.name);
  const [startDate, setStartDate] = useState(
    new Date(course.startDate).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date(course.endDate).toISOString().slice(0, 10)
  );
  const [price, setPrice] = useState(course.price);

  const { updateCourse, deleteCourse, loading, error } = useEditCourseFormModel();

  const handleSave = async () => {
    const updatedCourse = await updateCourse(course.id, {
      name: name,
      date_start: startDate,
      date_finish: endDate,
      price: price,
    });
    if (updatedCourse) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if(!course) return;

    if (confirm("Удалить курс?")) {
      await deleteCourse(course.id);
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error.update}</div>}

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        label="Название"
        placeholder="Введите название курса"
        type="text"
      />

      <Input
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        label="Дата"
        placeholder="Введите дату начала курса"
        type="date"
      />

      <Input
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        label="Дата"
        placeholder="Введите дату конца курса"
        type="date"
      />

      <Input
        type="number"
        value={price}
        onChange={(e) => setPrice(+e.target.value)}
        label="Контент"
        placeholder="Введите цену курса"
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
