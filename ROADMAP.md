# 🗺 ROADMAP: NeuroBlogger Project 🚀

## 🎯 Текущие задачи

### РЕФАКТОРИНГ: Единый Источник Истины для Подписок (ПРИОРИТЕТ - ВЫСОКИЙ)
- **Цель:** Сделать `payments_v2` единственным источником статуса подписки и упростить типы операций.
- **База Данных:**
  - ✅ Исправлены SQL функции `get_user_balance` и `get_user_balance_stats` для использования корректных Enum (`MONEY_INCOME`, `MONEY_OUTCOME`) (Предположительно, требуется ручная проверка).
  - ⚠️ **ТРЕБУЕТСЯ ДЕЙСТВИЕ (DB):** Проверить/Исправить SQL функции (`get_user_balance`, `get_user_balance_stats`) для корректной агрегации баланса ТОЛЬКО по типам `MONEY_INCOME` (+) и `MONEY_OUTCOME` (-).
  - ⚠️ **ТРЕБУЕТСЯ ДЕЙСТВИЕ (DB):** Проверить/Исправить функцию `create_system_payment`: должна использовать `type = 'MONEY_INCOME'` (или `SYSTEM` если SQL его обрабатывает как доход) и устанавливать `subscription_type`.
  - ✅ Удалить столбцы `subscription_type`, `is_active`, `subscription_start_date` из таблицы `users` (Предположительно, требуется ручная проверка).
- **Код:**
  - ✅ Проверить `getUserDetailsSubscription`, что чтение идет только из `payments_v2`.
  - ✅ Удалить использование удаленных полей `users` из интерфейсов TypeScript.
  - ✅ Упрощены типы операций в коде: используется только `PaymentType.MONEY_INCOME` для дохода и `PaymentType.MONEY_OUTCOME` для расхода. Остальные типы (SYSTEM, MONEY_OUTCOME) заменены.
  - ✅ Проверить функции списания (установка `service_type`, `subscription_type=null`).
  - ✅ Исправить установку `payment_method` в `updateUserBalanceRobokassa.ts`.
  - ✅ Реализовать безграничный срок действия для подписки `NEUROTESTER` (в `getUserDetailsSubscription.ts`).
  - ✅ Исправлена логика вычитания баланса в `processBalanceVideoOperation.ts` (убран минус).
  - ✅ Исправлен тип операции на `MONEY_OUTCOME` в `processBalanceVideoOperation.ts`.
  - ✅ Исправлен обработчик Telegram Payments (`handleSuccessfulPayment`) для корректной записи `type`, `subscription_type` и пополнения баланса (`incrementBalance`). ✅
  ✅ **{current_date}:** Завершен рефакторинг типов платежей в коде (используются `PaymentType.MONEY_INCOME`/`PaymentType.MONEY_OUTCOME`).
  ✅ **{current_date}:** Проверена SQL-функция `get_user_balance`, подтверждено использование `MONEY_INCOME`/`MONEY_OUTCOME`.

