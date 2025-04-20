# NeuroBlogger - Мультибот система на Telegraf

Многофункциональная система для управления несколькими Telegram-ботами через один сервер с поддержкой как webhook, так и long-polling режимов.

## 📋 Особенности

- 🤖 Поддержка множества ботов из одного приложения
- 🔐 Улучшенная изоляция ботов для безопасности
- 📊 Расширенное логирование для отладки
- 🔄 Поддержка webhook и long-polling режимов
- 🚀 Интеграция с Supabase для хранения токенов ботов
- 🐳 Docker-контейнеризация для простого развертывания

## 🛠 Технологии

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [TypeScript](https://www.typescriptlang.org/) - Типизированный JavaScript
- [Telegraf](https://telegraf.js.org/) - Telegram Bot Framework
- [Supabase](https://supabase.com/) - База данных для хранения настроек ботов
- [Docker](https://www.docker.com/) - Контейнеризация
- [Nginx](https://nginx.org/) - Прокси-сервер для webhook

## 🛡️ Правила взаимодействия с Supabase (ЗОЛОТОЕ ПРАВИЛО!)

Чтобы обеспечить стабильность и предсказуемость при работе с базой данных, необходимо **строго** соблюдать следующие правила:

1.  **Типизация:** Всегда использовать TypeScript интерфейсы/типы для данных, получаемых из Supabase или отправляемых в него. Это помогает избегать ошибок типов на этапе компиляции.
2.  **Проверка аргументов:** Перед вызовом любой функции, взаимодействующей с Supabase, **обязательно** проверять наличие и корректность типов всех необходимых аргументов. Не передавать `undefined` или `null`, если функция их не ожидает.
3.  **Обработка ошибок:** Всегда проверять поле `error` в ответе от Supabase. Стандартизировать обработку: логировать саму ошибку (`error.message`, `error.details`, `error.code`), возвращать понятный результат (например, `null`, `false` или пустой массив) или пробрасывать исключение с информативным сообщением.
4.  **Подробное логирование:** Добавить логирование **до** и **после** каждого запроса к Supabase. Логировать:
    *   Название вызываемой функции Supabase.
    *   Ключевые параметры запроса (например, `telegram_id`, фильтры, обновляемые данные).
    *   Результат операции (успех/ошибка).
    *   Саму ошибку, если она произошла.
5.  **Использование `.maybeSingle()`:** При запросе одной записи, которая может отсутствовать, использовать `.maybeSingle()` вместо `.single()`. Это предотвращает ошибку, если запись не найдена, и возвращает `data: null`, что легче обработать.

**Ответственный за соблюдение правил:** Gemini (AI Ассистент)

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки с hot-reload
npm run dev
```

### Через Docker

```bash
# Запуск в режиме разработки
docker-compose -f docker-compose.dev.yml up

# Запуск в продакшене
docker-compose up -d
```

## 🔨 Структура проекта

```
.
├── src/                      # Исходный код
│   ├── core/                 # Базовые модули
│   │   ├── bot/              # Основная логика ботов
│   │   └── supabase/         # Интеграция с Supabase
│   ├── utils/                # Утилиты
│   │   └── launch.ts         # Логика запуска ботов
│   ├── interfaces/           # TypeScript интерфейсы
│   ├── scenes/               # Сцены для ботов
│   ├── multi.ts              # Точка входа для режима long polling
│   └── webhook.ts            # Точка входа для режима webhook
├── docker-compose.yml        # Основная Docker конфигурация
├── Dockerfile                # Основной Docker образ для продакшена
├── tsconfig.json             # TypeScript конфигурация
└── ROADMAP.md                # Roadmap проекта
```

## 🐳 Docker файлы

| Файл | Назначение |
|------|------------|
| Dockerfile | Основной образ для продакшена |
| Dockerfile.dev | Образ для разработки |
| Dockerfile.test | Образ для тестирования |
| docker-compose.yml | Основная конфигурация |
| docker-compose.dev.yml | Конфигурация для разработки |
| docker-compose.multi.yml | Для множественных ботов |
| docker-compose.test.yml | Для тестирования |
| docker-compose.webhook.yml | Для webhook режима |

## 📋 Переменные окружения

Создайте файл `.env` на основе примера:

```
# Токены ботов
BOT_TOKEN_1=1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
BOT_TOKEN_2=0987654321:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB

# Настройки сервера
PORT=3000
ORIGIN=https://your-domain.com

# База данных
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-key
```

## 📚 Документация

Для дополнительной информации о разработке и деплое проекта смотрите:

- [ROADMAP.md](ROADMAP.md) - План развития проекта
- [DEPLOYMENT.md](DEPLOYMENT.md) - Инструкции по деплою

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Запуск тестов через Docker
docker-compose -f docker-compose.test.yml up
```

### 📝 Как мокать Supabase в тестах (Unit-тесты Jest)

Стабильное мокирование Supabase критически важно для юнит-тестов. Вот два рабочих подхода, которые мы использовали:

**1. Стандартный подход (`jest.mock` + `jest.fn`)**

Этот метод подходит для большинства случаев. Используется в `__tests__/core/supabase/updateUserBalance.test.ts`.

*   **Мокаем цепочку вызовов:** В `describe` или `beforeEach` мокаем всю цепочку Supabase, которую использует тестируемая функция.

    ```typescript
    // Пример для функции, использующей supabase.from(...).select(...).eq(...).maybeSingle()
    const mockMaybeSingle = jest.fn<() => Promise<{ data: any; error: any }>>();
    const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    jest.mock('@/core/supabase', () => ({
      supabase: {
        from: jest.fn(() => ({ select: mockSelect })), // Мокаем from и select
      },
    }));
    ```

*   **Мокаем результат в тесте:** Внутри `it(...)` используем `mockResolvedValueOnce` на *последней функции в цепочке*, чтобы задать нужный ответ (`data` и `error`).

    ```typescript
    // Успешный ответ
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 1, name: 'Test' }, error: null });

    // Ответ с ошибкой
    const dbError = new Error('DB error');
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: dbError });
    ```

*   **❗Важно:** Убедитесь, что вы вызываете **оригинальную тестируемую функцию** (например, `updateUserBalance`) с **правильным количеством и типами аргументов**, как она ожидает. Ошибки часто возникают именно здесь, а не в самом моке!

**2. Альтернативный подход (`jest.spyOn`)**

Используйте этот метод, если возникают сложные проблемы с типами TypeScript при использовании `jest.mock` (как было в `__tests__/scenes/textToSpeechWizard.test.ts`).

*   **Импортируем модуль:** Импортируйте весь модуль Supabase или модуль, содержащий нужную функцию.

    ```typescript
    import * as supabaseCore from '@/core/supabase';
    ```

*   **Шпионим и мокаем в тесте:** Внутри `it(...)` используйте `jest.spyOn` для перехвата вызова конкретной функции и мокайте ее реализацию.

    ```typescript
    it('should get voice id', async () => {
      const getVoiceIdSpy = jest.spyOn(supabaseCore, 'getVoiceId').mockResolvedValueOnce('voice123');

      // ... остальной код теста ...

      expect(getVoiceIdSpy).toHaveBeenCalledWith(...);
    });
    ```

*   **Очистка:** Не забывайте вызывать `jest.restoreAllMocks()` в `beforeEach` или `afterEach` при использовании `jest.spyOn`.

Следуя этим подходам, вы сможете надежно мокать Supabase и писать стабильные юнит-тесты.

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. Подробнее см. в файле LICENSE.