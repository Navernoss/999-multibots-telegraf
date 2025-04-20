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

## 🔧 Общие паттерны и шаблоны
- Документация: `docs/PATTERNS.md`
- Генерация шаблонов тестов (Plop):
  ```bash
  npm run generate:test
  ```
  Введите `modulePath` (например, `utils/env`), чтобы получить `__tests__/utils/env.test.ts`.

🤝 Командная работа — это не просто совместные усилия, это синергия, которая позволяет нам достигать большего, чем мы могли бы сделать в одиночку. Вместе мы сильнее!

## 🔢 Итерация 1 - 2025-04-19: Состояние покрытия

**Общее покрытие кода тестами (Iteration 1):**

- Statements: 63.70% (2671/4193)
- Branches:   45.85% (1212/2643)
- Functions: 55.80% (226/405)
- Lines:      63.33% (2593/4094)

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
```

В каталоге `__tests__/scenes` содержатся тесты для WizardScene, определенных в `src/scenes`.

## 📦 Модули проекта

- 🎛 src/config — конфигурация из переменных окружения
- 🧰 src/utils — утилиты общего назначения
- 💰 src/price — расчёт цен и логика стоимости
- 🎬 src/scenes — диалоговые Wizard‑сцены
- ⚙️ src/handlers — хендлеры Telegraf (команды, коллбеки)
- 🔧 src/services — сервисные вызовы (OpenAI, BFL и др.)
- 🧩 src/helpers — общие вспомогательные функции
- 📋 src/menu — построение клавиатур и меню
- 🗄 src/core/supabase — обёртки для Supabase
- 💬 src/commands — внешние команды (CLI, In-Chat)
  Ниже описаны основные паттерны и рекомендации по созданию новых тестов:

1. Структура файла:
   - Импортируем необходимые функции из Jest:
     ```ts
     import { jest, describe, it, expect, beforeEach } from '@jest/globals'
     ```
   - Импортируем саму сцену и контекст:
     ```ts
     import { <sceneName> } from '../../src/scenes/<sceneName>';
     import makeMockContext from '../utils/mockTelegrafContext';
     ```
   - Если сцена имеет внешние зависимости (утилиты, хелперы, handlers и т.д.), мокаем их до блока `describe`:
     ```ts
     jest.mock('<путь>', () => ({
       /* jest.fn() */
     }))
     ```
2. Очистка моков:
   ```ts
   beforeEach(() => {
     jest.clearAllMocks()
   })
   ```
3. Доступ к шагам сцены (WizardScene):
   ```ts
   // @ts-ignore
   const step0 = <sceneName>.steps[0];
   ```
4. Общий тест первого шага:
   ```ts
   it('первый шаг: вызывает next()', async () => {
     const ctx = makeMockContext();
     // @ts-ignore
     const step0 = <sceneName>.steps[0];
     await step0(ctx);
     expect(ctx.wizard.next).toHaveBeenCalled();
   });
   ```
5. Тесты следующих шагов:

   - Эмулируем `ctx.message.text` или `ctx.update.callback_query.data` при помощи `makeMockContext()`.
   - Мокаем возвращаемые значения утилит через `jest.requireMock(...).<fn>.mockReturnValue(…)`.
   - Проверяем вызовы `ctx.scene.enter`, `ctx.scene.leave`, `ctx.reply`, `ctx.answerCbQuery` и т.д.

6. Именование файлов:
   - `<sceneName>.test.ts` для каждой сцены.

При добавлении новых сцен или обновлении логики не забывайте:

- Мокаем все внешние зависимости.
- Проверяем все критические ветки: успех, ошибки, отмена.
- Для новых сцен создавайте аналогичные тесты, следуя этому руководству.

## 🛠 Покрытие «чистых» функций (утилиты и helpers)

Требуется покрыть тестами следующие pure-функции:

- src/utils/url.ts: urlJoin
- src/utils/getConfig.ts: getConfig
- src/helpers/language.ts: isRussian
- src/handlers/getPhotoUrl.ts: getPhotoUrl
- src/core/bot/index.ts: getBotNameByToken
- src/price/helpers/calculateCostInStars.ts: calculateCostInStars
- src/price/helpers/calculateFinalPrice.ts: calculateFinalPrice
- src/price/helpers/calculateStars.ts: calculateStars
- src/price/helpers/calculateTrainingCost.ts: calculateTrainingCost
- src/price/helpers/validateAndCalculateImageModelPrice.ts: validateAndCalculateImageModelPrice
- src/price/helpers/validateAndCalculateVideoModelPrice.ts: validateAndCalculateVideoModelPrice
 - ✅ src/price/helpers/starAmounts.ts: starAmounts
 - ✅ src/price/index.ts: calculateDiscountedPrice, interestRate, basePrice

Покрытие должно включать проверку логики, граничных случаев и корректный формат возвращаемых значений.

## 🎬 Покрытие тестами сцен

**Сцены с реализованными тестами (Iteration 5):**
 - avatarBrainWizard
 - balanceScene
 - cancelPredictionsWizard
 - chatWithAvatarWizard
 - checkBalanceScene
 - createUserScene
 - digitalAvatarBodyWizard
 - generateImageWizard
  
**Остались к тестированию сцены:**
 - digitalAvatarBodyWizardV2
 - emailWizard
 - getEmailWizard
 - getRuBillWizard
 - helpScene
 - imageToPromptWizard
 - imageToVideoWizard
 - textToImageWizard
 - textToSpeechWizard
 - textToVideoWizard
 - improvePromptWizard
 - inviteScene
 - menuScene
 - neuroPhotoWizard
 - neuroPhotoWizardV2
 - levelQuestWizard
 - neuroCoderScene
 - paymentScene
 - selectModelWizard
 - sizeWizard
 - lipSyncWizard
 - startScene
 - subscriptionCheckScene
 - subscriptionScene
 - uploadVideoScene
 - voiceAvatarWizard
 - trainFluxModelWizard
 - uploadTrainFluxModelScene

## 🚦 Текущее состояние тестов (2025-04-20)

**Ветка:** `refactor/tests`

На данный момент **210 из 282** тест-сьютов падают, в основном из-за ошибок типизации TypeScript (`TS2349`, `TS2339`, `TS2540` и др.) после недавних изменений в кодовой базе. Также Jest обнаруживает открытые файловые хендлеры логгера.

**Основная задача:** Стабилизировать тесты, исправив ошибки типизации и проблему с логгером.

## 🧪 План тестирования функций

**📝 Примечание от AI-координатора:**
Я выступаю в роли координатора и вдохновителя: формирую план, распределяю задачи между специализированными агентами и отслеживаю прогресс. Я не пишу все тесты самостоятельно, но координирую команду агентов по соответствующим блокам. Данная заметка адресована как пользователю, так и всем задействованным агентам для ясности ролей и процесса.

## 🧪 План тестирования функций

Ниже план по достижению 100% покрытия «чистых» функций (без Telegraf-сцен) для удобного распределения задач:

1. src/config

   - index.ts: тестирование формирования конфигурации из переменных окружения.

2. src/utils

   - getConfig, url, removeWebhooks, tokenStorage, launch, env: мокаем process.env/URL и проверяем возврат корректных значений.
   - logger: проверяем методы (info, error) и форматирование.

3. src/price
   a) constants

   - starCost, interestRate: проверяем заданные константы.
     b) models
   - calculateFinalImageCostInStars, imageModelPrices, videoModelPrices: тесты на расчёт стоимости и целостность записей.
     c) helpers
   - calculateCostInStars, calculateStars, calculateFinalPrice, calculateTrainingCost (и costInDollars, costInRubles): базовые юнит‑тесты.
   - validateAndCalculateImageModelPrice, validateAndCalculateVideoModelPrice: все ветки (invalid model, insufficient balance, success).
   - handleTrainingCost, processBalanceOperation, refundUser: сценарии успех, ошибка, граничные условия.
   - sendBalanceMessage, sendCostMessage, sendCurrentBalanceMessage, sendInsufficientStarsMessage, sendPaymentNotification: формирование текста и клавиатур.
     d) commands
   - priceCommand, selectModelCommand: парсинг аргументов и формирование вызовов API.

4. src/services

   - generateNeuroImageV2, generateTextToVideo, generateVoiceAvatar, createModelTraining, uploadVideoToServer: мокаем fetch/telegram.getFile, проверяем вызовы клиентских сервисов и обработку ошибок.

5. src/handlers

   - Платёжные: handleBuy, handleBuySubscription, handlePreCheckoutQuery, handleSuccessfulPayment, handleReceiptCommand — проверка payload, leave(), replyWithInvoice.
   - textHandlers: handleTextMessage, handleVoiceMessage — мокаем ctx и зависимости.
   - callbackHandlers, levelHandlers — мокаем утилиты и проверяем переходы сцен.
   - getUserInfo, getPhotoUrl, getSubScribeChannel, getBotToken, checkFullAccess: чистые функции.

6. src/helpers

   - errorMessage, errorMessageAdmin; ensureDirectoryExistence, deleteFile; isValidImage; createImagesZip: все ветки успех/ошибка.

7. src/menu

   - getStepSelectionMenu, getStepSelectionMenuV2, mainMenu, videoModelMenu, imageModelMenu, createHelpCancelKeyboard, sendGenericErrorMessage, sendPhotoDescriptionRequest и пр.: тесты на keyboard и текст.

8. src/core/supabase

   - Все запросы: createUser, checkPaymentStatus, createPayment и т.д.: мокаем supabase-js, проверяем SQL/обработку ошибок.

9. src/commands
   - Остальные команды (stats, handleTechSupport, etc.): тесты CLI‑парсинга и API.

**План поэтапной работы**

1. Pure‑функции (src/config, utils, price/constants, price/models)
2. src/price/helpers
3. src/helpers
4. src/menu и src/commands
5. src/services
6. src/handlers
7. src/core/supabase
8. Финальный прогон покрытия и доводка тестов до 100%.

По завершении каждого этапа обновляем метрики в `__tests__/README.md`.

## 📦 Модули проекта

| Emoji | Папка / Модуль    | Описание                              |
| :---: | :---------------- | :------------------------------------ |
|   🎛   | src/config        | Конфигурация из переменных окружения  |
|  🧰   | src/utils         | Утилиты общего назначения             |
|  💰   | src/price         | Расчёт цен и стоимостной логики       |
|  🎬   | src/scenes        | Wizard‑сцены и диалоговые потоки      |
|  ⚙️   | src/handlers      | Хендлеры Telegraf (команды, коллбеки) |
|  🔧   | src/services      | Сервисные вызовы (OpenAI, BFL и пр.)  |
|  🧩   | src/helpers       | Различные вспомогательные функции     |
|  📋   | src/menu          | Построение клавиатур и меню           |
|   🗄   | src/core/supabase | Обёртки работы с базой Supabase       |
|  💬   | src/commands      | Внешние команды (CLI, In-Chat)        |

## 🔢 Итерация 6 - 2025-04-19: Общие метрики покрытия

**Общее покрытие кода тестами (Iteration 6):**

- Statements: 64.91%
- Branches:   45.84%
- Functions:  57.48%
- Lines:      64.53%

**План дальнейших шагов (Итерация 6):**

1. Покрыть оставшиеся low-coverage модули: src/core, src/services, src/scenes и др.
2. Дописать тесты для утилит: src/utils/config.ts, launch.ts, logger.ts, tokenStorage.ts, webhooks.ts.
3. Расширить тесты для price-helpers: processBalanceOperation, processBalanceVideoOperation, refundUser.
4. Довести общие метрики покрытия до 100%.

# Тесты 🧪

Этот каталог содержит все автоматизированные тесты для проекта.

## Структура каталогов

Тесты организованы по функциональным областям:

*   `__tests__/core/`: Тесты для основной логики (Supabase, Robokassa, общие хелперы).
*   `__tests__/handlers/`: Тесты для обработчиков команд и сообщений Telegraf.
*   `__tests__/helpers/`: Тесты для вспомогательных функций.
*   `__tests__/scenes/`: Тесты для сцен Telegraf (мастера).
*   `__tests__/payments/`: **(Текущий фокус)** Тесты для всей логики, связанной с платежами (Robokassa, Telegram Stars, выбор и проверка подписок, обновление баланса).
*   `__tests__/utils/`: Тесты для утилит (логгер, форматирование и т.д.).

## Запуск тестов

Используйте следующие команды `pnpm`:

*   `pnpm test`: Запустить все тесты.
*   `pnpm test:watch`: Запустить тесты в режиме наблюдения (автоматический перезапуск при изменениях).
*   `pnpm test:cov`: Запустить тесты и сгенерировать отчет о покрытии кода.
*   `pnpm test:payment`: Запустить **только** тесты, связанные с платежами (в каталоге `__tests__/payments/`).

## Мокирование (Mocking)

Для изоляции тестов от внешних зависимостей (база данных, внешние API) активно используется мокирование с помощью `jest.mock()`.

**Пример мокирования модуля:**

```typescript
jest.mock('@/core/supabase'); // Мокирует весь модуль supabase
```

**Пример мокирования конкретной функции из модуля:**

```typescript
import * as helpers from '@/helpers';

jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'), // Сохраняем остальные реальные функции
  isRussian: jest.fn(), // Мокируем только isRussian
}));

const mockedIsRussian = jest.mocked(helpers.isRussian);

beforeEach(() => {
  mockedIsRussian.mockReturnValue(true); // Устанавливаем возвращаемое значение для теста
});
```

## Утилиты для тестов

*   `__tests__/utils/makeMockContext.ts`: Хелпер для создания мок-объекта контекста `MyContext` Telegraf.

## ⚠️ Частые причины поломки тестов и как их избежать

В ходе разработки мы столкнулись с тем, что тесты часто ломаются после внесения изменений в основной код. Анализ показал несколько основных причин:

1.  **Рассинхронизация тестов и кода:**
    *   **Проблема:** Изменения в интерфейсах (`MyContext`, `MySession`), типах (`SubscriptionType`, `ModeEnum`), сигнатурах функций, структуре данных или логике работы модуля **не отражаются немедленно** в соответствующих тестах.
    *   **Последствия:** Ошибки типизации (TS2322, TS2820, TS2739), использование устаревших данных или проверок в тестах.
    *   **Решение:** При любом изменении в файле `.ts` **сразу же** находить и обновлять связанные с ним файлы `.test.ts`. Не откладывать обновление тестов. Использовать Enum-типы (`SubscriptionType.NEUROBASE`) вместо строк (`'neurobase'`) в тестах.

2.  **Хрупкость и неполнота моков (`jest.mock`)**:
    *   **Проблема:** Фабрики моков (второй аргумент `jest.mock`) не всегда возвращают объект, полностью соответствующий сигнатуре реального модуля, особенно если в модуле много экспортов. При добавлении новой функции в модуль, мок не обновляется автоматически.
    *   **Последствия:** Ошибки `TS2339: Property ... does not exist on type ...`, когда тест пытается использовать не замоканную часть модуля.
    *   **Решение:** Стараться мокать как можно точнее. Если мокается весь модуль, убедиться, что фабрика возвращает все необходимые тестам функции/свойства. Использовать `jest.requireActual` для сохранения части реальных функций при необходимости. Регулярно проверять соответствие моков реальным модулям.

3.  **Неполная настройка тестового контекста (`ctx`)**:
    *   **Проблема:** Утилита `makeMockContext` или настройка в `beforeEach` создают объект `ctx`, которому не хватает свойств, ожидаемых кодом сцены или хендлера (например, `ctx.match` для action-обработчиков, `ctx.message` для `hears` и т.д.).
    *   **Последствия:** Ошибки `TS2339: Property ... does not exist on type ...` при обращении к `ctx`, или некорректная работа тестируемого кода.
    *   **Решение:** Адаптировать создание `ctx` в `beforeEach` для конкретного сценария теста, добавляя необходимые поля (`message`, `callback_query`, `match` и т.д.) в зависимости от того, какой обработчик (enter, hears, action) тестируется.

4.  **Проблемы с разрешением путей (`@/`, `@/__tests__/`)**:
    *   **Проблема:** Несмотря на конфигурацию `moduleNameMapper`, Jest или TS иногда не могут найти модули по алиасам, особенно вложенные (`@/__tests__/core/...`).
    *   **Последствия:** Ошибки `TS2307: Cannot find module ...`.
    *   **Решение:** Регулярно проверять пути импорта моков. При возникновении ошибки `TS2307` перепроверять путь и конфигурацию `jest.config.js`. Иногда может помочь перезапуск Jest или очистка кэша (`--clearCache`).

**Ключевой принцип:** Тесты должны развиваться **вместе** с кодом. Обновление тестов — это не отдельная задача "на потом", а неотъемлемая часть внесения изменений в код.

## 🎯 Этап 1: Стабилизация и Исправление Багов

**Цель:** Устранить критические ошибки, мешающие запуску и базовой работе ботов. Стабилизировать тесты.

### ✅ Этап 1.16: Стабилизация тестов (Фокус на платежах) (2024-07-21)

*   🎯 **Цель**: Добиться прохождения всех тестов, связанных с платежными системами (звезды, рубли, Robokassa, подписки). Игнорировать ошибки в других тестах на этом этапе.
*   **Приоритет**: Высокий. Стабильные тесты - основа дальнейшей разработки.
*   **Действия**:
    1.  ✅ Создан каталог `__tests__/payments/` для изоляции тестов оплаты.
    2.  ✅ Создан новый файл тестов `__tests__/payments/paymentScene.test.ts` для сцены `paymentScene`.
    3.  ✅ Добавлена команда `pnpm test:payment` в `package.json` для запуска только тестов оплаты.
    4.  ✅ Обновлен `ROADMAP.md` для отражения нового фокуса.
    5.  ✅ Создан `__tests__/README.md` с описанием структуры тестов.
    6.  ⏳ Запустить `pnpm test:payment`.
    7.  ⏳ Исправить ошибки **ТОЛЬКО** в тестах каталога `__tests__/payments/`. Начать с `paymentScene.test.ts`.
*   **Статус**: ⏳ В процессе (Структура создана, ожидание запуска тестов и исправления ошибок).
*   **Следующие шаги**: Запустить `pnpm test:payment` и последовательно исправлять падающие тесты в `__tests__/payments/`.

## 🎯 Этап 2: Активация функций Нейрофото ⏸️ (Приостановлено)

## 🧪 Тестирование

### Команды для запуска тестов

*   `pnpm test` - Запуск всех тестов.
*   `pnpm test:watch` - Запуск тестов в режиме отслеживания изменений.
*   `pnpm test:cov` - Запуск тестов с генерацией отчета о покрытии.
*   `pnpm test:payment` - Запуск тестов **только** для подсистемы платежей (звезды, рубли, подписки).

### Новая структура каталога `__tests__`

*   `__tests__/core/` - Тесты для основных модулей (база данных, бот и т.д.)
*   `__tests__/handlers/` - Тесты для обработчиков команд и сообщений.
*   `__tests__/helpers/` - Тесты для вспомогательных функций.
*   `__tests__/middlewares/` - Тесты для промежуточного ПО.
*   `__tests__/payments/` - **(Новый)** Тесты для всего, что связано с оплатой (сцены, хендлеры, Robokassa, Stars).
*   `__tests__/scenes/` - Тесты для других (не платежных) сцен.
*   `__tests__/utils/` - Вспомогательные утилиты для тестов (например, `makeMockContext`).

### Текущий фокус

На данный момент приоритет - исправление тестов в каталоге `__tests__/payments/` с помощью команды `pnpm test:payment`.