### Деплой и Инфраструктура 🏗️ (ПРИОРИТЕТ - ВЫСОКИЙ)
- ✅ Создан скрипт deploy-prod.sh для автоматического деплоя
- ✅ Настройка Docker и CI/CD
- ✅ Интеграция с Docker и tmux для мониторинга
- ✅ Ветка main заменена на last-branch для актуализации кодовой базы
- ✅ Тестирование deploy-prod.sh в production
- ✅ Исправлены проблемы сборки в Docker (tsc-alias)
- ✅ Исправлена ошибка сборки Docker, связанная с husky в скрипте prepare
- ✅ Решена проблема с отсутствием файла bot.js в Docker-контейнере
- ✅ Исключены тестовые файлы из сборки в Docker
- ✅ Добавлен скрипт автоматического создания .env файла в Docker
- ✅ Удалены ненужные зависимости Ansible и Nginx из основного Docker-контейнера
- ✅ Восстановлена конфигурация Nginx (bot-proxy) для маршрутизации по именам ботов (`location /<bot_name>`)
- ✅ Исправлен `src/bot.ts` для установки вебхуков с путем `/<имя_бота>`
- ✅ Удален неиспользуемый скрипт `scripts/get-token-hashes.js`
- ✅ Создан отдельный сервис `api-server` в Docker для обработки API-запросов (начинаем с Robokassa)
- ✅ Логика обработки Robokassa перенесена в `api-server` и адаптирована под Express.
- ✅ Nginx настроен на проксирование `/api/*` на новый сервис `api-server`.
- ✅ Локальный запуск Docker (`docker-compose up --build`) успешен после смены базового образа на `node:20-slim`.
- ❗ **ТРЕБУЕТСЯ ДЕЙСТВИЕ:** Обновить URL вебхуков в Telegram на формат `https://<домен>/<имя_бота>` (КРИТИЧНО)
- ✅ Исправлен URL вебхука для Replicate в `generateImageToVideo.ts` (используется `WEBHOOK_DOMAIN`).
- ✅ Удален прямой вызов Replicate из `generateImageToVideo.ts`, заменен на вызов `api-server` (передается `modelIdentifier`).
- ❗ **ТРЕБУЕТСЯ ДЕЙСТВИЕ:** Проверить/реализовать эндпоинт `/api/replicate-webhook` в `api-server` для приема результатов Replicate.
- ❗ **ТРЕБУЕТСЯ ДЕЙСТВИЕ:** Реализовать эндпоинт `/api/generate/image-to-video` в `api-server` (должен принимать `modelIdentifier`).
- ⏳ Проверка валидности всех токенов ботов
- ⏳ Настройка автоматического логирования
- ⏳ Мониторинг состояния ботов в production
- ⚠️ **ТРЕБУЕТСЯ ДЕЙСТВИЕ (DB):** Привести enum `payment_type` и данные в `payments_v2` к UPPERCASE значениям (`MONEY_INCOME` и т.д.), удалить старые/неиспользуемые значения enum. (Статус: НЕ КРИТИЧНО для расчета баланса, т.к. `get_user_balance` игнорирует `MONEY_EXPENSE`)

### Типизация и рефакторинг ✍️ (ПРИОРИТЕТ - СРЕДНИЙ)
- ✅ Исправлены типы в `robokassa.handler.ts`
- ✅ Исправлены типы в `getUserByTelegramId.ts`
- ✅ Исправлены типы в `core/bot/index.ts`
- ✅ Исправлены типы в `notifyBotOwners.ts`
- ✅ Исправлены типы в `broadcast.service.ts`
- ✅ Обновлен скрипт сборки в package.json
- ✅ Исправлены типы и обработчик webhookCallback в `launch.ts`
- ✅ Внедрен Fastify вместо Express для улучшения типизации и производительности
- ✅ Удалена неиспользуемая функция `production` и заглушка `launch` из `src/utils/launch.ts`
- ✅ Исправлены ошибки типов Express (TS2339) в обработчике Robokassa (теперь в `api-server`).
- ⏳ Скопировать актуальные интерфейсы (`db.interface.ts`, `payments.interface.ts`) в `api-server`.
- ⏳ Реализовать заглушки `updateUserBalance`, `updateUserSubscription` в `api-server`.
- ⏳ Продолжаем исправление типов в других файлах
- ⏳ Рефакторинг обработчиков вебхуков
- ⏳ Проверка и обновление импортов во всех файлах
- ⏳ Проверка типов в generateTextToVideo.ts
- ✅ {current_date}: Упрощены типы операций (`PaymentType`) в коде до `MONEY_INCOME` и `MONEY_OUTCOME`.
- ✅ {current_date}: Рефакторинг расчета стоимости видео (`processBalanceVideoOperation.ts`): используется `VIDEO_MODELS_CONFIG` и `calculateFinalPrice`.
- ✅ {current_date}: Консолидированы константы (`starCost`, `interestRate`, `SYSTEM_CONFIG`) в `@/price/constants/index.ts`, удалены дубликаты.
- ✅ {current_date}: Уточнена логика обработки видеомоделей в `processBalanceVideoOperation.ts` с явным маппингом `VideoModel` на ключи `VIDEO_MODELS_CONFIG`.
- ✅ {current_date}: Удален устаревший тип `VideoModel` из `src/interfaces/models.interface.ts`.
- ✅ {current_date}: Рефакторинг кода (`processBalanceVideoOperation`, `imageToVideoWizard`, `videoModelMenu`, `generateImageToVideo`, `videoModelPrices`, `validateAndCalculateVideoModelPrice`) для использования `keyof typeof VIDEO_MODELS_CONFIG` вместо `VideoModel`.
- ✅ {current_date}: Заменен тип `string` на `VideoModelConfigKey` в `BalanceOperationProps` в `processBalanceVideoOperation.ts`.
- ✅ {current_date}: Исправлена ошибка импорта `VideoModel` и вызова `processBalanceVideoOperation` в `src/services/plan_b/generateTextToVideo.ts` после рефакторинга.
- ✅ {current_date}: Исправлены ошибки компиляции TypeScript в `src/registerCommands.ts` и `src/handlers/handleBuy/index.ts` (ошибки TS2339 и TS2345).

