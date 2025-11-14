#!/bin/bash

# Скрипт для запуска нескольких test-runner контейнеров параллельно
# Использование: ./start-runners.sh [количество_раннеров]

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Директория со скриптом
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Кросс-платформенная функция timeout
# Для macOS используется альтернативная реализация, т.к. timeout не установлен по умолчанию
run_with_timeout() {
    local timeout_duration=$1
    shift

    if command -v timeout &> /dev/null; then
        # Linux: используем стандартный timeout
        timeout "$timeout_duration" "$@"
    elif command -v gtimeout &> /dev/null; then
        # macOS с установленным coreutils: используем gtimeout
        gtimeout "$timeout_duration" "$@"
    else
        # macOS без coreutils: используем альтернативную реализацию
        (
            "$@" &
            local pid=$!
            (
                sleep "$timeout_duration"
                kill -TERM "$pid" 2>/dev/null
            ) &
            local killer_pid=$!

            if wait "$pid" 2>/dev/null; then
                kill -TERM "$killer_pid" 2>/dev/null
                wait "$killer_pid" 2>/dev/null
                return 0
            else
                return 1
            fi
        )
    fi
}

# По умолчанию 2 раннера
RUNNERS_COUNT=${1:-2}

# Валидация параметра
if ! [[ "$RUNNERS_COUNT" =~ ^[0-9]+$ ]] || [ "$RUNNERS_COUNT" -lt 1 ]; then
    echo -e "${RED}Ошибка: количество раннеров должно быть положительным числом${NC}"
    echo "Использование: $0 [количество_раннеров]"
    echo "Пример: $0 3"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Запуск тестовых раннеров                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Количество раннеров:${NC} $RUNNERS_COUNT"
echo -e "${GREEN}Рабочая директория:${NC} $BACKEND_DIR"
echo ""

cd "$BACKEND_DIR"

# Проверка наличия docker-compose.local.test.yml
if [ ! -f "docker-compose.local.test.yml" ]; then
    echo -e "${RED}Ошибка: файл docker-compose.local.test.yml не найден${NC}"
    exit 1
fi

# Создание необходимых директорий
echo -e "${YELLOW}Подготовка директорий...${NC}"
mkdir -p allure-results logs
chmod -R 777 allure-results logs

# Остановка и удаление старых контейнеров
echo -e "${YELLOW}Очистка старых контейнеров...${NC}"
docker compose -f docker-compose.local.test.yml down -v 2>/dev/null || true

# Запуск инфраструктуры (БД + Backend)
echo -e "${YELLOW}Запуск PostgreSQL и Backend...${NC}"
docker compose -f docker-compose.local.test.yml up -d postgres-test backend-test

# Ожидание готовности БД
echo -e "${YELLOW}Ожидание готовности PostgreSQL...${NC}"
run_with_timeout 60 bash -c 'until docker compose -f docker-compose.local.test.yml exec -T postgres-test pg_isready -U test_user -d school_test_db > /dev/null 2>&1; do sleep 2; done' || {
    echo -e "${RED}PostgreSQL не запустилась вовремя${NC}"
    docker compose -f docker-compose.local.test.yml logs postgres-test
    exit 1
}
echo -e "${GREEN}✓ PostgreSQL готова${NC}"

# Ожидание готовности Backend
echo -e "${YELLOW}Ожидание готовности Backend...${NC}"
run_with_timeout 120 bash -c 'until docker compose -f docker-compose.local.test.yml exec -T backend-test curl -f http://localhost:3000/api/auth/check?email=healthcheck@test.com > /dev/null 2>&1; do sleep 3; done' || {
    echo -e "${RED}Backend не запустился вовремя${NC}"
    docker compose -f docker-compose.local.test.yml logs backend-test
    exit 1
}
echo -e "${GREEN}✓ Backend готов${NC}"
echo ""

# Запуск test-runner контейнеров
echo -e "${BLUE}Запуск $RUNNERS_COUNT test-runner контейнеров...${NC}"
docker compose -f docker-compose.local.test.yml up -d --scale test-runner=$RUNNERS_COUNT test-runner

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Раннеры успешно запущены!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Полезные команды:${NC}"
echo ""
echo -e "  ${YELLOW}Посмотреть запущенные раннеры:${NC}"
echo "    docker compose -f docker-compose.local.test.yml ps test-runner"
echo ""
echo -e "  ${YELLOW}Запустить тесты на конкретном раннере:${NC}"
echo "    ./tests/scripts/run-test.sh [unit|integration|e2e] [номер_раннера]"
echo ""
echo -e "  ${YELLOW}Посмотреть логи:${NC}"
echo "    docker compose -f docker-compose.local.test.yml logs -f test-runner"
echo ""
echo -e "  ${YELLOW}Остановить все:${NC}"
echo "    docker compose -f docker-compose.local.test.yml down -v"
echo ""
