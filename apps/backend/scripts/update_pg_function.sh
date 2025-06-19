#!/bin/bash
set -e

# Путь к функции
FUNCTION_PATH="apps/backend/src/modules/user-schedule/pg-function/function.sql"

# Проверка переменных
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
  echo "❌ Убедитесь, что заданы переменные POSTGRES_USER и POSTGRES_DB"
  exit 1
fi

# Выполняем SQL-файл внутри контейнера
docker exec -i school_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "/function.sql"

echo "✅ Функция успешно загружена в базу данных"
