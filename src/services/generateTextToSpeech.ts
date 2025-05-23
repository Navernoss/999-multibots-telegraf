import axios, { isAxiosError } from 'axios'
import {
  isDev,
  SECRET_API_KEY,
  API_SERVER_URL,
  LOCAL_SERVER_URL,
} from '@/config'

interface TextToSpeechResponse {
  success: boolean
  audioUrl?: string
  message?: string
}

export async function generateTextToSpeech(
  text: string,
  voice_id: string,
  telegram_id: number,
  username: string,
  isRu: boolean,
  botName: string
): Promise<TextToSpeechResponse> {
  try {
    const url = `${
      isDev ? LOCAL_SERVER_URL : API_SERVER_URL
    }/generate/text-to-speech`
    if (!text) {
      throw new Error('Text is required')
    }
    if (!username) {
      throw new Error('Username is required')
    }
    if (!telegram_id) {
      throw new Error('Telegram ID is required')
    }
    if (!voice_id) {
      throw new Error('Voice ID is required')
    }
    if (!isRu) {
      throw new Error('Language is required')
    }
    const response = await axios.post<TextToSpeechResponse>(
      url,
      {
        text,
        voice_id,
        telegram_id: telegram_id.toString(),
        is_ru: isRu,
        bot_name: botName,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-secret-key': SECRET_API_KEY,
        },
      }
    )

    console.log('Text to speech response:', response.data)
    return response.data
  } catch (error) {
    if (isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message)
      throw new Error(
        isRu
          ? 'Произошла ошибка при преобразовании текста в речь'
          : 'Error occurred while converting text to speech'
      )
    }
    console.error('Unexpected error:', error)
    throw error
  }
}