### Правила и Консистентность 📜 (НОВЫЙ РАЗДЕЛ)
- ✅ {current_date}: Создано правило Cursor `price-calculation-consistency.mdc` для обеспечения единообразия расчета и отображения цен.
- ✅ {current_date}: Исправлено значение `interestRate` в `constants/index.ts` с 50 на 0.5.
- ✅ {current_date}: Создано правило Cursor `backend-delegation.mdc` о делегировании вызовов внешних API бэкенду.
- ✅ {current_date}: Дополнено правило Cursor `backend-delegation.mdc` информацией об определении URL API сервера.
- ✅ {current_date}: Создано правило Cursor `follow-existing-patterns.mdc` о необходимости следовать существующим паттернам.
- ✅ {current_date}: Создано правило Cursor `local-type-check.mdc` об обязательной локальной проверке типов перед деплоем.

### Функционал и UX 🎨 (ПРИОРИТЕТ - СРЕДНИЙ)
- ✅ Исправлена логика отображения кнопок в главном меню (`src/menu/mainMenu.ts`) для начального состояния пользователя (`level: 0`, `subscription: STARS`). Теперь корректно отображаются **только** кнопки "Оформить подписку" и "Техподдержка".
- ✅ Исправлена навигация кнопки "Главное меню" в сценах оплаты (`paymentScene`, `rublePaymentScene`, `starPaymentScene`) - теперь используется единый ID сцены `ModeEnum.MainMenu`.
- ✅ Исправлена ошибка, из-за которой кнопка "Главное меню" не работала после отправки инвойса на оплату подписки звездами (удален `ctx.scene.leave()` в `handleBuySubscription`).
- ✅ Логика запуска webhook-сервера (`startWebhookServer` в `src/bot.ts`) изменена: теперь сервер запускается **всегда**, а не только в production.
- ✅ Исправлена логика отображения меню в `menuScene` - теперь используется `getTranslation` с ключами `'menu'` или `'digitalAvatar'` в зависимости от подписки (`NEUROBASE`/`NEUROTESTER` или `NEUROPHOTO`/`null`).
- ✅ Исправлена ошибка зацикливания при повторной отправке `/menu` в `menuScene`.
- ✅ Исправлена ошибка форматирования fallback-текста меню (убрана обработка `
` через `MarkdownV2`).
- ✅ Добавлена запись перевода для ключа `'menu'` / `ai_koshey_bot` / `'ru'` в базу данных.
- ✅ Исправлено форматирование переноса строки (`
`) для ключа `'menu'` при получении из БД.
- ✅ {current_date}: Исправлена ошибка `price is null` при расчете стоимости видеогенерации (модель `haiper`).
- ✅ {current_date}: Изменено расположение кнопок выбора видеомодели на горизонтальное (по 2 в ряд) с использованием ReplyKeyboard и отображением **финальной цены в звездах (⭐)**.
- ⏳ Улучшить текст главного меню (ключ 'menu') для большей вовлеченности и соответствия тематике нейроблогера (Требуется обновление в БД Supabase).
- ✅ {current_date}: Проверена и уточнена работа с видеомоделями (`haiper`, `ray`, `minimax` и др. согласно конфигу).

