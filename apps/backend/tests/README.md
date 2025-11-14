# Руководство по запуску тестов

Это руководство описывает все способы запуска тестов на бэкенде проекта.

## Содержание

- [Типы тестов](#типы-тестов)
- [Локальный запуск](#локальный-запуск)
  - [Обычный запуск](#обычный-запуск)
  - [Запуск в Docker](#запуск-в-docker)
  - [Параллельный запуск в Docker](#параллельный-запуск-в-docker)
- [Запуск в CI/CD](#запуск-в-cicd)
- [Отчеты Allure](#отчеты-allure)
- [Полезные команды](#полезные-команды)

---

## Типы тестов

В проекте используются три типа тестов:

### 1. Unit-тесты
- **Расположение:** `src/modules/*/tests/unit/*.spec.ts`
- **Назначение:** Тестирование изолированных функций и методов
- **Зависимости:** Не требуют БД или внешних сервисов
- **Параллелизация:** Запускаются с 2 воркерами (можно увеличить до 4)
- **Таймаут:** 10 секунд

### 2. Integration-тесты
- **Расположение:** `src/modules/*/tests/integration/*.spec.ts`
- **Назначение:** Тестирование взаимодействия компонентов и работы с БД
- **Зависимости:** Требуют PostgreSQL
- **Параллелизация:** Запускаются последовательно (1 воркер) из-за работы с БД
- **Таймаут:** 30 секунд

### 3. E2E-тесты (End-to-End)
- **Расположение:** `src/modules/*/tests/e2e/*.spec.ts`
- **Назначение:** Тестирование полных пользовательских сценариев через HTTP API
- **Зависимости:** Требуют запущенный backend и PostgreSQL
- **Параллелизация:** Запускаются последовательно (1 воркер)
- **Таймаут:** 60 секунд

---

## Локальный запуск

### Обычный запуск

Для локального запуска тестов без Docker:

```bash
# Unit-тесты
pnpm test:unit

# Integration-тесты (требуется локальная PostgreSQL)
pnpm test:integration

# E2E-тесты (требуется запущенный backend)
pnpm test:e2e

# Все тесты параллельно (4 воркера)
pnpm test:parallel

# Все тесты последовательно
pnpm test:sequential

# С генерацией Allure-отчета
pnpm test
```

### Запуск в Docker

Запуск тестов в изолированном Docker-окружении:

#### Подготовка окружения

```bash
# Сборка образов
pnpm docker:local:build

# Запуск инфраструктуры (PostgreSQL + Backend)
pnpm docker:local:up

# Просмотр логов
pnpm docker:local:logs

# Остановка и очистка
pnpm docker:local:down
```

#### Запуск тестов

```bash
# Unit-тесты
pnpm docker:local:test:unit

# Integration-тесты
pnpm docker:local:test:integration

# E2E-тесты
pnpm docker:local:test:e2e
```

### Параллельный запуск в Docker

Для ускорения выполнения тестов можно запустить несколько test-runner контейнеров параллельно.

#### Способ 1: Используя готовые скрипты (рекомендуется)

```bash
# 1. Запустить несколько раннеров (по умолчанию 2)
pnpm docker:local:start-runners

# Или указать количество раннеров явно
pnpm docker:local:start-runners 3

# 2. Запустить тесты на конкретном раннере
pnpm docker:local:run-test unit 1        # Unit-тесты на раннере #1
pnpm docker:local:run-test integration 2  # Integration-тесты на раннере #2
pnpm docker:local:run-test e2e           # E2E-тесты на раннере #1 (по умолчанию)
```

#### Способ 2: Прямые команды Docker Compose

```bash
# 1. Запустить инфраструктуру и 3 раннера
cd apps/backend
docker compose -f docker-compose.local.test.yml up -d --scale test-runner=3

# 2. Посмотреть список запущенных раннеров
docker compose -f docker-compose.local.test.yml ps test-runner

# 3. Запустить тесты на конкретном раннере
# Получить имя контейнера
RUNNER_NAME=$(docker compose -f docker-compose.local.test.yml ps test-runner --format json | jq -r '.[0].Name')

# Запустить тесты
docker exec -it $RUNNER_NAME pnpm run test:unit
```

#### Способ 3: Параллельный запуск разных типов тестов

```bash
# Запустить три типа тестов одновременно в фоновом режиме
cd apps/backend

docker compose -f docker-compose.local.test.yml run -d --name test-runner-unit test-runner pnpm run test:unit &
docker compose -f docker-compose.local.test.yml run -d --name test-runner-integration test-runner pnpm run test:integration &
docker compose -f docker-compose.local.test.yml run -d --name test-runner-e2e test-runner pnpm run test:e2e &

# Дождаться завершения всех
wait

# Посмотреть результаты
docker logs test-runner-unit
docker logs test-runner-integration
docker logs test-runner-e2e
```

⚠️ **Важно:** Integration и E2E тесты используют одну БД, поэтому могут конфликтовать при одновременном запуске. Для надежности рекомендуется запускать их последовательно или на разных раннерах с временным интервалом.

---

## Запуск в CI/CD

Тесты автоматически запускаются в GitHub Actions при:
- Push в ветки `main`, `develop`, `lab_02`
- Pull Request в ветки `main`, `develop`
- Изменениях в `apps/backend/**`, `packages/**` или `.github/workflows/test.yml`

### Этапы CI/CD

1. **Unit Tests** (параллельно, ~2-3 мин)
   - Запуск PostgreSQL
   - Запуск unit-тестов с 2 воркерами
   - Сохранение результатов

2. **Integration Tests** (последовательно, ~5-7 мин)
   - Зависит от успешного завершения Unit Tests
   - Запуск PostgreSQL и Backend
   - Запуск integration-тестов
   - Сохранение результатов

3. **E2E Tests** (последовательно, ~3-5 мин)
   - Зависит от успешного завершения Integration Tests
   - Запуск PostgreSQL и Backend
   - Запуск e2e-тестов
   - Сохранение результатов

4. **Generate Report** (финальный этап)
   - Объединение результатов всех тестов
   - Генерация Allure-отчета
   - Публикация на GitHub Pages (только для `main`)

### Параллелизация в CI/CD

Тесты запускаются как отдельные GitHub Actions jobs, что позволяет им выполняться параллельно на разных раннерах GitHub. Последовательность задается через `needs`:

```yaml
jobs:
  unit-tests:
    # Запускается первым

  integration-tests:
    needs: unit-tests  # Запускается после unit-tests

  e2e-tests:
    needs: integration-tests  # Запускается после integration-tests
```

### Конфигурация воркеров

- **Unit tests:** `maxWorkers: 2` (уменьшено с 4 для стабильности в CI)
- **Integration tests:** `maxWorkers: 1` (последовательно из-за БД)
- **E2E tests:** `maxWorkers: 1` (последовательно из-за БД)

---

## Отчеты Allure

### Локальная генерация отчетов

```bash
# Запустить тесты с генерацией отчета
pnpm test

# Очистить старые отчеты
pnpm allure:clean

# Сгенерировать отчет из результатов
pnpm allure:append

# Открыть отчет в браузере
pnpm allure:show
```

### Отчеты в CI/CD

После успешного запуска тестов в CI/CD:

1. **Артефакты GitHub Actions:**
   - Результаты каждого типа тестов доступны как артефакты
   - Хранятся 30 дней

2. **GitHub Pages (только для main):**
   - Автоматическая публикация на `https://<username>.github.io/<repo>/`
   - История последних 20 запусков
   - Тренды и статистика

### Структура результатов

```
apps/backend/
├── allure-results/     # Результаты тестов (JSON)
├── allure-report/      # HTML-отчет
└── logs/              # Логи приложения
    ├── app.log
    ├── access.log
    └── error.log
```

---

## Полезные команды

### Docker-окружение

```bash
# Пересборка и перезапуск всего окружения
pnpm docker:local:restart

# Подключиться к контейнеру backend
docker compose -f docker-compose.local.test.yml exec backend-test sh

# Подключиться к PostgreSQL
docker compose -f docker-compose.local.test.yml exec postgres-test psql -U test_user -d school_test_db

# Сброс базы данных
pnpm docker:local:reset-db

# Просмотр использования ресурсов
docker stats
```

### Работа с раннерами

```bash
# Посмотреть список запущенных раннеров
docker compose -f apps/backend/docker-compose.local.test.yml ps test-runner

# Посмотреть логи конкретного раннера
docker logs <container_name>

# Подключиться к раннеру
docker exec -it <container_name> sh

# Остановить конкретный раннер
docker stop <container_name>

# Удалить все остановленные контейнеры
docker container prune
```

### Отладка тестов

```bash
# Запуск в debug-режиме (с breakpoints)
pnpm test:debug

# Запуск в watch-режиме (перезапуск при изменениях)
pnpm test:watch

# Запуск с покрытием кода
pnpm test:cov

# Запуск тестов в случайном порядке (для выявления зависимостей)
pnpm test:parallel:random
pnpm test:sequential:random
```

### Миграции и сиды

```bash
# Генерация миграции
pnpm migration:generate -- src/database/migrations/MigrationName

# Применение миграций
pnpm migration:run

# Откат последней миграции
pnpm migration:revert

# Наполнение БД тестовыми данными
pnpm seed:run
```

---

## Рекомендации

### Для локальной разработки

1. **Быстрая проверка:** используйте `pnpm test:unit` для быстрой проверки логики
2. **Полная проверка:** используйте Docker для запуска integration и e2e тестов
3. **Отладка:** используйте `pnpm test:debug` с breakpoints в IDE

### Для CI/CD

1. Тесты запускаются автоматически, не требуют ручного вмешательства
2. Проверяйте отчеты на GitHub Pages для анализа трендов
3. При падении тестов смотрите логи в артефактах GitHub Actions

### Оптимизация производительности

1. **Unit-тесты:** можно увеличить количество воркеров до 4-6 на мощных машинах
2. **Integration/E2E:** всегда запускайте последовательно для предотвращения конфликтов
3. **Параллельные раннеры:** используйте для запуска разных типов тестов одновременно

---

## Структура тестов

```
apps/backend/
├── src/modules/
│   ├── auth/
│   │   └── tests/
│   │       ├── unit/*.spec.ts
│   │       ├── integration/*.spec.ts
│   │       └── e2e/*.spec.ts
│   ├── courses/
│   │   └── tests/
│   │       ├── unit/*.spec.ts
│   │       ├── integration/*.spec.ts
│   │       └── e2e/*.spec.ts
│   └── .../
├── tests/
│   ├── scripts/
│   │   ├── start-runners.sh     # Запуск нескольких раннеров
│   │   └── run-test.sh          # Запуск тестов на раннере
│   ├── test_runner/
│   │   └── Dockerfile           # Dockerfile для test-runner
│   └── README.md               # Это руководство
├── configs/
│   ├── jest.config.ts          # Основная конфигурация Jest
│   ├── jest-unit.config.ts     # Конфигурация для unit-тестов
│   ├── jest-integration.config.ts  # Конфигурация для integration
│   └── jest-e2e.config.ts      # Конфигурация для e2e
├── docker-compose.test.yml     # Docker Compose для CI/CD
└── docker-compose.local.test.yml  # Docker Compose для локальной разработки
```

---

## Troubleshooting

### Проблема: Тесты падают с таймаутом

```bash
# Увеличить таймаут в конфигурации Jest или через переменную окружения
JEST_TIMEOUT=120000 pnpm test:integration
```

### Проблема: Конфликты БД при параллельном запуске

```bash
# Запускайте integration и e2e тесты последовательно
pnpm docker:local:test:integration
pnpm docker:local:test:e2e
```

### Проблема: Docker контейнеры не запускаются

```bash
# Проверить логи
docker compose -f docker-compose.local.test.yml logs

# Пересоздать контейнеры
pnpm docker:local:down
pnpm docker:local:build
pnpm docker:local:up
```

### Проблема: Out of Memory ошибки

```bash
# Увеличить лимит памяти для Node.js
NODE_OPTIONS="--max-old-space-size=4096" pnpm test
```

---

## Полезные ссылки

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Allure Report](https://docs.qameta.io/allure/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Docker Compose](https://docs.docker.com/compose/)
