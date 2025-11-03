#!/bin/bash
set -e

# ----------------------------
# Настройки по умолчанию
# ----------------------------
OFFLINE=false
MODE="parallel"        # parallel или sequential
RANDOM=false
ALLURE_SHOW=false
ALLURE_APPEND=true
TEST_PATH=""           # путь к конкретному тесту, если нужно

# ----------------------------
# Функция вывода справки
# ----------------------------
usage() {
  echo "Usage: $0 [-o] [-m MODE] [-r] [-s] [-t TEST_PATH] [-h]"
  echo "  -o           Offline mode (IS_OFFLINE=true)"
  echo "  -m MODE      Test mode: parallel or sequential (default: parallel)"
  echo "  -r           Randomize test order"
  echo "  -s           Show Allure report temporarily for this run"
  echo "  -t PATH      Run only specific test file/folder"
  echo "  -h           Show this help"
  exit 1
}

# ----------------------------
# Парсим аргументы
# ----------------------------
while getopts "om:rst:h" opt; do
  case ${opt} in
    o ) OFFLINE=true ;;
    m ) MODE=$OPTARG ;;
    r ) RANDOM=true ;;
    s ) ALLURE_SHOW=true ;;
    t ) TEST_PATH=$OPTARG ;;
    h ) usage ;;
    * ) usage ;;
  esac
done

echo "Running tests with settings:"
echo "  Offline: $OFFLINE"
echo "  Mode: $MODE"
echo "  Random: $RANDOM"
echo "  Allure show: $ALLURE_SHOW"
echo "  Test path: $TEST_PATH"
echo "  Append to Allure history: $ALLURE_APPEND"

# ----------------------------
# Формируем команду Jest
# ----------------------------
JEST_CMD="npx jest"

# Путь к конкретному тесту
if [ -n "$TEST_PATH" ]; then
  JEST_CMD="$JEST_CMD $TEST_PATH"
fi

# Последовательный или параллельный режим
if [ "$MODE" == "sequential" ]; then
  JEST_CMD="$JEST_CMD --runInBand"
else
  JEST_CMD="$JEST_CMD --maxWorkers=4"
fi

# Рандомизация
if [ "$RANDOM" = true ]; then
  JEST_CMD="$JEST_CMD --config jest.config.random.ts"
fi

# ----------------------------
# Offline переменная
# ----------------------------
if [ "$OFFLINE" = true ]; then
  export IS_OFFLINE=true
  echo "Offline mode enabled (IS_OFFLINE=true)"
fi

# ----------------------------
# Allure подготовка
# ----------------------------
if [ "$ALLURE_APPEND" = true ]; then
  echo "Preparing Allure history..."
  rm -rf allure-results/history
  cp -r allure-report/history allure-results/history 2>/dev/null || true
fi

# ----------------------------
# Запуск Jest
# ----------------------------
echo "Running Jest command: $JEST_CMD"

# Запускаем Jest, но не выходим при ошибке
set +e
$JEST_CMD
JEST_EXIT_CODE=$?
set -e

# ----------------------------
# Allure генерация
# ----------------------------
if [ "$ALLURE_APPEND" = true ]; then
  echo "Generating Allure report..."
  allure generate allure-results -o allure-report --clean
fi

# ----------------------------
# Показ отчета (опционально)
# ----------------------------
if [ "$ALLURE_SHOW" = true ]; then
  echo "Opening Allure report..."
  allure open allure-report
fi

# ----------------------------
# Завершаем скрипт с кодом выхода Jest
# ----------------------------
exit $JEST_EXIT_CODE
