import { Lesson } from "@/entities/lesson/model/types";
import { LessonCard } from "@/entities/lesson/ui/LessonCard";
import { SpinnerIcon } from "@/shared/ui/SpinnerIcon";

interface LessonListProps {
  lessons: Lesson[];
  loading?: boolean;
  error?: string | null;
  onClick?: (lesson: Lesson) => void;
}

export function LessonList({
  lessons,
  loading,
  error,
  onClick,
}: LessonListProps) {
  if (loading) {
    return (
      <section className="py-6">
        <div className="w-dull flex justify-center items-center gap-3 text-black">
          <SpinnerIcon className="w-7 h-7 animate-spin" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6">
        <span className="text-red-500">{error}</span>
      </section>
    );
  }

  return (
    <section className="py-6">
      {lessons.length === 0 ? (
        <p className="text-gray-500">Нет доступных уроков</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <LessonCard lesson={lesson} onClick={() => onClick?.(lesson)} />
          ))}
        </div>
      )}
    </section>
  );
}
