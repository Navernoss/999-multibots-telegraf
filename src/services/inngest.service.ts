import { INNGEST_EVENT_KEY } from '@/config'
import { supabase } from '@/core/supabase'
import { getBotByName } from '@/core/bot'
import { logger } from '@/utils/logger'
import { inngest } from '@/core/inngest/clients'
import {
  BroadcastOptions,
  BroadcastResult,
  FetchUsersOptions,
} from './broadcast.service'

// Функция проверки является ли пользователь владельцем аватара
// Заменяет неработающий импорт avatarService
const isAvatarOwner = async (
  telegram_id: string,
  bot_name: string
): Promise<boolean> => {
  try {
    // Проверяем, есть ли пользователь в таблице users
    const { data, error } = await supabase
      .from('users')
      .select('id, telegram_id, bot_name')
      .eq('telegram_id', telegram_id)
      .eq('bot_name', bot_name)
      .single()

    if (error || !data) {
      logger.error('❌ Ошибка при проверке прав пользователя:', {
        description: 'Error checking user permissions',
        error: error?.message || 'User not found',
        telegram_id,
        bot_name,
      })
      return false
    }

    // Если нашли пользователя с указанным telegram_id и bot_name, считаем его владельцем
    return true
  } catch (error) {
    logger.error('❌ Исключение при проверке владельца аватара:', {
      description: 'Exception checking avatar owner',
      telegram_id,
      bot_name,
      error: error?.message || 'Unknown error',
    })
    return false
  }
}

/**
 * Сервис для работы с Inngest
 */
export class InngestService {
  /**
   * Отправляет тестовое событие Hello World
   * @param data Дополнительные данные для события
   */
  static async sendHelloWorldEvent(data: Record<string, any> = {}) {
    try {
      console.log('🔔 Отправляем тестовое событие в Inngest')

      if (!INNGEST_EVENT_KEY) {
        console.error(
          '❌ INNGEST_EVENT_KEY не установлен. Событие не будет отправлено.'
        )
        throw new Error('INNGEST_EVENT_KEY не установлен')
      }

      console.log(
        '📝 Используем ключ:',
        INNGEST_EVENT_KEY.substring(0, 10) + '...'
      )

      // Проверяем переменные окружения для дополнительной диагностики
      console.log('📊 Данные события:', JSON.stringify(data, null, 2))

      try {
        const result = await inngest.send({
          name: 'test/hello.world',
          data: {
            message: 'Hello from Telegram Bot!',
            timestamp: new Date().toISOString(),
            ...data,
          },
        })

        console.log('✅ Событие успешно отправлено:', result)
        return result
      } catch (sendError) {
        console.error('❌ Ошибка при отправке в Inngest API:', sendError)
        throw new Error(
          `Ошибка Inngest API: ${sendError.message || 'Неизвестная ошибка'}`
        )
      }
    } catch (error) {
      console.error('❌ Общая ошибка при отправке события:', error)
      throw error
    }
  }

  /**
   * Отправляет произвольное событие в Inngest
   * @param eventName Имя события
   * @param data Данные события
   */
  static async sendEvent(eventName: string, data: Record<string, any> = {}) {
    try {
      console.log(`🔔 Отправляем событие "${eventName}" в Inngest`)

      if (!INNGEST_EVENT_KEY) {
        console.error(
          '❌ INNGEST_EVENT_KEY не установлен. Событие не будет отправлено.'
        )
        throw new Error('INNGEST_EVENT_KEY не установлен')
      }

      if (!eventName) {
        console.error('❌ Имя события не указано')
        throw new Error('Имя события не указано')
      }

      console.log(
        '📝 Используем ключ:',
        INNGEST_EVENT_KEY.substring(0, 10) + '...'
      )

      console.log('📊 Данные события:', JSON.stringify(data, null, 2))

      try {
        const result = await inngest.send({
          name: eventName,
          data: {
            timestamp: new Date().toISOString(),
            ...data,
          },
        })

        console.log('✅ Событие успешно отправлено:', result)
        return result
      } catch (sendError) {
        console.error('❌ Ошибка при отправке в Inngest API:', sendError)
        throw new Error(
          `Ошибка Inngest API: ${sendError.message || 'Неизвестная ошибка'}`
        )
      }
    } catch (error) {
      console.error('❌ Общая ошибка при отправке события:', error)
      throw error
    }
  }

