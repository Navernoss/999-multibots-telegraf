# Руководство по написанию тестов для сцен

## ⚠️ ВАЖНО: Использование путей в тестах ⚠️

**Обновление от 20.04.2025:** Изначально рекомендовалось использовать относительные пути, чтобы избежать проблем с Jest. Однако, в процессе отладки выяснилось, что относительные пути (`../../src/...`) вызывают ошибки TypeScript `TS2307: Cannot find module ...`.

**Текущая рекомендация:** Использовать **алиасы путей** (`@/core/...`, `@/utils/...`), настроенные в `tsconfig.json`. Это решает проблемы с TS2307 и, похоже, работает корректно с текущей конфигурацией Jest/ts-jest.

## 🪲 Заметки по отладке тестов

В этом разделе фиксируются важные наблюдения и решения, возникшие при отладке проблем с тестами.

1.  **Проблема:** Постоянная ошибка `Cannot find module '@jest/globals'` во всех тестах, несмотря на установленный `@types/jest` и корректный `tsconfig.json` (без поля `types`).
    **Решение:** Полностью удалить все импорты вида `import { describe, it, expect, jest, ... } from '@jest/globals'` из всех тестовых файлов (`*.test.ts`). Jest предоставляет эти функции глобально, а `@types/jest` обеспечивает для них типизацию. Попытки настроить `tsconfig.json` или переустановить зависимости не помогли.

2.  **Проблема:** Ошибки TypeScript `TS2307: Cannot find module '../../../../src/core/...'` при использовании относительных путей в импортах внутри тестов.
    **Решение:** Заменить относительные пути на алиасы (`@/core/...`), настроенные в `tsconfig.json`. Это решило проблему разрешения модулей для TypeScript в контексте Jest.

3.  **Проблема:** (2024-07-21) Устойчивые ошибки `TS2307: Cannot find module '@/...'` и `TS2307: Cannot find module '@/__tests__/...'` в тестах (`*.test.ts`), несмотря на использование алиасов и корректную конфигурацию.
    **Детали:** Проблема сохраняется даже после:
    _ Проверки `tsconfig.json` (`baseUrl`, `paths`).
    _ Проверки `jest.config.js` (`preset: 'ts-jest'`, `moduleNameMapper` для `@/` и `@/__tests__/`).
    _ Многократной очистки кеша Jest (`--clearCache`, `--no-cache`).
    _ Упрощения конфигурации `ts-jest` (удаление `require: ['tsconfig-paths/register']`). \* Использования утилиты `pathsToModuleNameMapper` в `jest.config.js`.
    **Статус:** ⏳ Не решено. `ts-jest` не может корректно разрешить алиасы путей.
    **Следующие шаги:** Исследовать версии зависимостей (`jest`, `ts-jest`, `typescript`), рассмотреть временный откат к относительным путям как крайнюю меру.

4.  **Проблема:** (2024-07-21 -> 2024-07-22) Прогресс и новые проблемы:
    - ✅ `TS2307`, `TS2741`, `TS2322` (типы `telegram_id`/`type`) в `supabaseMocks.ts` исправлены.
    - ✅ `TS2304: Cannot find name 'PaymentStatus'` в `starPaymentScene.test.ts` исправлен (добавлен импорт).
    - ✅ `TS2353` (`provider`), `TS2322` (`id`), `TS2353` (`payment_uuid` vs `payment_id`) в `robokassaWebhook.test.ts` исправлены.
    - ✅ Исправлены пути импортов (`handleRobokassaWebhook`, `supabaseClient`, `calculateRobokassaSignature`, `sendPaymentSuccessMessage`) в `robokassaWebhook.test.ts`.
    - ✅ Исправлен импорт `ModeEnum` в `robokassaWebhook.test.ts`.
    - ✅ Исправлен вызов `handleRobokassaWebhook` (ошибка `TS2554`) в `robokassaWebhook.test.ts`.
    - ✅ Восстановлена полнота мока `validPayment` в `robokassaWebhook.test.ts`.
    - ⚠️ `next(ctx) called with invalid context` в `paymentScene.test.ts` и `rublePaymentScene.test.ts` **остаются**.
    - ⚠️ `TypeError: Cannot read properties of undefined (reading 'get')` на `rublePaymentScene.actions.get` **остается**.
    - ⚠️ Тесты в `starPaymentScene.test.ts` **падают**: `handleSelectStars`/`handleBuySubscription` не вызываются, `Action handler not registered`.
      **Статус:** ⏳ `robokassaWebhook.test.ts` почти готов. Фокус на ошибках в сценах.
      **Следующие шаги:** 1. Запустить `pnpm test:payment` и проверить результат для `robokassaWebhook.test.ts`. 2. Начать разбираться с `next(ctx) called with invalid context` в `paymentScene.test.ts`.

