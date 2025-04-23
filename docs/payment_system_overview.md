# 🕉️ Документация: Система Платежей и Подписок 💳✨

_Дата составления: {current_date}_

**Цель:** Этот документ — наш единый источник истины по работе с платежами, подписками и балансом (звездами). Он объединяет всю информацию, полученную в ходе разработки и отладки, чтобы предотвратить будущие ошибки и недопонимания.

## 1. 🏛️ Единый Источник Истины: Таблица `payments_v2`

*   **Принцип:** Таблица `payments_v2` в Supabase — **единственный и абсолютный** источник данных о всех финансовых транзакциях и статусах подписок.
*   **Запрет:** **Никогда** не полагаться на таблицу `users` для определения деталей активной подписки пользователя.

## 2. 📜 Перечисления (Enums): Двойственность Базы Данных и Кода

### 2.1. `operation_type` (Enum в Базе Данных Supabase)
   Колонка `payments_v2.type` использует этот PostgreSQL enum. Его **актуальные** значения:
   ```sql
   MONEY_INCOME, MONEY_EXPENSE, SUBSCRIPTION_PURCHASE, SUBSCRIPTION_RENEWAL, REFUND, BONUS, REFERRAL, SYSTEM, MONEY_OUTCOME
   ```
   *(Примечание: `MONEY_EXPENSE` - устаревшее, `MONEY_OUTCOME` - актуальное для расходов)*

### 2.2. `PaymentType` (Enum в Коде TypeScript)
   Находится в `[src/interfaces/payments.interface.ts](mdc:src/interfaces/payments.interface.ts)`.
   **Соответствие:** В целом соответствует `operation_type` из БД, **НО**:
   *   `MONEY_EXPENSE` **удалено** из кода.
   *   **Стандартизация:** Все операции **расхода** звезд/средств в коде стандартизированы и используют **только `PaymentType.MONEY_OUTCOME`**.

### 2.3. ⚠️ КРИТИЧЕСКАЯ НЕСОГЛАСОВАННОСТЬ (Потенциальная)
   *   Код записывает расходы как `MONEY_OUTCOME`.
   *   SQL-функции (`get_user_balance`, `get_user_balance_stats`) **предположительно** считают баланс, используя `MONEY_OUTCOME` для вычитания.
   *   **НО:** Старое значение `MONEY_EXPENSE` **все еще существует** в enum `operation_type` базы данных.
   *   **Риск:** Если в таблице есть старые записи с `MONEY_EXPENSE` или если SQL-функции не обновлены и все еще учитывают `MONEY_EXPENSE`, **баланс может рассчитываться НЕВЕРНО**.
   *   **Рекомендация (БД):** Либо удалить `MONEY_EXPENSE` из enum `operation_type` в Supabase, либо модифицировать SQL-функции, чтобы они игнорировали `MONEY_EXPENSE` и вычитали только `MONEY_OUTCOME`.

## 3. ☯️ Двойственность Полей: `subscription_type` vs `service_type`

Эти два поля в `payments_v2` служат **разным целям**:

1.  **`subscription_type`** (`text` в БД):
    *   **Назначение:** Записывает **тип купленной/выданной подписки** (`NEUROPHOTO`, `NEUROBASE`, `NEUROTESTER`). Используется для определения активной подписки пользователя.
    *   **Когда заполняется:** При `type = SUBSCRIPTION_PURCHASE`, `SUBSCRIPTION_RENEWAL`, `SYSTEM` (если выдача подписки).
    *   **Когда `NULL`:** При расходах (`MONEY_OUTCOME`) или других доходах (`MONEY_INCOME`, `BONUS` и т.д.). **Это корректно.**

2.  **`service_type`** (`text` в БД, соответствует `ModeEnum`):
    *   **Назначение:** Записывает **конкретную услугу**, на которую были **потрачены** звезды (`IMAGE_GENERATION`, `TEXT_TO_SPEECH` и т.д.).
    *   **Когда заполняется:** Только при `type = MONEY_OUTCOME`.
    *   **Когда `NULL`:** На всех операциях дохода, системных операциях, покупках подписок. **Это корректно.**

