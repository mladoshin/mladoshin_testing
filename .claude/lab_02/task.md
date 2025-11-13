 План настройки Docker-окружения для раздельного запуска бэкенда и тестов

 1. Создание миграций TypeORM и seed данных

 - Отключить synchronize: true в production/test конфигурации
 - Сгенерировать миграции из существующих entities
 - Создать seed скрипт для загрузки тестовых данных в БД
 - Добавить npm scripts для запуска миграций и seed

 2. Модификация docker-compose.test.yml

 - backend-test сервис:
   - Добавить зависимость от postgres-test с условием service_healthy
   - Настроить команду запуска: миграции → seed → запуск приложения
   - Улучшить healthcheck для проверки готовности API
   - Использовать .env.docker.test для конфигурации
 - test-runner сервис:
   - Добавить зависимость от backend-test с условием service_healthy
   - Добавить переменную окружения TEST_API_URL=http://backend-test:3000
   - Убедиться что контейнеры в одной сети

 3. Переписать integration и e2e тесты

 - Заменить Test.createTestingModule() на HTTP запросы к внешнему URL
 - Изменить supertest с app.getHttpServer() на прямые запросы к TEST_API_URL
 - Убрать логику создания изолированных PostgreSQL схем
 - Добавить вспомогательную функцию для получения configured axios/supertest клиента

 4. Создать API endpoints для управления тестовыми данными

 - Добавить специальный контроллер (только для test окружения):
   - POST /api/test/reset-database - очистка всех таблиц
   - POST /api/test/seed - загрузка seed данных
   - Защитить эти endpoints проверкой NODE_ENV === 'test'

 5. Обновить конфигурационные файлы

 - Обновить .env.docker.test с правильными настройками
 - Обновить Dockerfile.test если потребуется
 - Обновить npm scripts в package.json для Docker тестов

 6. Добавить wait-for-it механизм

 - Добавить скрипт для ожидания готовности сервисов
 - Интегрировать в docker-compose для надежного старта

 7. Возможность запустить тестовый раннер без запуска сервиса бэкенда (для демонстрации преподавателю)

 Результат:

 - Backend-test контейнер запускается отдельно с миграциями и seed
 - Test-runner делает HTTP запросы к backend-test
 - Оба используют общую БД postgres-test
 - Локальный запуск не поддерживается (только Docker)