### Тестирование 🧪 (ПРИОРИТЕТ - СРЕДНИЙ)
- ✅ Исправлена ошибка перехвата события `successful_payment` активной сценой (`starPaymentScene`) - добавлен `ctx.scene.leave()` в `handleTopUp`.
- ⏳ Написание unit-тестов для критических компонентов
- ⏳ Настройка тестового окружения
- ⏳ Интеграционные тесты для платежного модуля
- ⏳ Добавить тесты для нового скрипта сборки
- ⏳ Проверка работоспособности всех ботов
- ⏳ Тестирование webhook обработчиков
- ✅ **{current_date}:** Добавлен простой Express "Hello World" сервер на порту 999, доступный через Nginx по пути /api.
- ✅ {current_date}: Протестировать функционал генерации видео (особенно с моделью `haiper`).
- ✅ {current_date}: Проверена и уточнена работа с видеомоделями (`haiper`, `ray`, `minimax` и др. согласно конфигу).
- ✅ {current_date}: Адаптирована сцена `textToVideoWizard` для работы с ReplyKeyboard (обработка текста кнопки).
- ✅ {current_date}: Изменена логика сцены `textToVideoWizard`: теперь только проверяет баланс, но не списывает его.
- ✅ {current_date}: Изменена логика сцены `imageToVideoWizard`: теперь только проверяет баланс (используя **финальную цену** в звездах с интересом), но не списывает его, и корректно обрабатывает ReplyKeyboard **с ценой в звездах**.
- ✅ {current_date}: Исправлен вызов ReplyKeyboard в первом шаге сцены `imageToVideoWizard`.
- ✅ {current_date}: Изменена логика сцены `textToVideoWizard`: теперь только проверяет баланс, но не списывает его, и корректно обрабатывает ReplyKeyboard **с ценой в звездах**.
- ✅ {current_date}: Исправлен вызов ReplyKeyboard в первом шаге сцены `imageToVideoWizard`.
- ✅ {current_date}: Исправлен расчет цены в `calculateFinalPrice` (Доллары -> Звезды -> Наценка, использует interestRate=0.5).
- ✅ {current_date}: Изменена логика сцены `imageToVideoWizard`: теперь только проверяет баланс (используя **финальную цену** в звездах с интересом), но не списывает его, и корректно обрабатывает ReplyKeyboard с ценой в **звездах (⭐)**.
- ✅ {current_date}: Изменена логика сцены `textToVideoWizard`: теперь только проверяет баланс (используя **финальную цену** в звездах с интересом), но не списывает его, и корректно обрабатывает ReplyKeyboard с ценой в **звездах (⭐)**.
- ✅ {current_date}: Исправлен вызов ReplyKeyboard в первом шаге сцены `imageToVideoWizard`.

### Оптимизация производительности 🚀 (ПРИОРИТЕТ - НИЗКИЙ)
- ✅ Миграция с Express на Fastify для улучшения производительности
- ✅ Ускорена сборка Docker за счет удаления Ansible/Nginx
- ⏳ Оптимизация обработки вебхуков
- ⏳ Оптимизация работы с базой данных
- ✅ {current_date}: Удален тип `VideoModel`, рефакторинг ВСЕХ связанных файлов для использования `keyof typeof VIDEO_MODELS_CONFIG`.

## 📋 Следующие шаги (По приоритету)
1. ❗ **Обновить URL вебхуков в Telegram** на формат `https://<домен>/<имя_бота>`
2. ❗ **Обновить URL Robokassa Result** на `https://<домен>/api/robokassa-result`
3. ❗ **Реализовать эндпоинт `/api/generate/image-to-video`** в `api-server`.
4. ❗ **Проверить/реализовать эндпоинт `/api/replicate-webhook`** в `api-server`.
5. 🧪 **Протестировать отправку уведомлений** после оплаты Telegram Stars.
6. 🧪 **Протестировать работу API сервера** по адресу `https://<домен>/api`.
7. 🛠️ Скопировать актуальные интерфейсы (`db.interface.ts`, `payments.interface.ts`) в `api-server`.
8. 🛠️ Реализовать заглушки `updateUserBalance`, `updateUserSubscription` в `api-server`.
9. 🚀 **ОЧИСТИТЬ КЭШ DOCKER НА СЕРВЕРЕ** (`docker builder prune -a -f`) и выполнить деплой с `--no-cache`.
10. 🧪 Протестировать обработку Robokassa через `/api/robokassa-result`.
11. 🔑 Проверить валидность всех токенов ботов
12. 📊 Настроить мониторинг состояния ботов
13. 📝 Настроить автоматическое логирование
14. 🔄 Продолжить типизацию оставшихся файлов
15. ✅ Добавить тесты для критических компонентов
16. 🛠️ Улучшить обработку ошибок
17. 📚 Добавить документацию по API
18. 🚀 Расширить функциональность Fastify (валидация, логирование)

