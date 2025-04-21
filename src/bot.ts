import { isDev } from './config'

console.log(`--- Bot Logic ---`)
console.log(
  `[BOT] Detected mode (via isDev): ${isDev ? 'development' : 'production'}`
)
console.log(`[BOT] process.env.NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`--- End Bot Logic Check ---`)

import { Composer, Telegraf, Scenes } from 'telegraf'
// Удаляем экспорт composer
// export const composer = new Composer()

import { registerCommands } from './registerCommands'
import { MyContext } from './interfaces'
import { setupWebhookHandlers } from './webhookHandler'
// Импортируем Express для Robokassa вебхуков
import express from 'express'
import fileUpload from 'express-fileupload'
import { handleRobokassaResult } from './webhooks/robokassa/robokassa.handler'
import * as http from 'http'
import util from 'util' // Добавляем util для promisify

// Инициализация ботов
const botInstances: Telegraf[] = []
let robokassaServer: http.Server | null = null

// Функция для проверки валидности токена
export async function validateBotToken(token: string): Promise<boolean> {
  try {
    const bot = new Telegraf(token)
    await bot.telegram.getMe()
    return true
  } catch (error) {
    console.error(`❌ Ошибка валидации токена: ${error.message}`)
    return false
  }
}

// Функция для проверки занятости порта
export async function isPortInUse(port: number): Promise<boolean> {
  try {
    const net = await import('net')
    return new Promise(resolve => {
      const server = net.createServer()
      server.once('error', () => resolve(true))
      server.once('listening', () => {
        server.close()
        resolve(false)
      })
      server.listen(port)
    })
  } catch (error) {
    console.error(`❌ Ошибка проверки порта ${port}:`, error)
    return true
  }
}

// Функция запуска сервера для обработки Robokassa вебхуков
export async function startRobokassaWebhookServer(): Promise<http.Server | null> {
  // Порт для Robokassa webhook
  const robokassaPort = process.env.ROBOKASSA_WEBHOOK_PORT || 2999

  // Создаем экземпляр express
  const app = express()

  // Middleware для разбора URL-encoded формы
  app.use(express.urlencoded({ extended: true }))

  // Middleware для разбора JSON данных
  app.use(express.json())

  // Middleware для обработки multipart/form-data
  app.use(fileUpload())

  // POST маршрут для обработки успешных платежей от Robokassa
  app.post('/payment-success', handleRobokassaResult)

  // Проверка работоспособности сервера
  app.get('/health', (req, res) => {
    res.status(200).send('OK')
  })

  // Запуск сервера и сохранение экземпляра
  // Убираем setTimeout, полагаемся на корректное закрытие при SIGINT/SIGTERM
  const server = await new Promise<http.Server | null>(resolve => {
    const expressServer = app
      .listen(robokassaPort, () => {
        console.log(
          `[Robokassa] Webhook server running on port ${robokassaPort}`
        )
        resolve(expressServer) // Резолвим промис с экземпляром сервера
      })
      .on('error', err => {
        console.error(
          `[Robokassa] Failed to start webhook server: ${err.message}`
        )
        if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
          console.error(
            `[Robokassa] Port ${robokassaPort} is already in use. Maybe another instance is running?`
          )
        }
        resolve(null) // В случае ошибки вернем null
      })
  })
  // Убираем setTimeout

  return server
}

// Добавляю логи перед инициализацией ботов
async function initializeBots() {
  console.log('🔧 Режим работы:', isDev ? 'development' : 'production')
  console.log('📝 Загружен файл окружения:', process.env.NODE_ENV)

  console.log('🔄 [SCENE_DEBUG] Проверка импорта stage из registerCommands...')
  const { stage } = await import('./registerCommands')
  console.log('✅ [SCENE_DEBUG] Stage импортирован успешно')
  // Проверим сцены другим способом
  try {
    const stageInfo = (stage as any)._handlers || []
    console.log(
      '📊 [SCENE_DEBUG] Количество обработчиков сцен:',
      stageInfo.length
    )
  } catch (e) {
    console.log(
      '⚠️ [SCENE_DEBUG] Не удалось получить информацию о количестве сцен:',
      e.message
    )
  }

  if (isDev) {
    // В режиме разработки запускаем бота, указанного в TEST_BOT_NAME
    const targetBotUsername = process.env.TEST_BOT_NAME
    if (!targetBotUsername) {
      throw new Error(
        '❌ Переменная окружения TEST_BOT_NAME не установлена. Укажите username бота для запуска в development.'
      )
    }

    console.log(`🔧 Ищем тестового бота с username: ${targetBotUsername}`)

    // Собираем все потенциальные токены из env
    const potentialTokens = Object.entries(process.env)
      .filter(([key]) => key.startsWith('BOT_TOKEN'))
      .map(([, value]) => value)
      .filter(Boolean) as string[]

    let bot: Telegraf<MyContext> | null = null
    let foundBotInfo: Awaited<ReturnType<typeof bot.telegram.getMe>> | null =
      null

    for (const token of potentialTokens) {
      try {
        const tempBot = new Telegraf<MyContext>(token)
        const botInfo = await tempBot.telegram.getMe()
        if (botInfo.username === targetBotUsername) {
          console.log(`✅ Найден бот ${botInfo.username}`)
          bot = tempBot // Используем этого бота
          foundBotInfo = botInfo
          break // Прерываем цикл, бот найден
        }
      } catch (error) {
        // Игнорируем ошибки валидации токенов, просто ищем дальше
        // console.warn(`⚠️ Ошибка проверки токена ${token.substring(0, 10)}...: ${error.message}`);
      }
    }

    if (!bot || !foundBotInfo) {
      throw new Error(
        `❌ Бот с username '${targetBotUsername}' не найден среди токенов в .env или токен невалиден.`
      )
    }

    // Добавляем логи перед регистрацией команд
    console.log(
      '🔄 [SCENE_DEBUG] Регистрация команд бота и stage middleware...'
    )

    // Убираем composer из вызова
    // Передаем только bot
    registerCommands({ bot })

    console.log('✅ [SCENE_DEBUG] Команды и middleware зарегистрированы')

    botInstances.push(bot)
    // Используем уже полученную информацию о боте
    console.log(`🤖 Тестовый бот ${foundBotInfo.username} инициализирован`)

    // В режиме разработки используем polling
    bot.launch({
      allowedUpdates: ['message', 'callback_query'],
    })
    console.log(
      `🚀 Тестовый бот ${foundBotInfo.username} запущен в режиме разработки`
    )
  } else {
    // В продакшене используем все активные боты
    const botTokens = [
      process.env.BOT_TOKEN_1,
      process.env.BOT_TOKEN_2,
      process.env.BOT_TOKEN_3,
      process.env.BOT_TOKEN_4,
      process.env.BOT_TOKEN_5,
      process.env.BOT_TOKEN_6,
      process.env.BOT_TOKEN_7,
    ].filter(Boolean)

    // Начинаем с порта 3001 для первого бота
    let currentPort = 3001

    for (const token of botTokens) {
      if (await validateBotToken(token)) {
        const bot = new Telegraf<MyContext>(token)
        // Используем Composer.log() напрямую
        bot.use(Composer.log())

        // Убираем composer из вызова
        // Передаем только bot
        registerCommands({ bot })

        botInstances.push(bot)
        const botInfo = await bot.telegram.getMe()
        console.log(`🤖 Бот ${botInfo.username} инициализирован`)

        // Проверяем, свободен ли порт
        while (await isPortInUse(currentPort)) {
          console.log(`⚠️ Порт ${currentPort} занят, пробуем следующий...`)
          currentPort++
        }

        console.log(
          `🔌 Используем порт ${currentPort} для бота ${botInfo.username}`
        )

        // В продакшене используем вебхуки
        try {
          bot.launch({
            webhook: {
              domain: process.env.WEBHOOK_DOMAIN,
              port: currentPort,
              path: `/telegraf/${bot.secretPathComponent()}`,
            },
            allowedUpdates: ['message', 'callback_query'],
          })
          console.log(
            `🚀 Бот ${botInfo.username} запущен в продакшен режиме на порту ${currentPort}`
          )
          await new Promise(resolve => setTimeout(resolve, 2000)) // Добавляем задержку в 2 секунды
        } catch (error) {
          console.error(`❌ Ошибка запуска бота ${botInfo.username}:`, error)
        }

        // Увеличиваем порт для следующего бота
        currentPort++
      }
    }

    // Запускаем обработчик вебхуков на основном порту приложения
    setupWebhookHandlers(botInstances as Telegraf<MyContext>[])
  }

  // Запускаем сервер для обработки Robokassa вебхуков
  robokassaServer = await startRobokassaWebhookServer()

  console.log('🔍 Инициализация сцен...')
  // Перед регистрацией каждой сцены добавляю лог
  console.log('📋 Регистрация сцены: payment_scene')
  // ... существующий код регистрации сцен ...

  // После регистрации всех сцен добавляю итоговый лог:
  console.log('✅ Все сцены успешно зарегистрированы')
}

// Промисификация server.close
const closeServerAsync = robokassaServer
  ? util.promisify(robokassaServer.close.bind(robokassaServer))
  : async () => {
      /* No-op if server is null */
    } // Исправляем пустую функцию

// Асинхронная функция для остановки
async function gracefulShutdown(signal: string) {
  console.log(`🛑 Получен сигнал ${signal}, начинаем graceful shutdown...`)

  // 1. Останавливаем ботов
  console.log(`[${signal}] Stopping ${botInstances.length} bot instance(s)...`)
  const stopPromises = botInstances.map(async (bot, index) => {
    try {
      console.log(
        `[${signal}] Initiating stop for bot instance index ${index}...`
      )
      // bot.stop() для long polling обычно синхронный, но для надежности можно обернуть
      // Хотя Telegraf 4.x stop() возвращает void для polling
      bot.stop(signal)
      console.log(
        `[${signal}] Successfully stopped bot instance index ${index}.`
      )
    } catch (error) {
      console.error(
        `[${signal}] Error stopping bot instance index ${index}:`,
        error // Логируем полную ошибку
      )
    }
  })
  // Не нужно Promise.all, так как bot.stop() синхронный для polling
  // await Promise.all(stopPromises) // Убираем ожидание, если оно не нужно
  console.log(`[${signal}] All bot instances processed for stopping.`)

  // 2. Останавливаем сервер Robokassa, если он был запущен
  if (robokassaServer) {
    console.log(`[${signal}] [Robokassa] Stopping webhook server...`)
    try {
      // Создаем промисифицированную версию здесь, если server не null
      await closeServerAsync() // Ожидаем закрытия сервера
      console.log(
        `[${signal}] [Robokassa] Webhook server stopped successfully.`
      )
      robokassaServer = null // Сбрасываем ссылку на сервер
    } catch (error) {
      console.error(
        `[${signal}] [Robokassa] Error stopping webhook server:`,
        error
      )
    }
  } else {
    console.log(
      `[${signal}] [Robokassa] Webhook server was not running or already stopped.`
    )
  }

  // 3. Добавляем небольшую задержку перед выходом
  console.log(`[${signal}] Adding a short delay before exiting...`)
  await new Promise(resolve => setTimeout(resolve, 1500)) // Пауза 1500 мс (было 500)

  console.log(`[${signal}] Graceful shutdown completed. Exiting.`)
  process.exit(0) // Выход с кодом 0 (успех)
}

// Обработка завершения работы - используем общую асинхронную функцию
process.once('SIGINT', () => gracefulShutdown('SIGINT'))
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'))

console.log('🏁 Запуск приложения')
initializeBots()
  .then(() => console.log('✅ Боты успешно запущены'))
  .catch(error => console.error('❌ Ошибка при запуске ботов:', error))
