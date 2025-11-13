# Integration Test Runner

Docker-контейнер для запуска HTTP-based интеграционных тестов бэкенда с поддержкой Allure отчетов.

## Структура тестов

Раннер запускает все интеграционные тесты из папок:
```
src/modules/**/tests/**/integration/*.spec.ts
```

Примеры:
- `src/modules/auth/tests/integration/auth.controller.spec.ts`
- `src/modules/courses/tests/integration/courses.controller.http.spec.ts`
- `src/modules/users/tests/integration/users.service.spec.ts`

## Особенности

- HTTP-клиент для тестирования реальных API endpoints
- Изолированные схемы БД для каждого теста
- Поддержка Allure отчетов
- Health check для проверки доступности бэкенда
- Автоматическая настройка JWT токенов
- Test factories для создания тестовых данных

## Запуск

### Локальная разработка

```bash
# Из корня backend проекта
cd tests/integration_runner

# Установка зависимостей
npm install

# Запуск тестов (требуется запущенный backend)
TEST_API_URL=http://localhost:3000 npm run test:integration

# Запуск с генерацией Allure отчета
npm test

# Просмотр отчета
npm run allure:show
```

### Docker

```bash
# Из корня backend проекта
docker build -t integration-runner -f tests/integration_runner/Dockerfile .

# Запуск с подключением к backend
docker run \
  --network=your_network \
  -e TEST_API_URL=http://backend:3000 \
  -v $(pwd)/allure-results:/app/allure-results \
  -v $(pwd)/allure-report:/app/allure-report \
  integration-runner

# Генерация Allure отчета после запуска
allure generate allure-results -o allure-report --clean
allure open allure-report
```

### Docker Compose

```yaml
services:
  integration-runner:
    build:
      context: .
      dockerfile: tests/integration_runner/Dockerfile
    environment:
      - TEST_API_URL=http://backend:3000
      - JEST_TIMEOUT=30000
      - IS_OFFLINE=false
    volumes:
      - ./allure-results:/app/allure-results
      - ./allure-report:/app/allure-report
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - test-network
```

## Переменные окружения

- `TEST_API_URL` - URL бэкенда для тестирования (по умолчанию: `http://backend:3000`)
- `JEST_TIMEOUT` - таймаут для тестов в мс (по умолчанию: `30000`)
- `IS_OFFLINE` - режим оффлайн, пропускает HTTP тесты (по умолчанию: `false`)
- `NODE_ENV` - окружение (по умолчанию: `test`)

## Доступные скрипты

- `npm run test:integration` - запуск интеграционных тестов (последовательно)
- `npm run test:integration:parallel` - параллельный запуск (2 воркера)
- `npm run test:verbose` - запуск с подробным выводом
- `npm run test:watch` - watch режим для разработки
- `npm test` - запуск с генерацией Allure отчета
- `npm run allure:clean` - очистка Allure результатов
- `npm run allure:prepare` - подготовка истории для Allure
- `npm run allure:append` - генерация Allure отчета
- `npm run allure:show` - открытие Allure отчета в браузере

## Структура проекта раннера

```
tests/integration_runner/
├── Dockerfile          # Образ для запуска тестов
├── package.json        # Зависимости и скрипты
├── jest.config.ts      # Конфигурация Jest с Allure
├── tsconfig.json       # Конфигурация TypeScript
└── README.md           # Эта документация
```

## Примеры тестов

### HTTP Integration Test

```typescript
import { ApiTestClient, setupTestClient, teardownTestClient } from '../../../../../tests/helpers/api-client';
import { createTestFactories, TestFactories } from '../../../../../tests/helpers/test-factories';

describe('CoursesController (HTTP integration)', () => {
  let client: ApiTestClient;
  let factories: TestFactories;
  let token: string;

  beforeAll(async () => {
    client = await setupTestClient();
    factories = createTestFactories(client);
  });

  afterAll(async () => {
    await teardownTestClient(client);
  });

  beforeEach(async () => {
    const user = await factories.users.create({
      email: 'test@user.com',
      password: 'Test123456',
    });

    const loginResult = await factories.users.login('test@user.com', 'Test123456');
    token = loginResult.accessToken;
    client.setAuthToken(token);
  });

  afterEach(async () => {
    await client.resetSchema();
    client.clearAuthToken();
  });

  it('should create a course', async () => {
    const dto = {
      name: 'New Course',
      price: 150,
    };

    const response = await client.post('/api/courses', dto);

    expect(response.status).toBe(201);
    expect(response.data.name).toBe(dto.name);
  });
});
```

## Отладка

```bash
# Подключение к запущенному контейнеру
docker exec -it integration-runner sh

# Просмотр логов
docker logs integration-runner

# Запуск отдельного теста
docker exec integration-runner npm run test:integration -- --testPathPattern="courses"

# Debug режим
docker run -p 9229:9229 integration-runner npm run test:debug
```

## Troubleshooting

### Тесты не могут подключиться к backend

- Убедитесь, что backend запущен и доступен по сети
- Проверьте переменную `TEST_API_URL`
- Проверьте health check: `curl http://backend:3000/health`

### Allure отчеты не генерируются

- Убедитесь, что volume для `allure-results` примонтирован
- Проверьте права доступа к директориям
- Запустите генерацию вручную: `allure generate allure-results`

### Таймауты тестов

- Увеличьте `JEST_TIMEOUT` через переменную окружения
- Проверьте производительность backend
- Убедитесь, что БД доступна и быстро отвечает