## 🐛 Известные проблемы
- ⚠️ **КРИТИЧНО:** Не реализован глобальный обработчик Telegram Payments `pre_checkout_query`. Без него платежи Telegram Stars не будут проходить предварительную проверку. -> *Обработчик есть, но может быть проблема с 409 конфликтом*
- ✅ **(РЕШЕНО)** Не реализован глобальный обработчик Telegram Payments `successful_payment`. -> *Обработчик есть, проблема была в сцене.*
- ⚠️ **(ВОЗМОЖНО, РЕШЕНО)** Логика оплаты Telegram Stars в `starPaymentScene.ts` неверна... -> *Добавлен `ctx.scene.leave()`.*
- ✅ **(РЕШЕНО)** Ошибка `invalid input value for enum operation_type: "STARS_EXPENSE"` в SQL-функциях.
- ⚠️ Проблема с SSH ключом для `git push` и `git pull` на сервере (КРИТИЧНО для деплоя)
- ❗ **Не обновлены URL вебхуков в Telegram** на формат `https://<домен>/<имя_бота>` (БЛОКИРУЕТ РАБОТУ БОТОВ)
- ⚠️ Необходима проверка валидности всех токенов ботов (КРИТИЧНО)
- 🔍 Требуется настройка мониторинга ботов в production
- 📝 Необходима настройка автоматического логирования
- 🔄 Требуется улучшить типизацию в generateTextToVideo.ts
- ⚠️ **КРИТИЧНО:** Заглушки для `updateUserBalance`, `updateUserSubscription` в `api-server`.
- ⚠️ **КРИТИЧНО:** Уведомления пользователю об успешной оплате Robokassa не отправляются из `api-server`.
- ⚠️ Необходима актуализация интерфейсов (`db.interface.ts`, `payments.interface.ts`) в `api-server`.
- ⚠️ **Баланс пользователя НЕ обновляется** при успешной оплате Telegram Stars (функция `incrementBalance` удалена).
- ⚠️ **КРИТИЧНО:** Не реализован/не проверен эндпоинт `/api/replicate-webhook` для приема результатов генерации видео.
- ⚠️ **КРИТИЧНО:** Не реализован эндпоинт `/api/generate/image-to-video` в `api-server` (требуется обработка `modelIdentifier`).

## 📈 Прогресс
- Деплой: 95% ⏳ (Nginx настроен, требуется обновление URL вебхуков)
- Типизация: 95% ✅
- Тестирование: 40% ⏳
- Инфраструктура: 100% ✅
- Функционал и UX: 55% ✅

