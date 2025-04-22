import express from 'express'
import { Telegraf } from 'telegraf'
import { MyContext } from './interfaces'
// import fileUpload from 'express-fileupload' // Закомментируем
// import { handleRobokassaResult } from './webhooks/robokassa/robokassa.handler' // Закомментируем

// Инициализация Express приложения
const app = express()

// Middleware для разбора JSON данных
app.use('/', express.json())

// Закомментируем middleware для Robokassa
// app.use('/', express.urlencoded({ extended: true }))
// app.use('/', fileUpload())

/**
 * Настраивает обработку вебхуков для ботов на основном порту
 * @param botInstances Массив экземпляров ботов
 * @param shouldStartServer Флаг, указывающий нужно ли запускать сервер (по умолчанию true)
 */
export function setupWebhookHandlers(
  botInstances: Telegraf<MyContext>[],
  shouldStartServer = true
): express.Express {
  // Логирование всех входящих запросов
  app.use((req, res, next) => {
    console.log(`📥 Входящий запрос: ${req.method} ${req.path}`)
    next()
  })

  // Маршрут для проверки работоспособности
  app.get('/', (req, res) => {
    res.send('Telegram Bot API вебхук сервер работает!')
  })

  // Закомментируем маршрут для Robokassa Result URL
  // app.post('/payment-success', handleRobokassaResult)

  // Закомментируем маршрут для проверки работоспособности Robokassa
  // app.get('/health', (req, res) => {
  //   res.status(200).send('OK')
  // })

  // Создаем карту маршрутов для каждого бота
  const botTokens = new Map<string, Telegraf<MyContext>>()

  // Заполняем карту токенов
  botInstances.forEach(async bot => {
    try {
      const botInfo = await bot.telegram.getMe()
      const secretPath = bot.secretPathComponent()
      if (secretPath) {
        botTokens.set(secretPath, bot)
        console.log(
          `✅ Зарегистрирован вебхук для бота ${botInfo.username} на пути /telegraf/${secretPath}`
        )
      } else {
        console.error(
          `❌ Не удалось сгенерировать secretPath для бота ${botInfo.username}`
        )
      }
    } catch (error) {
      console.error('❌ Ошибка при регистрации вебхука:', error)
    }
  })

  // Маршрут для обработки вебхуков Telegram
  app.post('/telegraf/:token', (req, res) => {
    const token = req.params.token
    console.log(`🔄 Получен вебхук для токена: ${token.substring(0, 6)}...`)

    const bot = botTokens.get(token)
    if (bot) {
      // Передаем запрос в обработчик бота
      bot.handleUpdate(req.body, res)
    } else {
      console.error(`❌ Не найден бот для токена: ${token.substring(0, 6)}...`)
      res.status(404).send('Bot not found')
    }
  })

  // Запуск сервера (если не отключен)
  if (shouldStartServer) {
    const PORT = process.env.APP_WEBHOOK_PORT || 2999
    app
      .listen(PORT, () => {
        console.log(`🚀 Основной вебхук сервер запущен на порту ${PORT}`)
      })
      .on('error', (err: NodeJS.ErrnoException) => {
        console.error(`[Main Webhook] Failed to start server: ${err.message}`)
        if (err.code === 'EADDRINUSE') {
          console.error(`[Main Webhook] Port ${PORT} is already in use.`)
        }
      })
  }

  return app
}
