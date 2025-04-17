import dotenv from 'dotenv'
dotenv.config()

import { Composer } from 'telegraf'
import { MyContext } from '@/interfaces'
import { NODE_ENV } from './config'

import { startServer } from '@/utils/launch'
import { registerCallbackActions } from './handlers/сallbackActions'
import { registerPaymentActions } from './handlers/paymentActions'
import { registerHearsActions } from './handlers/hearsActions'
import { registerCommands } from './registerCommands'
import { setBotCommands } from './setCommands'
import { logger } from './utils/logger'
import { setupErrorHandler } from './helpers/error/errorHandler'
import init from './core/bot'

// Логирование для отладки
console.log('📂 bot.ts загружен', { NODE_ENV, cwd: process.cwd() })
console.log('🔑 Переменные окружения:', {
  TEST_BOT_NAME: process.env.TEST_BOT_NAME,
  NODE_ENV: process.env.NODE_ENV,
})

export const composer = new Composer<MyContext>()

type NextFunction = (err?: Error) => void

export const createBots = async () => {
  console.log('🚀 Запуск createBots()')
  logger.info('🚀 Начало инициализации ботов', {
    node_env: NODE_ENV,
    cwd: process.cwd(),
    available_env_keys: Object.keys(process.env).filter(key =>
      key.includes('BOT_TOKEN')
    ),
  })

  // Проверка обязательных переменных окружения
  const requiredEnvVars = ['ORIGIN']
  const missingEnvVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  )

  if (missingEnvVars.length > 0) {
    logger.error('❌ Отсутствуют обязательные переменные окружения', {
      missing_vars: missingEnvVars,
    })
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    )
  }

  // Запуск сервера Express для обработки вебхуков
  const serverStarted = await startServer()
  if (!serverStarted) {
    logger.error('❌ Не удалось запустить Express сервер')
    throw new Error('Failed to start Express server')
  }
  logger.info('✅ Express сервер успешно запущен')

  if (NODE_ENV === 'development' && !process.env.TEST_BOT_NAME) {
    logger.error('❌ TEST_BOT_NAME не установлен в режиме разработки', {
      description: 'TEST_BOT_NAME is not set',
    })
    throw new Error('TEST_BOT_NAME is required for development mode')
  }

  logger.info('📊 Режим работы:', { mode: NODE_ENV })

  // Инициализация ботов с помощью обновленного метода
  logger.info('🔄 Инициализация списка ботов...')
  const botList = await init()
  logger.info('🤖 Доступные боты после инициализации:', {
    count: botList.length,
    bot_ids: botList.map(b => b.id),
  })

  if (botList.length === 0) {
    logger.error('❌ Не удалось инициализировать ни одного бота')
    throw new Error('No bots were initialized')
  }

  // В режиме разработки используем только один тестовый бот
  const testBotName = process.env.TEST_BOT_NAME
  const activeBots =
    NODE_ENV === 'development'
      ? botList.filter(({ id }) => id === testBotName)
      : botList

  logger.info('🔍 Фильтрация ботов для режима:', {
    mode: NODE_ENV,
    test_bot_name: testBotName,
    filtered_count: activeBots.length,
    active_bot_ids: activeBots.map(b => b.id),
  })

  if (NODE_ENV === 'development' && activeBots.length === 0) {
    logger.error(
      '❌ Тестовый бот не найден в списке инициализированных ботов',
      {
        description: 'Test bot not found',
        environment: NODE_ENV,
        requested_bot: testBotName,
        available_bots: botList.map(b => b.id),
      }
    )
    throw new Error(`Test bot '${testBotName}' not found`)
  }

  logger.info('✅ Активных ботов:', {
    count: activeBots.length,
    bots: activeBots.map(b => b.id),
  })

  // Проверяем соединение с каждым ботом
  for (const { instance, id } of activeBots) {
    try {
      const me = await instance.telegram.getMe()
      logger.info(`✅ [${id}] Соединение с Telegram API успешно установлено`, {
        bot_username: me.username,
        bot_id: me.id,
      })
    } catch (error) {
      logger.error(
        `❌ [${id}] Не удалось установить соединение с Telegram API`,
        {
          error: error instanceof Error ? error.message : String(error),
        }
      )
    }
  }

  // Настройка каждого бота
  activeBots.forEach(({ instance, id }) => {
    logger.info(`🔄 Настройка бота: ${id}`)

    // Устанавливаем обработчик ошибок для защиты от проблем с токенами
    setupErrorHandler(instance)
    logger.info(`✅ [${id}] Обработчик ошибок установлен`)

    // Настройка команд и обработчиков
    setBotCommands(instance)
    logger.info(`✅ [${id}] Команды бота установлены`)

    registerCommands({ bot: instance, composer })
    logger.info(`✅ [${id}] Обработчики команд зарегистрированы`)

    registerCallbackActions(instance)
    logger.info(`✅ [${id}] Обработчики колбэков зарегистрированы`)

    registerPaymentActions(instance)
    logger.info(`✅ [${id}] Обработчики платежей зарегистрированы`)

    registerHearsActions(instance)
    logger.info(`✅ [${id}] Обработчики текстовых сообщений зарегистрированы`)

    // Добавляем логирование для входящих сообщений
    instance.use((ctx: MyContext, next: NextFunction) => {
      logger.info('🔍 Получено сообщение/команда:', {
        description: 'Message/command received',
        text:
          ctx.message && 'text' in ctx.message ? ctx.message.text : undefined,
        from: ctx.from?.id,
        chat: ctx.chat?.id,
        bot: ctx.botInfo?.username,
        update_type: ctx.updateType,
        timestamp: new Date().toISOString(),
      })
      return next()
    })

    logger.info(`✅ [${id}] Бот полностью настроен и готов к работе`)
  })

  logger.info('🏁 Все боты успешно настроены и запущены!')

  // Проверяем активные вебхуки для каждого бота в production режиме
  if (NODE_ENV === 'production') {
    setTimeout(async () => {
      logger.info('🔍 Проверка статуса вебхуков...')
      for (const { instance, id } of activeBots) {
        try {
          const webhookInfo = await instance.telegram.getWebhookInfo()

          if (!webhookInfo.url) {
            logger.error(`❌ [${id}] Вебхук не настроен!`, {
              webhook_url: webhookInfo.url,
            })
          } else {
            logger.info(`✅ [${id}] Вебхук активен:`, {
              webhook_url: webhookInfo.url,
              pending_updates: webhookInfo.pending_update_count,
            })
          }
        } catch (error) {
          logger.error(`❌ [${id}] Ошибка при проверке вебхука:`, {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }, 5000) // Проверяем через 5 секунд после запуска
  }
}

console.log('🏁 Запуск приложения')
createBots()
  .then(() => console.log('✅ Боты успешно запущены'))
  .catch(error => console.error('❌ Ошибка при запуске ботов:', error))
