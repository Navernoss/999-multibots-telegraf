import { Request, Response } from 'express'
import * as supabase from '@/core/supabase'
import { PASSWORD2 } from '@/config'
import { validateRobokassaSignature } from '@/core/robokassa'
import { sendPaymentSuccessMessage } from '@/helpers/notifications'
import { updateUserSubscription } from '@/core/supabase/updateUserSubscription'
import { logger } from '@/utils/logger'
import { Telegraf } from 'telegraf'
import { MyContext } from '@/interfaces'
import { PaymentStatus } from '@/interfaces'

/**
 * Обработчик вебхуков Robokassa
 * Получает уведомления об успешных платежах.
 * @param bot - Инстанс Telegraf бота для отправки уведомлений
 */
export const handleRobokassaWebhook =
  (bot: Telegraf<MyContext>) => async (req: Request, res: Response) => {
    const { OutSum, InvId, SignatureValue, ...otherParams } = req.query

    logger.info('🤖 Robokassa Webhook Received', {
      InvId,
      OutSum,
      hasSignature: !!SignatureValue,
      otherParams:
        Object.keys(otherParams).length > 0 ? otherParams : undefined,
    })

    if (!OutSum || !InvId || !SignatureValue) {
      logger.warn('⚠️ Robokassa Webhook: Missing required parameters', {
        query: req.query,
      })
      // Robokassa ожидает ответ, отличный от "OK...", чтобы считать его ошибкой
      // Отправка "Bad Request" вместо "Missing parameters" может быть более стандартной
      return res.status(400).send('Bad Request: Missing parameters')
    }

    // 1. Валидация подписи
    const isValidSignature = validateRobokassaSignature(
      OutSum as string,
      InvId as string,
      PASSWORD2, // Используем второй пароль для вебхуков
      SignatureValue as string
    )

    if (!isValidSignature) {
      logger.error('❌ Robokassa Webhook: Invalid signature', { InvId })
      return res.status(400).send('Bad Request: Invalid signature')
    }
    logger.info(`✅ Robokassa Webhook: Signature valid for InvId ${InvId}`)

    try {
      // 2. Поиск PENDING платежа
      // Ищем платеж именно со статусом PENDING
      const { data: payment, error: paymentError } =
        await supabase.getPendingPayment(InvId as string)

      if (paymentError) {
        logger.error(
          `❌ Robokassa Webhook: DB Error getting payment for InvId ${InvId}`,
          {
            error: paymentError.message,
          }
        )
        // Не отвечаем OK, чтобы Robokassa повторила
        return res.status(500).send('Internal Server Error')
      }

      // Если платеж не найден ИЛИ он НЕ PENDING
      if (!payment) {
        // Проверим, может платеж уже обработан (SUCCESS)?
        const { data: successPayment, error: successPaymentError } =
          await supabase.getPaymentByInvId(InvId as string)

        if (
          successPayment &&
          successPayment.status === PaymentStatus.COMPLETED
        ) {
          logger.warn(
            `⚠️ Robokassa Webhook: Payment ${InvId} already processed (COMPLETED). Ignoring.`,
            { InvId }
          )
          // Отвечаем OK, так как платеж уже успешно обработан ранее
          return res.status(200).send(`OK${InvId}`)
        } else {
          logger.warn(
            `⚠️ Robokassa Webhook: PENDING payment not found for InvId ${InvId}. It might be FAILED or non-existent.`,
            { InvId }
          )
          // Платеж не найден или в другом статусе. Считаем это ошибкой, чтобы Robokassa не повторяла постоянно
          // Возможно, стоит вернуть 404, но 200 OK заставит робокассу перестать слать уведомление.
          // Будем считать, что раз ПЕНДИНГ нет, значит что-то не так и не надо повторять.
          return res.status(200).send(`OK${InvId}`) // Отвечаем OK, чтобы остановить повторы
        }
      }

      // Проверка соответствия суммы (дополнительная безопасность)
      if (Number(payment.amount) !== Number(OutSum)) {
        logger.error(
          `❌ Robokassa Webhook: Amount mismatch for InvId ${InvId}`,
          {
            dbAmount: payment.amount,
            webhookAmount: OutSum,
            telegram_id: payment.telegram_id,
          }
        )
        // Отвечаем ошибкой, но не 500, т.к. это проблема данных, а не сервера
        return res.status(400).send('Bad Request: Amount mismatch')
      }

      logger.info(`🅿️ Robokassa Webhook: Found PENDING payment ${InvId}`, {
        telegram_id: payment.telegram_id,
        amount: payment.amount,
        stars: payment.stars,
      })

      // 3. Обновление статуса платежа на SUCCESS
      const { error: updateError } = await supabase.updatePaymentStatus(
        InvId as string,
        PaymentStatus.COMPLETED
      )
      if (updateError) {
        logger.error(
          `❌ Robokassa Webhook: DB Error updating payment status for InvId ${InvId}`,
          {
            error: updateError.message,
            telegram_id: payment.telegram_id,
          }
        )
        // Не отвечаем OK, чтобы Robokassa повторила
        return res.status(500).send('Internal Server Error')
      }

      logger.info(
        `✅ Robokassa Webhook: Payment ${InvId} status updated to SUCCESS`
      )

      // 4. Обновление баланса пользователя (зачисление звезд)
      const balanceUpdated = await supabase.updateUserBalance(
        payment.telegram_id,
        payment.stars ?? 0, // Сумма звезд для зачисления
        'money_income', // Тип операции - пополнение
        `Пополнение звезд по Robokassa (InvId: ${InvId})`, // Описание
        {
          // Доп. метаданные, если нужны
          payment_method: 'Robokassa',
          inv_id: InvId as string,
        }
      )

      // Логируем результат обновления баланса
      if (!balanceUpdated) {
        // Это критическая ошибка, но статус платежа уже SUCCESS.
        // Логируем подробно, но отвечаем OK, чтобы Robokassa не повторяла.
        logger.error(
          `🆘 CRITICAL: Robokassa Webhook: Failed to update user balance for InvId ${InvId} AFTER payment success!`,
          {
            telegram_id: payment.telegram_id,
            stars_to_add: payment.stars,
            inv_id: InvId as string,
          }
        )
        // Все равно отвечаем OK, т.к. деньги получены, статус обновлен.
        return res.status(200).send(`OK${InvId}`)
      }

      logger.info(
        `👤 Robokassa Webhook: User ${payment.telegram_id} balance updated`
      )

      // 5. Отправка уведомления пользователю (асинхронно, не блокируем ответ)
      // Запускаем без await, чтобы не задерживать ответ Robokassa
      sendPaymentSuccessMessage(
        bot,
        payment.telegram_id,
        payment.stars ?? 0,
        'ru'
      ).catch(err => {
        logger.error(
          `❌ Robokassa Webhook: Failed to send success notification to user ${payment.telegram_id} for InvId ${InvId}`,
          { error: err instanceof Error ? err.message : String(err) }
        )
        // Не влияем на ответ Robokassa
      })

      // 6. Ответ Robokassa об успехе
      logger.info(`👍 Robokassa Webhook: Successfully processed InvId ${InvId}`)
      return res.status(200).send(`OK${InvId}`)
    } catch (error: any) {
      // Общий обработчик непредвиденных ошибок
      logger.error(
        `💥 Robokassa Webhook: Uncaught error processing InvId ${InvId}`,
        {
          error: error.message,
          stack: error.stack,
        }
      )
      // Не отвечаем OK, чтобы Robokassa повторила
      return res.status(500).send('Internal Server Error')
    }
  }
