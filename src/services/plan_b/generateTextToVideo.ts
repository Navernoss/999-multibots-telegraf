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
import { VIDEO_MODELS_CONFIG } from '@/price'
import { VideoModel } from '@/interfaces'
import {
  sendServiceErrorToUser,
  sendServiceErrorToAdmin,
} from '@/helpers/error'

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
  const { bot } = getBotByName(bot_name)
  if (!bot) {
    console.error(`Bot instance not found for name: ${bot_name}`)
    throw new Error('Bot instance not found')
  }

  try {
    console.log('videoModel', videoModel)
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
      botInfo: { username: bot_name },
      telegram: bot.telegram,
      session: { mode: 'TextToVideo' },
    } as any

    const { newBalance, paymentAmount } = await processBalanceVideoOperation(
      tempCtx,
      videoModel,
      is_ru
    )

    bot.telegram.sendMessage(
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
      bot_name
    )

    return { videoLocalPath }
  } catch (error) {
    console.error('Error generating video:', error)
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