  /**
   * Отправляет событие начала массовой рассылки через Inngest
   * @param imageUrl URL изображения
   * @param textRu Текст на русском
   * @param options Опции рассылки
   */
  static async startBroadcast(
    imageUrl: string | undefined,
    textRu: string,
    options: BroadcastOptions = {}
  ) {
    try {
      console.log('🔄 Запускаем массовую рассылку через Inngest')

      // Проверки и валидация
      if (options.bot_name && options.sender_telegram_id) {
        const isOwner = await isAvatarOwner(
          options.sender_telegram_id,
          options.bot_name
        )
        if (!isOwner) {
          logger.warn('⚠️ Попытка неавторизованной рассылки:', {
            description: 'Unauthorized broadcast attempt',
            sender_telegram_id: options.sender_telegram_id,
            bot_name: options.bot_name,
          })
          throw new Error('Нет прав на рассылку для данного бота')
        }
      }

      // Отправляем событие broadcast.start в Inngest
      return await InngestService.sendEvent('broadcast.start', {
        imageUrl,
        textRu,
        options,
      })
    } catch (error) {
      console.error('❌ Ошибка при запуске рассылки:', error)
      throw error
    }
  }

  /**
   * Проверяет права пользователя на отправку рассылки
   */
  static async checkOwnerPermissions(
    telegram_id: string,
    bot_name: string
  ): Promise<BroadcastResult> {
    try {
      const isOwner = await isAvatarOwner(telegram_id, bot_name)
      if (!isOwner) {
        logger.warn('⚠️ Попытка неавторизованной рассылки:', {
          description: 'Unauthorized broadcast attempt',
          telegram_id,
          bot_name,
        })
        return {
          success: false,
          successCount: 0,
          errorCount: 0,
          reason: 'unauthorized',
        }
      }
      return { success: true, successCount: 0, errorCount: 0 }
    } catch (error) {
      logger.error('❌ Ошибка при проверке прав:', {
        description: 'Error checking permissions',
        error: error?.message || 'Unknown error',
      })
      return {
        success: false,
        successCount: 0,
        errorCount: 0,
        reason: 'permission_check_error',
      }
    }
  }

  /**
   * Получает список пользователей для рассылки
   */
  static async fetchUsers(
    options: FetchUsersOptions
  ): Promise<BroadcastResult> {
    const { bot_name, test_mode, test_telegram_id, sender_telegram_id } =
      options

    try {
      if (test_mode) {
        const testId = test_telegram_id || sender_telegram_id || '144022504'
        const users = bot_name
          ? [{ telegram_id: testId, bot_name }]
          : await supabase
              .from('users')
              .select('telegram_id, bot_name')
              .eq('telegram_id', testId)
              .single()
              .then(({ data }) => (data ? [data] : []))

        return { success: true, successCount: 0, errorCount: 0, users }
      }

      let query = supabase.from('users').select('telegram_id, bot_name')
      if (bot_name) {
        query = query.eq('bot_name', bot_name)
      }

      const { data: users, error } = await query
      if (error) {
        throw error
      }

      return {
        success: true,
        successCount: 0,
        errorCount: 0,
        users: users || [],
      }
    } catch (error) {
      logger.error('❌ Ошибка при получении пользователей:', {
        description: 'Error fetching users',
        error: error?.message || 'Unknown error',
      })
      return {
        success: false,
        successCount: 0,
        errorCount: 0,
        reason: 'fetch_users_error',
        users: [],
      }
    }
  }

  /**
   * Получает экземпляр бота по имени
   */
  static async getBotInstance(botName: string) {
    try {
      const result = getBotByName(botName)
      if (!result || !result.bot) {
        logger.error(`❌ Бот не найден: ${botName}`, {
          description: `Bot not found: ${botName}`,
        })
        return null
      }
      return result.bot
    } catch (error) {
      logger.error('❌ Ошибка при получении бота:', {
        description: 'Error getting bot instance',
        error: error?.message || 'Unknown error',
        botName,
      })
      return null
    }
  }
}
