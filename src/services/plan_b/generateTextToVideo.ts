import { replicate } from '@/core/replicate'
import { downloadFile, pulse } from '@/helpers'
import { processBalanceVideoOperation } from '@/price/helpers'
import { mkdir, writeFile } from 'fs/promises'
import { InputFile } from 'telegraf/typings/core/types/typegram'
import {
  getUserByTelegramIdString,
  saveVideoUrlToSupabase,
} from '@/core/supabase'
import path from 'path'
import { getBotByName } from '@/core/bot'
import { updateUserLevelPlusOne } from '@/core/supabase'
import { VIDEO_MODELS_CONFIG } from '@/price/models/VIDEO_MODELS_CONFIG'
import { VideoModel } from '@/interfaces'
import {
  sendServiceErrorToUser,
  sendServiceErrorToAdmin,
} from '@/helpers/error'
import { BotName } from '@/interfaces'
import { toBotName } from '@/helpers/botName.helper'
import { logger } from '@/utils/logger'
import { supabase } from '@/core/supabase'
import { generateVideo } from '@/core/replicate/generateVideo'

export const processVideoGeneration = async (
  videoModel: string,
  aspect_ratio: string,
  prompt: string
) => {
  const modelConfig = VIDEO_MODELS_CONFIG[videoModel]

  if (!modelConfig) {
    throw new Error('Invalid video model')
  }

  const output = await replicate.run(
    modelConfig.api.model as `${string}/${string}`,
    {
      input: {
        prompt,
        ...modelConfig.api.input,
        aspect_ratio,
      },
    }
  )

  return output
}

export const generateTextToVideo = async (
  prompt: string,
  videoModel: VideoModel,
  telegram_id: string,
  username: string,
  is_ru: boolean,
  bot_name: string
): Promise<{ videoLocalPath: string }> => {
  const validBotName = toBotName(bot_name)
  const botData = await getBotByName(validBotName)
  if (!botData || !botData.bot) {
    logger.error(`Bot instance not found for name: ${validBotName}`)
    throw new Error('Bot instance not found')
  }
  const { bot } = botData

  try {
    logger.info('videoModel', videoModel)
    if (!prompt) throw new Error('Prompt is required')
    if (!videoModel) throw new Error('Video model is required')
    if (!telegram_id) throw new Error('Telegram ID is required')
    if (!username) throw new Error('Username is required')
    if (!bot_name) throw new Error('Bot name is required')

    const userExists = await getUserByTelegramIdString(telegram_id)
    if (!userExists) {
      throw new Error(`User with ID ${telegram_id} does not exist.`)
    }
    const level = userExists.level
    if (level === 9) {
      await updateUserLevelPlusOne(telegram_id, level)
    }

    const tempCtx = {
      from: { id: Number(telegram_id) },
      botInfo: { username: validBotName },
      telegram: bot.telegram,
      session: { mode: 'TextToVideo' },
    } as any

    const { newBalance, paymentAmount } = await processBalanceVideoOperation(
      tempCtx,
      videoModel,
      is_ru
    )

    await bot.telegram.sendMessage(
      telegram_id,
      is_ru ? '⏳ Генерация видео...' : '⏳ Generating video...',
      {
        reply_markup: {
          remove_keyboard: true,
        },
      }
    )

    const output = await processVideoGeneration(
      videoModel,
      userExists.aspectRatio || '16:9',
      prompt
    )
    let videoUrl: string
    if (Array.isArray(output)) {
      if (!output[0]) {
        throw new Error('Empty array or first element is undefined')
      }
      videoUrl = output[0]
    } else if (typeof output === 'string') {
      videoUrl = output
    } else {
      console.error(
        'Unexpected output format:',
        JSON.stringify(output, null, 2)
      )
      throw new Error(`Unexpected output format from API: ${typeof output}`)
    }
    const videoLocalPath = path.join(
      __dirname,
      '../uploads',
      telegram_id.toString(),
      'text-to-video',
      `${new Date().toISOString()}.mp4`
    )
    console.log(videoLocalPath, 'videoLocalPath')
    await mkdir(path.dirname(videoLocalPath), { recursive: true })

    const videoBuffer = await downloadFile(videoUrl as string)
    await writeFile(videoLocalPath, videoBuffer)

    await saveVideoUrlToSupabase(
      telegram_id,
      videoUrl as string,
      videoLocalPath,
      videoModel
    )

    const video = { source: videoLocalPath }
    await bot.telegram.sendVideo(telegram_id.toString(), video as InputFile)

    await bot.telegram.sendMessage(
      telegram_id,
      is_ru
        ? `Ваше видео сгенерировано!\n\nСгенерировать еще?\n\nСтоимость: ${paymentAmount.toFixed(
            2
          )} ⭐️\nВаш новый баланс: ${newBalance.toFixed(2)} ⭐️`
        : `Your video has been generated!\n\nGenerate more?\n\nCost: ${paymentAmount.toFixed(
            2
          )} ⭐️\nYour new balance: ${newBalance.toFixed(2)} ⭐️`,
      {
        reply_markup: {
          keyboard: [
            [
              {
                text: is_ru
                  ? '🎥 Сгенерировать новое видео?'
                  : '🎥 Generate new video?',
              },
            ],
          ],
          resize_keyboard: false,
        },
      }
    )

    await pulse(
      videoLocalPath,
      prompt,
      'text-to-video',
      telegram_id,
      username,
      is_ru,
      validBotName
    )

    return { videoLocalPath }
  } catch (error) {
    logger.error('Error in generateTextToVideo:', error)
    await sendServiceErrorToUser(bot, telegram_id, error as Error, is_ru)
    await sendServiceErrorToAdmin(bot, telegram_id, error as Error)

    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}

export async function generateTextToVideo(
  bot_name: string,
  text: string
): Promise<void> {
  try {
    const validBotName = toBotName(bot_name)
    const botData = await getBotByName(validBotName)

    if (!botData || !botData.bot) {
      logger.error('❌ Не удалось получить бота для генерации видео:', {
        description: 'Failed to get bot for video generation',
        bot_name: validBotName,
      })
      return
    }

    // Генерация видео
    const videoBuffer = await generateVideo(text)

    // Отправка видео
    const { data: subscribers, error } = await supabase
      .from('avatars')
      .select('telegram_id, username')
      .eq('bot_name', validBotName)

    if (error) {
      logger.error('❌ Ошибка при получении подписчиков из базы данных:', {
        description: 'Error getting subscribers from database',
        error,
      })
      return
    }

    if (!subscribers || subscribers.length === 0) {
      logger.warn('⚠️ Подписчики не найдены для бота:', {
        description: 'No subscribers found for bot',
        bot_name: validBotName,
      })
      return
    }

    for (const subscriber of subscribers) {
      try {
        await botData.bot.telegram.sendVideo(
          subscriber.telegram_id,
          videoBuffer,
          {
            caption: text,
          }
        )
        logger.info('✅ Видео успешно отправлено:', {
          description: 'Video sent successfully',
          username: subscriber.username,
          bot_name: validBotName,
        })
      } catch (sendError) {
        logger.error('❌ Ошибка при отправке видео:', {
          description: 'Error sending video',
          username: subscriber.username,
          error: sendError,
        })
      }
    }
  } catch (error) {
    logger.error('❌ Ошибка в generateTextToVideo:', {
      description: 'Error in generateTextToVideo function',
      error,
    })
  }
}
