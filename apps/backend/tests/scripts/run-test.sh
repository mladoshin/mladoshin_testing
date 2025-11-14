#!/bin/bash

# Скрипт для запуска тестов на конкретном test-runner
# Использование: ./run-test.sh [test_type] [runner_number]
# Примеры:
#   ./run-test.sh unit 1        - запустить unit-тесты на первом раннере
#   ./run-test.sh integration   - запустить integration-тесты на первом раннере
#   ./run-test.sh e2e           - запустить e2e-тесты на первом раннере

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

# Параметры
TEST_TYPE=${1:-"unit"}
RUNNER_NUMBER=${2:-1}

# Валидация типа теста
case "$TEST_TYPE" in
    unit|integration|e2e)
        ;;
    *)
        echo -e "${RED}Ошибка: неверный тип теста${NC}"
        echo "Допустимые типы: unit, integration, e2e"
        echo ""
        echo "Использование: $0 [test_type] [runner_number]"
        echo "Примеры:"
        echo "  $0 unit 1"
        echo "  $0 integration 2"
        echo "  $0 e2e"
        exit 1
        ;;
esac

# Валидация номера раннера
if ! [[ "$RUNNER_NUMBER" =~ ^[0-9]+$ ]] || [ "$RUNNER_NUMBER" -lt 1 ]; then
    echo -e "${RED}Ошибка: номер раннера должен быть положительным числом${NC}"
    exit 1
fi

cd "$BACKEND_DIR"

# Проверка наличия docker-compose.local.test.yml
if [ ! -f "docker-compose.local.test.yml" ]; then
    echo -e "${RED}Ошибка: файл docker-compose.local.test.yml не найден${NC}"
    exit 1
fi

# Получение списка запущенных test-runner контейнеров
RUNNERS=($(docker compose -f docker-compose.local.test.yml ps test-runner --format json 2>/dev/null | jq -r '.Name' | sort))

if [ ${#RUNNERS[@]} -eq 0 ]; then
    echo -e "${RED}Ошибка: нет запущенных test-runner контейнеров${NC}"
    echo ""
    echo "Сначала запустите раннеры командой:"
    echo "  ./tests/scripts/start-runners.sh [количество]"
    exit 1
fi

# Проверка существования раннера с указанным номером
if [ "$RUNNER_NUMBER" -gt "${#RUNNERS[@]}" ]; then
    echo -e "${RED}Ошибка: раннер #$RUNNER_NUMBER не найден${NC}"
    echo "Доступно раннеров: ${#RUNNERS[@]}"
    echo ""
    echo "Запущенные раннеры:"
    for i in "${!RUNNERS[@]}"; do
        echo "  $((i+1)). ${RUNNERS[$i]}"
    done
    exit 1
fi

# Индекс раннера (с нуля)
RUNNER_INDEX=$((RUNNER_NUMBER - 1))
CONTAINER_NAME="${RUNNERS[$RUNNER_INDEX]}"

# Определение команды теста
case "$TEST_TYPE" in
    unit)
        TEST_COMMAND="pnpm run test:unit"
        TEST_LABEL="Unit тесты"
        ;;
    integration)
        TEST_COMMAND="pnpm run test:integration"
        TEST_LABEL="Integration тесты"
        ;;
    e2e)
        TEST_COMMAND="pnpm run test:e2e"
        TEST_LABEL="E2E тесты"
        ;;
esac

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Запуск тестов                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Тип теста:${NC} $TEST_LABEL"
echo -e "${GREEN}Контейнер:${NC} $CONTAINER_NAME (раннер #$RUNNER_NUMBER)"
echo -e "${GREEN}Команда:${NC} $TEST_COMMAND"
echo ""

# Запуск тестов
echo -e "${YELLOW}Запуск тестов...${NC}"
echo ""

docker exec -it "$CONTAINER_NAME" $TEST_COMMAND

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Тесты завершены успешно!                     ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  Тесты завершены с ошибками!                  ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo -e "${BLUE}Результаты тестов сохранены в:${NC}"
echo "  - allure-results/ (результаты для отчета)"
echo "  - logs/ (логи приложения)"
echo ""

exit $EXIT_CODE
