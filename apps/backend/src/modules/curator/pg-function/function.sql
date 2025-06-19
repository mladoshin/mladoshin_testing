CREATE OR REPLACE FUNCTION pick_student_schedule(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS TABLE (
  lesson_id UUID,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME
)
AS $$
import plpy
import datetime
from collections import defaultdict

def parse_datetime_with_tz(s):
    if s.endswith('+00'):
        s = s.replace('+00', '+0000')
    return datetime.datetime.strptime(s, "%Y-%m-%d %H:%M:%S%z")

def parse_time(tstr):
    return datetime.datetime.strptime(tstr, "%H:%M:%S").time()

def overlaps(a_start, a_end, b_start, b_end):
    return a_start < b_end and b_start < a_end

# Получение дат начала и конца курса
course_info = plpy.execute(f"""
  SELECT date_start, date_finish
  FROM course
  WHERE id = '{p_course_id}'
""")
if not course_info:
    plpy.error("Курс не найден")

start_date = parse_datetime_with_tz(course_info[0]['date_start']).date()
end_date = parse_datetime_with_tz(course_info[0]['date_finish']).date()

# Получение расписания пользователя
availability = plpy.execute(f"""
  SELECT week_day, start_time, end_time
  FROM user_availability
  WHERE user_id = '{p_student_id}' AND course_id = '{p_course_id}'
""")

# Получение уроков курса
lessons = plpy.execute(f"""
  SELECT id, date, duration
  FROM course_lesson
  WHERE course_id = '{p_course_id}'
  ORDER BY date ASC
""")

assigned = []
lessons_per_day = defaultdict(int)
result = []

for lesson in lessons:
    base_date = parse_datetime_with_tz(lesson['date']).date()
    duration = datetime.timedelta(minutes=lesson['duration'])
    current_date = base_date
    is_scheduled = False

    while current_date <= end_date:
        dow = current_date.weekday()

        for slot in availability:
            if slot['week_day'] != dow or lessons_per_day[current_date] >= 2:
                continue

            slot_start = datetime.datetime.combine(datetime.date(2000, 1, 1), datetime.datetime.strptime(slot['start_time'], "%H:%M:%S").time())
            slot_end = datetime.datetime.combine(datetime.date(2000, 1, 1), datetime.datetime.strptime(slot['end_time'], "%H:%M:%S").time())
            time_cursor = slot_start

            while time_cursor + duration <= slot_end:
                s_start = time_cursor.time()
                s_end = (time_cursor + duration).time()

                conflict = False
                for a in assigned:
                    if a['scheduled_date'] == current_date:
                        if overlaps(s_start, s_end, a['start_time'], a['end_time']):
                            conflict = True
                            break

                if not conflict:
                    assigned.append({
                        'lesson_id': lesson['id'],
                        'scheduled_date': current_date,
                        'start_time': s_start,
                        'end_time': s_end
                    })
                    lessons_per_day[current_date] += 1
                    result.append((
                        lesson['id'],
                        current_date,
                        s_start,
                        s_end
                    ))
                    is_scheduled = True
                    break

                time_cursor += datetime.timedelta(minutes=5)

            if is_scheduled:
                break
        if is_scheduled:
            break

        current_date += datetime.timedelta(days=1)

    if not is_scheduled:
        plpy.error(f"Не удалось назначить урок {lesson['id']}")

return result
$$ LANGUAGE plpython3u;