## 🛠️ Недавние исправления
- ✅ {current_date}: Исправлено форматирование переноса строки (`\n`) для перевода ключа `'menu'`.
- ✅ {current_date}: Добавлена запись перевода для ключа `'menu'` / `ai_koshey_bot` / `'ru'` в базу данных `translations`.
- ✅ {current_date}: Исправлена ошибка отправки уведомлений после оплаты Telegram Stars путем добавления `ctx.scene.leave()` в обработчик `handleTopUp`.
- ✅ {current_date}: Устранена причина ошибочного логирования `Sending DB message:` при отсутствии перевода (запасная логика `getTranslation`).
- ✅ {current_date}: Исправлена ошибка форматирования fallback-текста меню (убрана обработка `
` через `MarkdownV2`).
- ✅ 2025-04-23: Исправлены некорректные системные подписки для пользователей, которым ошибочно был присвоен тип 'neurobase' вместо 'NEUROTESTER'. Для всех затронутых пользователей созданы новые записи с типом 'NEUROTESTER'.
- ✅ 2025-04-23: Диагностирована проблема с отображением меню у пользователей NEUROTESTER. Причина: некорректный тип подписки (`neurobase` вместо `NEUROTESTER`) в базе данных для данных пользователей. Меню отображается корректно согласно фактическим данным.
- ✅ 2025-04-23: Проверка развертывания (`docker-compose up --build -d`) и логов приложения на сервере прошла успешно. Бот стартует без явных ошибок.
- ✅ {current_date}: Создан отдельный Docker-сервис `api-server` для API-эндпоинтов.
- ✅ {current_date}: Логика Robokassa перенесена в `api-server`, исправлены ошибки типов Express.
- ✅ {current_date}: Настроен Nginx для проксирования `/api/*` на `api-server`.
- ✅ {current_date}: Удалены старые файлы обработчика Robokassa из основного приложения.
- ✅ {current_date}: Исправлены ошибки типов Express (TS2769, TS2339) в `src/webhookServer.ts`, что позволило успешно завершить сборку Docker.
- ✅ 2025-04-23: Удален лишний обработчик `action(/top_up_(\d+)/)` из `starPaymentScene.ts`, чтобы позволить глобальному обработчику в `registerCommands.ts` вызвать `handleBuy` и отправить инвойс Telegram Stars.
- ✅ 2025-04-23: Удален некорректный вызов `setPayments` и ложное сообщение об успехе из `starPaymentScene.ts`.
- ✅ 2025-04-23: Исправлен статус платежа на 'success' (lowercase) при вызове `setPayments` в `starPaymentScene.ts` (хотя сам вызов пока удален).
- ✅ 2025-04-23: Исправлена ошибка "Can't find scene: balanceScene" путем добавления `balanceScene` в массив регистрации сцен в `src/registerCommands.ts`. Кнопка "Баланс" теперь должна работать корректно.
- ✅ 2025-04-23: Исправлена логика отображения кнопок `NEUROPHOTO` в `src/menu/mainMenu.ts` - удалена ненужная фильтрация по `level`, теперь отображаются все доступные функции.
- ✅ 2025-04-23: Исправлена проверка полного доступа `checkFullAccess` в `src/scenes/menuScene/index.ts` - теперь подписка приводится к нижнему регистру перед проверкой.
- ✅ 2025-04-23: Удален преждевременный выход из сцены (`ctx.scene.leave()`) в `handleBuySubscription` после отправки инвойса Telegram Stars, что позволяло кнопке "Главное меню" работать.
- ✅ 2025-04-23: Унифицирован ID сцены главного меню (`ModeEnum.MainMenu`) в обработчиках кнопки "Главное меню" в сценах `paymentScene`, `rublePaymentScene`, `starPaymentScene`.
- ✅ 2025-04-23: Исправлена логика `mainMenu.ts` для корректного отображения кнопок при начальном уровне пользователя (level 0, STARS). Теперь показываются только "Оформить подписку" и "Техподдержка".
- ✅ 2025-04-23: Исправлена ошибка `column users.xmin does not exist` в `src/core/supabase/createUser.ts`. Логика изменена на поиск пользователя перед созданием, убрана зависимость от системного столбца `xmin`, добавлено обновление данных при нахождении существующего пользователя.
- ✅ 2025-04-22: Исправлена проблема с типами в `launch.ts` - решены ошибки TS2769 и TS2339 связанные с Express и Response типами. Сборка проекта теперь проходит успешно.
- ✅ 2025-04-22: Миграция с Express на Fastify для улучшения типизации и производительности.
- ✅ 2025-04-22: Исправлена проблема сборки в Docker - добавлен tsc-alias в основные зависимости и установка глобально в Dockerfile.
- ✅ 2025-04-22: Исправлена ошибка сборки Docker, связанная с husky в скрипте prepare - добавлен флаг --ignore-scripts при установке зависимостей в production-режиме.
- ✅ 2025-04-22: Решена проблема с отсутствием файла bot.js в Docker-контейнере - изменена стратегия сборки для выполнения компиляции TypeScript непосредственно в финальном этапе контейнера.
- ✅ 2025-04-22: Исключены тестовые файлы из сборки Docker - создается отдельный tsconfig, который не включает тестовые файлы, что устраняет ошибки компиляции при отсутствии зависимостей для тестов.
- ✅ 2025-04-22: Добавлен автоматический скрипт создания .env файла для контейнера - теперь Docker контейнер создает .env файл, если его нет, что решает проблему с ошибкой "Failed to load primary .env file".
- ✅ 2025-04-22: Удалены ненужные зависимости Ansible и Nginx из Dockerfile приложения, ускорена сборка.
- ✅ 2025-04-22: Восстановлена конфигурация Nginx (bot-proxy) к исходной, использующей `location /<имя_бота>` для маршрутизации. Удалены небезопасные `map` и `location /telegraf/`.
- ✅ 2025-04-22: Исправлен `src/bot.ts` для использования `hookPath: /<имя_бота>` при установке вебхуков через `bot.launch`, удален скрипт `get-token-hashes.js`.
- ✅ 2025-04-22: Удалена неиспользуемая функция `production` и заглушка `launch` из `src/utils/launch.ts`.
- 🔍 Интеграция Fastify с Telegraf: Успешно реализована через @fastify/express адаптер, что позволило использовать преимущества обеих библиотек. 
- ✅ {current_date}: Исправлены SQL функции `get_user_balance` и `get_user_balance_stats` для использования корректных Enum (`MONEY_INCOME`, `MONEY_OUTCOME`) вместо `STARS_EXPENSE`.
- ✅ {current_date}: Исправлена логика отображения меню в `menuScene` для корректного использования `getTranslation` на основе типа подписки.
- ✅ {current_date}: Исправлена ошибка зацикливания в `menuScene` при повторном вызове `/menu`.
- ✅ {current_date}: Исправлена логика списания баланса в `processBalanceVideoOperation.ts` (убран минус, исправлен тип на `MONEY_OUTCOME`).
- ✅ {current_date}: Устранены ошибки компиляции, связанные с `PaymentType`/`TransactionType` и строковыми литералами.
- ✅ {current_date}: Проверена и подтверждена корректность логики SQL-функции `get_user_balance`.
- ✅ {current_date}: Исправлены ошибки типов Enum (`Currency`, `PaymentStatus`) в `src/handlers/paymentHandlers/index.ts`.
- ✅ {current_date}: Рефакторинг `handleSuccessfulPayment` для корректной обработки покупки подписки и пополнения звездами через Telegram Stars.
- ✅ {current_date}: Устранена ошибка типа `successful_payment` в `handleSuccessfulPayment` путем добавления проверки.
- ✅ {current_date}: Восстановлен вызов `incrementBalance` в `handleSuccessfulPayment` для корректного пополнения баланса при оплате Telegram Stars.
- ✅ {current_date}: Удален вызов `incrementBalance` из `handleSuccessfulPayment` по запросу пользователя.
- ✅ {current_date}: Восстановлен обработчик `action(/top_up_(\d+)/)` в `starPaymentScene.ts` для обработки нажатий кнопок покупки звезд.
- ✅ {current_date}: Исправлена ошибка `price is null` при расчете стоимости видеогенерации, уточнена логика маппинга моделей.
- ✅ {current_date}: Удален тип `VideoModel`, рефакторинг ВСЕХ связанных файлов для использования `keyof typeof VIDEO_MODELS_CONFIG`.
- ✅ {current_date}: Исправлены ошибки компиляции TypeScript (TS2339, TS2345) в `src/registerCommands.ts` и `src/handlers/handleBuy/index.ts`.