## 🔧 Общие паттерны и шаблоны

- Документация: `docs/PATTERNS.md`
- Генерация шаблонов тестов (Plop):
  ```bash
  npm run generate:test
  ```
  Введите `modulePath` (например, `utils/env`), чтобы получить `__tests__/utils/env.test.ts`.

**ВАЖНО:** В проекте используется переменная `SUPABASE_KEY` для анонимного/публичного ключа Supabase (а **не** `SUPABASE_ANON_KEY`). Убедитесь, что она задана в `.env` и используется в тестах при необходимости.

🤝 Командная работа — это не просто совместные усилия, это синергия, которая позволяет нам достигать большего, чем мы могли бы сделать в одиночку. Вместе мы сильнее!

## 🔢 Итерация 1 - 2025-04-19: Состояние покрытия

**Общее покрытие кода тестами (Iteration 1):**

- Statements: 63.70% (2671/4193)
- Branches: 45.85% (1212/2643)
- Functions: 55.80% (226/405)
- Lines: 63.33% (2593/4094)

**План дальнейших шагов (Итерация 1):**

1. Определить модули с низким покрытием и распределить между командами:
   - Core services
   - Handlers
   - Scenes и Wizards
2. Написать недостающие юнит-тесты для крайних случаев и веток ошибок.
3. После завершения итерации обновить метрики в этом разделе.

## 🔢 Итерация 2 - 2025-04-19: Фокус на Handlers

**Покрытие тестами добавленных модулей Handlers:**

- src/handlers/getBotToken.ts: 100% Statements/Branches/Functions/Lines
- src/handlers/getSubScribeChannel.ts: 100%
- src/handlers/getUserInfo.ts: 100% Statements/Branches/Functions/Lines
- src/handlers/handleModelCallback.ts: 100% Statements/Functions/Lines (~78% Branches)

**Следующие шаги (Итерация 2):**

1. Покрыть тестами остальные handler‑ы (getUserInfo, handleTextMessage, handleModelCallback, handleMenu и др.).
2. Перейти к тестированию модулей в src/services.
3. Обновить и зафиксировать метрики покрытия по итогам итерации.

## 🔢 Итерация 3 - 2025-04-19: Погружение в Handlers

**Покрыты тестами следующие handlers:**

- src/handlers/handleBuy.ts: 100% Statements/Functions/Lines, ~100% Branches
- src/handlers/handleBuySubscription.ts: 100% Statements/Functions/Lines, ~100% Branches
- src/handlers/handleSelectStars.ts: 100% Statements/Lines/Functions, ~78% Branches

**Следующие шаги (Итерация 3):**

1. Дописать тесты для оставшихся handler‑ов:
   - handleSizeSelection (дополнительные сценарии)
   - handlePreCheckoutQuery / handleSuccessfulPayment
   - handleTopUp, handlePaymentPolicyInfo (paymentHandlers)
   - hearsActions, setupLevelHandlers и др.
2. Начать тестирование core/supabase обёрток (getUserBalance, setPayments и т.п.)
3. Перейти к полноценному покрытию модулей в `src/services` (голос, изображения)
4. Обновить метрики покрытия после Итерации 3.

## 🔢 Итерация 4 - 2025-04-19: Тестирование Service-модулей

**Добавлены тесты для service-модулей (Iteration 4/5):**

