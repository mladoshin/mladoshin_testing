import { Lesson } from "@/entities/lesson/model/types";
import { LessonCard } from "@/entities/lesson/ui/LessonCard";

interface LessonListProps {
  lessons: Lesson[];
  title?: string;
  onClick?: (lesson: Lesson) => void;
}

export function LessonList({ lessons, onClick }: LessonListProps) {
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