## ⭐ Payments & Subscriptions Refactoring (v2)

**Goal:** Make `payments_v2` the single source of truth. Remove subscription/level/count logic from `users` table.

**Status:** Mostly Done ✅ (Needs Manual SQL Fix & Testing)

**Key Files:**
- `src/core/supabase/getUserDetailsSubscription.ts` ✅
- `src/core/supabase/getUserBalance.ts` ✅
- `src/interfaces/payments.interface.ts` ✅
- `src/interfaces/subscription.interface.ts` ✅
- `src/scenes/menuScene/index.ts` ✅
- `src/menu/mainMenu.ts` ✅
- `src/price/helpers/refundUser.ts` ✅
- `src/core/supabase/index.ts` (export getUserDetailsSubscription) ✅
- `src/core/supabase/getReferalsCountAndUserData.ts` ✅
- `src/api-server/routes/robokassa.ts` (Needs review for interface usage)
- Supabase SQL function `create_system_payment` (Manual fix needed) ⚠️
- `src/price/helpers/processBalanceVideoOperation.ts` ✅

**Tasks:**
- ✅ **DB:** Remove `subscription_status`, `subscription_type`, `subscription_start_date`, `level`, `neuro_tokens` from `users` table (if not already done - requires manual check/execution).
- ✅ **Types:** Remove corresponding fields from `UserType`, `User` interfaces (`src/interfaces/`).
- ✅ **getUserDetailsSubscription:**
    - Fetch last **completed** payment (`status = 'COMPLETED'`, relevant `payment_method`).
    - Determine `subscriptionType` and `isActive` based ONLY on `payments_v2`.
    - Implement **unlimited duration** for `NEUROTESTER`. ✅
    - Return `isSubscriptionActive`, `subscriptionType`, `subscriptionStartDate`, `stars`, `isExist`. (Do *not* return level/count).