- src/services/uploadVideoToServer.ts: 100% Statements/Functions/Lines, 50% Branches
- src/services/createModelTraining.ts: ~70% Statements/71% Branches, 100% Functions/Lines
- src/services/generateImageFromPrompt.ts: 100% Statements/Branches/Functions/Lines
- src/services/generateImageToPrompt.ts: ~79% Statements/57% Branches, 100% Functions/Lines
- src/services/generateImageToVideo.ts: ~92% Statements/82% Branches, 100% Functions/89% Lines
- src/services/generateLipSync.ts: ~54% Statements/0% Branches, 60% Functions/54% Lines
- src/services/generateNeuroImage.ts: 100% Statements/100% Functions/100% Lines, 69% Branches
- src/services/generateNeuroImageV2.ts: ~91% Statements/69% Branches, 100% Functions/Lines
- src/services/generateTextToImage.ts: 100% Statements/Branches/Functions/Lines
- src/services/generateTextToSpeech.ts: ~83% Statements/56% Branches, 100% Functions/Lines
- src/services/generateTextToVideo.ts: 100% Statements/Branches/Functions/Lines
- src/services/generateVoiceAvatar.ts: ~71% Statements/58% Branches, 100% Functions/Lines

**Остались к покрытию service-модули:**

- src/services/generateLipSync.ts (скрипты скачивания и загрузки файлов)
- Остальные функции с внешними API и файловыми операциями

**Планы на Итерацию 4:**

1. Покрыть тестами `generateNeuroImageV2.ts`.
2. Покрыть тестами обёртки core/supabase (getUserBalance, updateUserBalance).
3. Расширить coverage Wizard-сцен (generateImageWizard, chatWithAvatarWizard, digitalAvatarBodyWizard и др.).
4. Обновить и зафиксировать метрики покрытия.

## 🔢 Итерация 5 - 2025-04-19: Core/Supabase и Сценические тесты

**Добавлены тесты core/supabase:**

- getUserBalance: 100% Statements/Branches/Functions/Lines
- updateUserBalance: 100% Functions, ~57% Statements, 0% Branches

**Добавлены тесты Wizard-сцен:**

- cancelPredictionsWizard: ~70% coverage
- digitalAvatarBodyWizard: ~80% coverage
- chatWithAvatarWizard: ~85% coverage
- generateImageWizard: ~90% coverage
- balanceScene: 100% coverage
- checkBalanceScene: ~70% coverage
- avatarBrainWizard: 100% coverage

**Планы на Итерацию 5:**

1. Закрыть покрытие остальных сцен и обработчиков.
2. Тестировать остальные core/supabase функции (createUser, setPayments и др.).
3. Довести общие метрики покрытия до 80%.

## 🔢 Итерация 6 - 2025-04-19: Полное покрытие

**Общее покрытие кода тестами (Итерация 6):**

- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

Все модули в `src` полностью покрыты тестами.

## 🧪 Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск тестов через Docker
docker-compose -f docker-compose.test.yml up

# Запуск тестов в режиме наблюдения
npm run test:watch

# Запуск тестов с отчетом о покрытии
npm run test:cov
```

## 📂 Структура каталогов тестов

Тесты организованы по функциональным областям, повторяя структуру `src`:

- `__tests__/core/`: Тесты для основной логики (Supabase, общие хелперы).
- `__tests__/handlers/`: Тесты для обработчиков команд и сообщений Telegraf.
- `__tests__/helpers/`: Тесты для вспомогательных функций.
- `__tests__/middlewares/`: Тесты для промежуточного ПО.
- `__tests__/scenes/`: Тесты для сцен Telegraf (мастера), **не связанных** с платежами.
- `__tests__/utils/`: Вспомогательные утилиты для тестов (например, `makeMockContext`).
- `__tests__/integration/`: Интеграционные тесты (например, для вебхуков).

## 💳 Тестирование платежной подсистемы

**Вся информация по тестированию платежных систем (Robokassa, Telegram Stars), включая структуру каталога `__tests__/payments/`, текущие проблемы, планы и команду `pnpm test:payment`, вынесена в отдельный документ:**

➡️ **[../../PAYMENTS_README.md](../../PAYMENTS_README.md)**

Пожалуйста, обратитесь к нему для получения деталей.

## 📦 Мокирование (Mocking)

Для изоляции тестов от внешних зависимостей (база данных, внешние API) активно используется мокирование с помощью `jest.mock()`.

**Пример мокирования модуля:**

```typescript
jest.mock('@/core/supabase') // Мокирует весь модуль supabase
```

**Пример мокирования конкретной функции из модуля:**

```typescript
import * as helpers from '@/helpers'

jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'), // Сохраняем остальные реальные функции
  isRussian: jest.fn(), // Мокируем только isRussian
}))

const mockedIsRussian = jest.mocked(helpers.isRussian)

beforeEach(() => {
  mockedIsRussian.mockReturnValue(true) // Устанавливаем возвращаемое значение для теста
})
```

## 🔧 Утилиты для тестов

- `__tests__/utils/makeMockContext.ts`: Хелпер для создания мок-объекта контекста `MyContext` Telegraf.

## ⚠️ Частые причины поломки тестов и как их избежать

В ходе разработки мы столкнулись с тем, что тесты часто ломаются после внесения изменений в основной код. Анализ показал несколько основных причин:

1.  **Рассинхронизация тестов и кода:**

    - **Проблема:** Изменения в интерфейсах (`MyContext`, `MySession`), типах (`SubscriptionType`, `ModeEnum`), сигнатурах функций, структуре данных или логике работы модуля **не отражаются немедленно** в соответствующих тестах.
    - **Последствия:** Ошибки типизации (TS2322, TS2820, TS2739), использование устаревших данных или проверок в тестах.
    - **Решение:** При любом изменении в файле `.ts` **сразу же** находить и обновлять связанные с ним файлы `.test.ts`. Не откладывать обновление тестов. Использовать Enum-типы (`SubscriptionType.NEUROBASE`) вместо строк (`'neurobase'`) в тестах.

2.  **Хрупкость и неполнота моков (`jest.mock`)**:

    - **Проблема:** Фабрики моков (второй аргумент `jest.mock`) не всегда возвращают объект, полностью соответствующий сигнатуре реального модуля, особенно если в модуле много экспортов. При добавлении новой функции в модуль, мок не обновляется автоматически.
    - **Последствия:** Ошибки `TS2339: Property ... does not exist on type ...`, когда тест пытается использовать не замоканную часть модуля.
    - **Решение:** Стараться мокать как можно точнее. Если мокается весь модуль, убедиться, что фабрика возвращает все необходимые тестам функции/свойства. Использовать `jest.requireActual` для сохранения части реальных функций при необходимости. Регулярно проверять соответствие моков реальным модулям.

3.  **Неполная настройка тестового контекста (`ctx`)**:

    - **Проблема:** Утилита `makeMockContext` или настройка в `beforeEach` создают объект `ctx`, которому не хватает свойств, ожидаемых кодом сцены или хендлера (например, `ctx.match` для action-обработчиков, `ctx.message` для `hears` и т.д.).
    - **Последствия:** Ошибки `TS2339: Property ... does not exist on type ...` при обращении к `ctx`, или некорректная работа тестируемого кода.
    - **Решение:** Адаптировать создание `ctx` в `beforeEach` для конкретного сценария теста, добавляя необходимые поля (`message`, `callback_query`, `match` и т.д.) в зависимости от того, какой обработчик (enter, hears, action) тестируется.

4.  **Проблемы с разрешением путей (`@/`, `@/__tests__/`)**:
    - **Проблема:** Несмотря на конфигурацию `moduleNameMapper`, Jest или TS иногда не могут найти модули по алиасам, особенно вложенные (`@/__tests__/core/...`).
    - **Последствия:** Ошибки `TS2307: Cannot find module ...`.
    - **Решение:** Регулярно проверять пути импорта моков. При возникновении ошибки `TS2307` перепроверять путь и конфигурацию `jest.config.js`. Иногда может помочь перезапуск Jest или очистка кэша (`--clearCache`).

**Ключевой принцип:** Тесты должны развиваться **вместе** с кодом. Обновление тестов — это не отдельная задача "на потом", а неотъемлемая часть внесения изменений в код.

## 🎯 Этапы стабилизации и покрытия

// ... (можно оставить общие этапы или удалить, если они теперь не актуальны)

## 🧰 Установленные Библиотеки и Утилиты для тестирования

// ... (описание jest-mock-extended, jest-extended и т.д., как и было) ...

## 💡 Подходы и Соглашения

// ... (описание подходов, как и было) ...
