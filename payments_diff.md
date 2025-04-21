# Анализ системы оплаты: Рубли vs Звезды

Дата анализа: 20 апреля 2025

## Текущее состояние (как реализовано сейчас)

Система поддерживает два основных способа оплаты:

1.  **🇷🇺 Рубли через Robokassa:**

    - **Инициация:** Через сцены `emailWizard`/`getRuBillWizard`.
    - **Процесс:** Пользователь вводит email, выбирает сумму в рублях (с примерным эквивалентом звезд), генерируется ссылка на оплату Robokassa (`generateRobokassaUrl`).
    - **Подтверждение:** Через вебхук `/robokassa-result`, обрабатываемый `handleRobokassaResult` (`src/webhooks/robokassa/robokassa.handler.ts`).
    - **Запись в БД:** Функция `setPayments` вызывается с `currency: 'RUB'`, `payment_method: 'Robokassa'`, `status: 'PENDING'`, а затем обновляется на `SUCCESS` после вебхука.
    - **Баланс:** Вебхук Robokassa обновляет баланс пользователя в ЗВЕЗДАХ (`incrementBalance`).

2.  **⭐️ Telegram Stars (прямая оплата):**
    - **Инициация:** Через сцену `paymentScene` при выборе "⭐️ Звездами", вызываются хендлеры `handleBuySubscription` или `handleSelectStars`.
    - **Процесс:** Используется встроенный метод Telegram `ctx.replyWithInvoice` с параметрами:
      - `currency: 'XTR'` (явное указание на оплату Звездами)
      - `prices`: массив с ценой в Звездах.
      - `provider_token: ''` (Токен провайдера не используется, что характерно для прямой оплаты Звездами).
    - **Подтверждение:** Через стандартные события Telegram `pre_checkout_query` и `successful_payment`.
      - `pre_checkout_query` обрабатывается в `src/handlers/paymentHandlers/handlePreCheckoutQuery.ts` (и дублируется в `src/handlers/handleSuccessfulPayment/index.ts`?), где бот отвечает `ctx.answerPreCheckoutQuery(true)`.
      - `successful_payment` обрабатывается в `src/handlers/paymentHandlers/index.ts` функцией `handleSuccessfulPayment`.
    - **Запись в БД:** Функция `handleSuccessfulPayment` вызывает `setPayments` с `currency: 'STARS'`, `payment_method: 'Telegram'` или `'TelegramStars'`, `status: 'COMPLETED'`.
    - **Баланс:** Функция `handleSuccessfulPayment` напрямую вызывает `incrementBalance` с количеством полученных звезд.

## Как могло быть реализовано раньше (Гипотезы)

- **Следов полностью другой системы не найдено.** Комментарии `deprecated`, `legacy` или закомментированный код старой логики отсутствуют.
- **Наиболее вероятно:** Система оплаты Звездами всегда была основана на встроенном механизме Telegram (`replyWithInvoice` с `currency: 'XTR'`). Изменения/поломка произошли внутри этой существующей логики.

## Ключевые отличия и возможные точки отказа для Звезд

- **Провайдер:** Рубли - Robokassa (внешний), Звезды - Telegram (встроенный).
- **Метод:** Рубли - генерация ссылки + вебхук, Звезды - `replyWithInvoice` + события `pre_checkout_query`/`successful_payment`.
- **Токен:** Для `replyWithInvoice` с `currency: 'XTR'` токен провайдера не нужен и не указан. Если _раньше_ оплата Звездами шла через какого-то внешнего провайдера (что маловероятно, судя по коду), то отсутствие/невалидность `provider_token` могло бы быть проблемой.
- **Обработчики событий:** Корректность работы `handleSuccessfulPayment` и `handlePreCheckoutQuery` критична для Звезд. Возможно, изменился формат данных от Telegram, или в логике этих функций есть ошибка (например, неправильная обработка `successfulPayment.total_amount`).
- **Вызов `replyWithInvoice`:** Правильно ли формируются параметры (payload, prices, amount) при вызове этого метода?
- **Конфигурация бота/API:** Проблемы могут быть вне кода (настройки в BotFather, изменения в Telegram API).

## Следующие шаги

1.  Проверить логику внутри `handleSuccessfulPayment`: как извлекается `total_amount`, как определяется `subscriptionType`, как вызывается `incrementBalance` и `setPayments`.
2.  Проверить формирование параметров для `ctx.replyWithInvoice` в `handleBuySubscription` и `handleBuy`.
3.  Убедиться, что обработчик `pre_checkout_query` корректно отвечает `true`.
4.  Проверить настройки платежей в BotFather для `clip_maker_neuro_bot`.
5.  (Опционально) Добавить больше логирования в `handleSuccessfulPayment` для отладки.