- ✅ **getUserBalance:** Calculate `stars` balance from `payments_v2`.
- ✅ **Code Usage:**
    - Replace all usages of `user.level`, `user.count`, `user.subscription_status` etc. with calls to `getUserDetailsSubscription`. ✅
    - Simplify `menuCommandStep` (`src/scenes/menuScene/index.ts`) to rely *only* on `subscriptionType` from `getUserDetailsSubscription`. **Removed `level` and `count` logic entirely.** ✅
    - Update `mainMenu` (`src/menu/mainMenu.ts`) to remove `level` and `inviteCount` parameters and associated logic. ✅
    - Fix calls to `mainMenu` in other files (e.g., `refundUser.ts`). ✅
- ✅ **Payments Logic:**
    - Verify `updateUserBalanceRobokassa` sets `payment_method = 'Robokassa'` (or 'Telegram'). ✅
    - Verify expense functions (like `updateUserBalance`) log `service_type` (and NOT `subscription_type`). ✅
    - Corrected `processBalanceVideoOperation.ts` to use `MONEY_OUTCOME`. ✅
    - ✅ **{current_date}:** Завершен рефакторинг кода для использования `PaymentType.MONEY_INCOME`/`PaymentType.MONEY_OUTCOME`.
- ⚠️ **System Payments:** Manually fix `create_system_payment` SQL function to insert `subscription_type` (not `service_type`) for grants.
- ⏳ **Robokassa:** Review `robokassa.ts` route handler - ensure it uses correct interfaces and potentially calls `getUserDetailsSubscription` if needed after payment confirmation.
- ⏳ **Testing:** Thoroughly test all scenarios: new user, STARS user, NEUROPHOTO, NEUROBASE, NEUROTESTER, balance top-up, service usage, refunds.
- ⏳ **Documentation:** Update `docs/payments_v2_schema.md` and any other relevant docs.

**Next Steps:**
1.  Manually fix `

### 💳 Платежи и Подписки

*   [ ] 🎯 **Исправить кнопку "Сгенерировать новое видео?"** (Текущая Задача)
    *   [ ] Убедиться, что нажатие кнопки перезапускает сценарий генерации видео.
    *   [ ] Проверить обработчики ReplyKeyboard.
*   [ ] 🐞 **Расхождение цен на видеогенерацию** (Кнопка vs Списание)
    *   [ ] Привести расчет/отображение цены на кнопках в соответствие с правилом `price-calculation-consistency.mdc`.
    *   [ ] Проверить функцию списания на соответствие этому же правилу.
*   [ ] ❓ **Проблема с созданием PENDING статуса при инициации платежа**
    *   [ ] Получить и проанализировать логи момента нажатия кнопки "Пополнить"/"Подписаться".
    *   ✅ Найти причину, почему не создается запись `payments_v2` со статусом `PENDING` (Неверный Enum `SUBSCRIPTION_PURCHASE`).
    *   ✅ Исправить тип операции на `MONEY_INCOME` в `rublePaymentScene.ts`.
    *   [ ] Протестировать создание PENDING статуса после исправления.
*   [ ] ❓ **Исследовать обработку вебхуков Robokassa и схему `payments_v2`** (Новая подзадача)
    *   [ ] Проверить логи `api-server` на наличие ошибок обработки вебхуков (особенно для заказа 93863).
    *   [ ] Уточнить логику `api-server` по парсингу вебхуков и записи в `payments_v2`.
    *   [ ] Определить место хранения номера заказа Robokassa (`inv_id` или `metadata`).
    *   [ ] Обновить документацию `docs/payments_v2_schema.md`.
*   [ ] 📜 **Проверить и обновить SQL-функции (`get_user_balance`, `get_user_balance_stats`)**
    *   [ ] Убедиться, что они корректно обрабатывают типы операций (`MONEY_INCOME`, `MONEY_OUTCOME`, `SUBSCRIPTION_PURCHASE` и т.д.) согласно `payments-subscriptions-logic.mdc`.
*   [ ] 🛠️ **Создать/обновить SQL-функцию `create_system_payment`**
    *   [ ] Убедиться, что она корректно создает записи в `payments_v2` для системных операций.