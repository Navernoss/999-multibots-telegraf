// Объявления констант без циклических зависимостей
// Объявляем примитивные значения самыми первыми

// Экспортируем примитивные значения
export const starCost = 0.016
export const interestRate = 1.5

// Теперь создаем объект конфигурации на основе этих значений
export const SYSTEM_CONFIG = {
  starCost: starCost,
  interestRate: interestRate,
  currency: 'RUB',
}

// Импорт типов после объявления примитивных констант
import { ModeEnum } from '../../interfaces/modes'

// Star purchase limits
export const STAR_AMOUNTS = {
  min: 100,
  max: 10000,
  default: 1000,
}

// Base costs for different modes (in dollars)
export const BASE_COSTS = {
  [ModeEnum.NeuroPhoto]: 0.08,
  [ModeEnum.NeuroPhotoV2]: 0.14,
  [ModeEnum.ImageToPrompt]: 0.03,
  [ModeEnum.Avatar]: 0,
  [ModeEnum.ChatWithAvatar]: 0,
  [ModeEnum.SelectModel]: 0,
  [ModeEnum.SelectAiTextModel]: 0,
  [ModeEnum.Voice]: 0.9,
  [ModeEnum.TextToSpeech]: 0.12,
  [ModeEnum.ImageToVideo]: 0,
  [ModeEnum.TextToVideo]: 0,
  [ModeEnum.TextToImage]: 0,
  [ModeEnum.LipSync]: 0.9,
  [ModeEnum.VoiceToText]: 0.08,
  [ModeEnum.CheckBalanceScene]: 0,
  [ModeEnum.CreateUserScene]: 0,
  [ModeEnum.SubscriptionScene]: 0,
  [ModeEnum.GetRuBillWizard]: 0,
  [ModeEnum.SelectNeuroPhoto]: 0,
  [ModeEnum.ChangeSize]: 0,
  [ModeEnum.DigitalAvatarBody]: 0,
  [ModeEnum.DigitalAvatarBodyV2]: 0,
  [ModeEnum.NeuroAudio]: 0,
  [ModeEnum.Invite]: 0,
  [ModeEnum.Help]: 0,
  [ModeEnum.MainMenu]: 0,
  [ModeEnum.BalanceScene]: 0,
  [ModeEnum.Balance]: 0,
  [ModeEnum.ImprovePrompt]: 0,
  [ModeEnum.TopUpBalance]: 0,
  [ModeEnum.VideoInUrl]: 0,
  [ModeEnum.Support]: 0,
  [ModeEnum.Stats]: 0,
  [ModeEnum.BroadcastWizard]: 0,
  [ModeEnum.SubscriptionCheckScene]: 0,
  [ModeEnum.ImprovePromptWizard]: 0,
  [ModeEnum.SizeWizard]: 0,
  [ModeEnum.PaymentScene]: 0,
  [ModeEnum.InviteScene]: 0,
  [ModeEnum.Step0]: 0,
  [ModeEnum.NeuroCoderScene]: 0,
  [ModeEnum.CancelPredictionsWizard]: 0,
  [ModeEnum.EmailWizard]: 0,
  [ModeEnum.HelpScene]: 0,
  [ModeEnum.StartScene]: 0,
} as const

// Speech-related costs (in stars)
export const SPEECH_COSTS = {
  [ModeEnum.TextToSpeech]: 10,
  [ModeEnum.Voice]: 50,
} as const

// Voice conversation cost (in stars)
export const VOICE_CONVERSATION_COST = 0.5

// Digital avatar costs per step (in dollars)
export const DIGITAL_AVATAR_COSTS = {
  v1: 0.1, // DigitalAvatarBody
  v2: 0.2, // DigitalAvatarBodyV2
} as const

// === Цены на подписки ===
export const NEUROPHOTO_PRICE_RUB = 1110.0
export const NEUROBASE_PRICE_RUB = 2999.0

/**
 * Определяет тип подписки на основе суммы и валюты платежа.
 * @param amount Сумма платежа
 * @param currency Валюта платежа
 * @returns Тип подписки ('neurophoto', 'neurobase', 'stars') или null
 */
export const determineSubscriptionType = (
  amount: number,
  currency: string
): 'neurophoto' | 'neurobase' | 'stars' | null => {
  if (currency === 'RUB') {
    // Используем константы цен
    if (amount === NEUROPHOTO_PRICE_RUB) return 'neurophoto'
    if (amount === NEUROBASE_PRICE_RUB) return 'neurobase'
    // Другие суммы в RUB - это покупка звезд
    return 'stars'
  } else if (currency === 'STARS' || currency === 'XTR') {
    // Платежи во внутренней валюте - это операции со звездами
    return 'stars'
  } else {
    // Другие валюты или случаи - пока не определяем тип
    return null
  }
}