## 4. ✨ Ключевые Функции и Логика

### 4.1. Определение Статуса Пользователя (`getUserDetails`)
   *   **Файл:** `[src/core/supabase/getUserDetails.ts](mdc:src/core/supabase/getUserDetails.ts)` (Заменил старый `getUserDetailsSubscription`)
   *   **Логика:**
        *   Ищет **последнюю** запись в `payments_v2` с `status = 'COMPLETED'` и `type` одним из [`SUBSCRIPTION_PURCHASE`, `SUBSCRIPTION_RENEWAL`, `SYSTEM`].
        *   Из этой записи берет `subscription_type` (текст) и `payment_date`.
        *   **Особая логика `NEUROTESTER`:** Если `subscription_type = 'NEUROTESTER'`, то `isSubscriptionActive = true` **независимо от даты**.
        *   **Другие подписки:** Проверяет, активна ли подписка (обычно `payment_date` + 30 дней > текущей даты).
        *   Возвращает: `isSubscriptionActive` (boolean), `subscriptionType` (Enum), `subscriptionStartDate` (Date).
        *   Также вызывает `getUserBalance` для получения `stars` и проверяет существование пользователя в `users` (`isExist`).
        *   **Не возвращает уровень пользователя.**

### 4.2. Расчет Баланса (`getUserBalance`)
   *   **Файл:** `[src/core/supabase/getUserBalance.ts](mdc:src/core/supabase/getUserBalance.ts)`
   *   **Логика:**
        *   Вызывает SQL-функцию `get_user_balance(user_telegram_id)` в Supabase. **Точность зависит от этой SQL-функции!**
        *   Использует **локальный кэш** (`balanceCache`) с TTL 30 секунд для уменьшения нагрузки на БД.
        *   Функция `invalidateBalanceCache(telegram_id)` должна вызываться после **любой** операции, изменяющей баланс.

### 4.3. Обработка Платежей Telegram

*   **Регистрация обработчиков:** `[src/handlers/paymentActions.ts](mdc:src/handlers/paymentActions.ts)`
    ```typescript
    bot.on('pre_checkout_query', handlePreCheckoutQuery)
    bot.on('successful_payment', handleSuccessfulPayment)
    ```
*   **`handlePreCheckoutQuery`**
    *   **Файл:** `[src/handlers/paymentHandlers/index.ts](mdc:src/handlers/paymentHandlers/index.ts)`
    *   **Назначение:** Обрабатывает событие `pre_checkout_query` от Telegram.
    *   **Логика:** Проверяет валидность запроса (сейчас заглушка - всегда `true`) и отвечает `ctx.answerPreCheckoutQuery(true)` или `false`.
    *   **Тип контекста:** `NarrowedContext<MyContext, Update.PreCheckoutQueryUpdate>`
*   **`handleSuccessfulPayment`**
    *   **Файл:** `[src/handlers/paymentHandlers/index.ts](mdc:src/handlers/paymentHandlers/index.ts)`
    *   **Назначение:** Обрабатывает событие `successful_payment` от Telegram.
    *   **Логика:** Извлекает данные `successfulPayment` и вызывает `processSuccessfulPaymentLogic`.
    *   **Тип контекста:** `NarrowedContext<MyContext, Update.MessageUpdate<Message.SuccessfulPaymentMessage>>`
*   **`processSuccessfulPaymentLogic`** (внутренняя)
    *   **Файл:** `[src/handlers/paymentHandlers/index.ts](mdc:src/handlers/paymentHandlers/index.ts)`
    *   **Назначение:** Основная логика обработки успешного платежа Telegram.
    *   **Логика:**
        *   Парсит `invoice_payload` для определения типа операции (покупка подписки или пополнение звезд).
        *   Если **покупка подписки**:
            *   Вызывает `processPayment`.
            *   Отправляет `ctx.reply` об успешной покупке.
        *   Если **пополнение звезд**:
            *   Вызывает `setPayments` напрямую с `type = MONEY_INCOME`, `subscription_type = null`.
            *   Отправляет `ctx.reply` о пополнении.
            *   Вызывает `sendNotification` админам.
    *   **Тип контекста:** `MyContext`
