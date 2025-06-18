import { useState } from "react";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { useCreateCourseFormModel } from "../model/model";

interface LessonFormProps {
  onClose: () => void;
}

export const CreateCourseForm: React.FC<LessonFormProps> = ({
  onClose,
}) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [price, setPrice] = useState(0);

  const { createCourse, loading, error } = useCreateCourseFormModel();

  const handleSave = async () => {
    const updatedCourse = await createCourse({
      name: name,
      date_start: startDate,
      date_finish: endDate,
      price: price,
    });
    if (updatedCourse) {
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
        label="Цена"
        placeholder="Введите цену курса"
      />

      <div className="flex justify-between pt-2">
        <Button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm !w-[160px]"
          disabled={loading.create}
          loading={loading.create}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
};
