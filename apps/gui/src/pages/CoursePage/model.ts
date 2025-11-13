import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CourseResponse } from '@shared/types';
import { courseApi } from '@/features/course/model/api';
import { Course } from '@/entities/course/model/types';
import { CourseAdapter } from '@/entities/course/model/adapters';

export const useCoursePageModel = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    courseApi.fetchOneById(id)
      .then((response: CourseResponse) => {
        const mappedCourse = CourseAdapter.mapFromResponse(response);
        setCourse(mappedCourse);
        setLoading(false);
      })
      .catch(() => {
        setCourse(null)
        setError('Ошибка загрузки курса');
        console.error(`Ошибка при получении курса ${id}`);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { course, error, loading };
};
