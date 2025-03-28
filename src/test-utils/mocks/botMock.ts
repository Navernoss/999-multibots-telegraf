import { MyContext } from '@/interfaces'

/**
 * Мок-объект телеграм-бота для тестирования Inngest функций
 */
export class MockTelegram {
  token = 'mock-token'
  sentMessages: Array<{
    chatId: string | number
    text: string
    options?: any
  }> = []

  async sendMessage(
    chatId: string | number,
    text: string,
    options?: any
  ): Promise<any> {
    console.log('🤖 Мок-бот отправляет сообщение:', {
      description: 'Mock bot sending message',
      chatId,
      text,
      options,
    })
    this.sentMessages.push({ chatId, text, options })
    return { message_id: Date.now(), chat: { id: chatId }, text }
  }

  async sendPhoto(
    chatId: string | number,
    photo: any,
    options?: any
  ): Promise<any> {
    console.log('🤖 Мок-бот отправляет фото:', {
      description: 'Mock bot sending photo',
      chatId,
      photoType: typeof photo,
      options,
    })
    return { message_id: Date.now(), chat: { id: chatId } }
  }

  async deleteMessage(
    chatId: string | number,
    messageId: number
  ): Promise<boolean> {
    console.log('🤖 Мок-бот удаляет сообщение:', {
      description: 'Mock bot deleting message',
      chatId,
      messageId,
    })
    return true
  }
}

/**
 * Мок-класс Telegraf для тестирования
 */
export class MockTelegraf<T extends MyContext> {
  telegram: MockTelegram

  constructor(token?: string) {
    this.telegram = new MockTelegram()
    if (token) {
      this.telegram.token = token
    }
  }

  // Добавляем методы для имитации API Telegraf
  launch(): Promise<void> {
    console.log('🚀 Мок-бот запущен', { description: 'Mock bot launched' })
    return Promise.resolve()
  }

  stop(): Promise<void> {
    console.log('🛑 Мок-бот остановлен', { description: 'Mock bot stopped' })
    return Promise.resolve()
  }
}

/**
 * Создает мок-бот для тестирования
 */
export function createMockBot(token?: string): MockTelegraf<MyContext> {
  return new MockTelegraf<MyContext>(token)
}