*   **`processPayment`** (внутренняя)
    *   **Файл:** `[src/handlers/paymentHandlers/index.ts](mdc:src/handlers/paymentHandlers/index.ts)`
    *   **Назначение:** Хелпер для записи покупки подписки.
    *   **Логика:** Вызывает `setPayments` с `type = SUBSCRIPTION_PURCHASE` и `subscription_type`. Вызывает `sendNotification` админам.
    *   **Тип контекста:** `MyContext`
*   **`setPayments`** (Core-функция)
    *   **Файл:** `[src/core/supabase/setPayments.ts](mdc:src/core/supabase/setPayments.ts)`
    *   **Назначение:** Непосредственная запись данных в таблицу `payments_v2`. Используется всеми обработчиками.

### 4.4. Обработчик Robokassa
   *   **Расположение:** `[src/api-server/routes/robokassa.ts](mdc:src/api-server/routes/robokassa.ts)` (В отдельном API-сервисе).
   *   **Требование:** Этот обработчик **также должен** корректно определять тип операции (покупка подписки / пополнение) и записывать в `payments_v2` правильные `type` (`SUBSCRIPTION_PURCHASE` или `MONEY_INCOME`) и `subscription_type`. **(Гуру проверяет это на сервере).**

## 5. 🛡️ Предотвращение Отрицательного Баланса

*   **Правило:** Баланс пользователя **никогда** не должен опускаться ниже нуля.
*   **Реализация:** Перед **любой** операцией расхода (`type = MONEY_OUTCOME`), код **обязан** вызвать `getUserBalance` и проверить, достаточно ли средств.
*   **Отказ:** Если средств недостаточно, операция расхода **должна быть отклонена**, и запись `MONEY_OUTCOME` в `payments_v2` **не должна** создаваться.

## 6. 🐘 SQL Функции

*   **`get_user_balance(user_telegram_id)`:** Основная функция для расчета баланса. **Ее логика критически важна.**
*   **`get_user_balance_stats(user_telegram_id)`:** (Предположительно) для получения статистики доходов/расходов.
*   **`create_system_payment(...)`:** (Создается вручную в Supabase SQL Editor) Позволяет админу вручную выдать подписку или начислить звезды через `type = SYSTEM`. Должна корректно заполнять `subscription_type` при выдаче подписки.

## 7. 🔧 История Исправлений (Кратко)

В ходе отладки были решены следующие проблемы:
*   Исправлена логика `getUserDetails` для корректного определения активной подписки.
*   Выполнен SQL-запрос для исправления некорректных записей в `payments_v2` (где был `MONEY_INCOME` вместо `SUBSCRIPTION_PURCHASE`).
*   Устранено дублирование и исправлены ошибки типов в обработчиках `handlePreCheckoutQuery` и `handleSuccessfulPayment` в `paymentActions.ts` и `paymentHandlers/index.ts`.

## 8. ❓ Открытые Вопросы / Потенциальные Улучшения

*   **Логика Звезд за Подписку:** В `processSuccessfulPaymentLogic` при покупке подписки записывается фиксированный `starsEquivalent`, а не `total_amount` из платежа. Уточнить, является ли это ожидаемым поведением (бонус) или ошибкой.
*   **Корректность Robokassa:** Убедиться, что обработчик Robokassa записывает данные аналогично Telegram-обработчику.
*   **Enum `MONEY_EXPENSE` в БД:** Рассмотреть возможность удаления устаревшего значения `MONEY_EXPENSE` из enum `operation_type` в БД или адаптации SQL-функций для его игнорирования.

---
Ом. Пусть этот документ служит нам напоминанием и опорой. 🙏 