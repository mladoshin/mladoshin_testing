# Параллелизация тестов в Jest

## Как работает распределение

```
┌─────────────────────────────────────────────────────────┐
│                    Jest Test Runner                      │
│                    (главный процесс)                     │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬──────────────┐
        ▼                 ▼                 ▼              ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐    ┌─────────┐
   │ Worker 1│      │ Worker 2│      │ Worker 3│    │ Worker 4│
   └─────────┘      └─────────┘      └─────────┘    └─────────┘
        │                │                │              │
        ▼                ▼                ▼              ▼
   auth.spec.ts    user.spec.ts    course.spec.ts  payment.spec.ts
   
   Внутри каждого файла тесты выполняются ПОСЛЕДОВАТЕЛЬНО:
   
   ┌─────────────────────────────┐
   │  auth.spec.ts (Worker 1)    │
   │                             │
   │  describe('AuthService')    │
   │    ├─ it('test 1')  ─────►  │ (выполняется)
   │    ├─ it('test 2')  ⏸       │ (ждет)
   │    └─ it('test 3')  ⏸       │ (ждет)
   │                             │
   │  describe('AuthController') │
   │    ├─ it('test 4')  ⏸       │ (ждет)
   │    └─ it('test 5')  ⏸       │ (ждет)
   └─────────────────────────────┘
```

## Уровень параллелизации

❌ **НЕТ параллелизации:**
- Внутри одного .spec.ts файла
- Между тестами (it) внутри describe
- Между describe блоками в одном файле

✅ **ЕСТЬ параллелизация:**
- Между разными .spec.ts файлами
- Каждый файл = отдельный worker

## Пример выполнения

### Параллельный режим (--maxWorkers=4)

```
Время →

0s    [Worker 1: auth.spec.ts        ]
      [Worker 2: user.spec.ts        ]
      [Worker 3: course.spec.ts      ]
      [Worker 4: payment.spec.ts     ]

10s   [Worker 1: lesson.spec.ts      ]
      [Worker 2: profile.spec.ts     ]
      [Worker 3: order.spec.ts       ]
      [Worker 4: (закончил, ждет)    ]

20s   [Worker 1: (закончил)          ]
      ...

Всего: ~25-30 секунд для 35 файлов
```

### Последовательный режим (--runInBand)

```
Время →

0s    [Процесс: auth.spec.ts         ]
10s   [Процесс: user.spec.ts         ]
20s   [Процесс: course.spec.ts       ]
30s   [Процесс: payment.spec.ts      ]
...

Всего: ~90-120 секунд для 35 файлов
```

## Конфигурация в проекте

**package.json:**
```json
{
  "scripts": {
    "test:parallel": "jest --maxWorkers=4",      // 4 воркера
    "test:sequential": "jest --runInBand",       // 1 процесс
    "test:parallel:random": "jest --maxWorkers=4 --config jest.config.random.ts"
  }
}
```

**jest.config.ts:**
```typescript
// maxWorkers не указан в конфиге
// Управляется через CLI флаги
// По умолчанию: CPU cores - 1
```

## Оптимизация

### Когда использовать параллельный режим?
- ✅ CI/CD пайплайны
- ✅ Регулярные прогоны всех тестов
- ✅ Pre-commit хуки

### Когда использовать последовательный режим?
- ✅ Отладка конкретной проблемы
- ✅ Поиск race conditions
- ✅ Тесты с разделяемым состоянием (хотя это антипаттерн)
- ✅ Offline режим с ограниченными ресурсами

## Важные детали

1. **Изоляция:** Каждый worker работает в отдельном Node.js процессе
2. **Память:** Больше воркеров = больше потребление RAM
3. **База данных:** Integration тесты создают отдельные схемы на каждый файл
4. **beforeAll/afterAll:** Выполняются один раз для файла, не для каждого теста
5. **Порядок:** В параллельном режиме порядок файлов не гарантирован

## Мониторинг

Чтобы увидеть реальное распределение воркеров:

```bash
# Во время выполнения тестов
ps aux | grep jest-worker

# Результат:
# user  12345 ... node_modules/.bin/jest-worker
# user  12346 ... node_modules/.bin/jest-worker
# user  12347 ... node_modules/.bin/jest-worker
# user  12348 ... node_modules/.bin/jest-worker
```

## Статистика проекта

- **Тестовых файлов:** 35
- **Конфигурация:** 4 воркера (parallel)
- **CPU ядер (эта машина):** 12
- **Теоретический максимум:** 11 воркеров (cores - 1)
- **Пачек выполнения:** ~8-9 (35 файлов / 4 воркера)

## Смотрите также

- [Jest CLI Options](https://jestjs.io/docs/cli)
- [Jest Configuration](https://jestjs.io/docs/configuration)
- `./scripts/check-parallelization.sh` - скрипт анализа
