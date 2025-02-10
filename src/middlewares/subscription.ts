import {
  createUser,
  getUserByTelegramId,
  incrementBalance,
  getReferalsCountAndUserData,
} from '@/core/supabase'
import { CreateUserData, MyContext } from '@/interfaces'

import { getSubScribeChannel } from '@/handlers'
import { isRussian } from '@/helpers/language'
import { getUserPhotoUrl } from './getUserPhotoUrl'
import { verifySubscription } from './verifySubscription'

const BONUS_AMOUNT = 100

export const subscriptionMiddleware = async (
  ctx: MyContext,
  next: () => Promise<void>
): Promise<void> => {
  console.log('subscriptionMiddleware')
  const isRu = isRussian(ctx)
  try {
    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing')
    if (!ctx.message || !('text' in ctx.message)) {
      console.log('CASE: �� Нет текста')
      return await next()
    }

    if (typeof ctx.message.text !== 'string') {
      console.log('CASE: 🔄 Неверный формат текста')
      return await next()
    }

    // Проверка на полную ссылку или просто команду /start
    const botNameMatch = ctx.message.text.match(
      /https:\/\/t\.me\/([a-zA-Z0-9_]+)\?start=(\d+)/
    )
    let botName = ''
    let startNumber = ''
    console.log('startNumber', startNumber)

    if (botNameMatch) {
      botName = botNameMatch[1]
      startNumber = botNameMatch[2]
    } else if (ctx.message.text.startsWith('/start')) {
      console.log(
        'CASE: 🔄 Команда /start. botInfo.username:',
        ctx.botInfo.username
      )
      console.log('ctx.message.text', ctx.message.text)
      // Обработка команды /start без ссылки
      botName = ctx.botInfo.username
      const parts = ctx.message.text.split(' ')
      console.log('parts', parts)
      startNumber = parts.length > 1 ? parts[1] : ''
    } else {
      console.log('Invalid start link')
      return await next()
    }

    if (!ctx.from) {
      console.error('No user data found in context')
      await ctx.reply('Error: No user data found')
      return await next()
    }

    ctx.session.inviteCode = startNumber

    const {
      username,
      id: telegram_id,
      first_name,
      last_name,
      is_bot,
      language_code,
    } = ctx.from

    const finalUsername = username || first_name || telegram_id.toString()

    const existingUser = await getUserByTelegramId(ctx)
    console.log('subscriptionMiddleware - existingUser:', existingUser)

    const SUBSCRIBE_CHANNEL_ID = getSubScribeChannel(ctx)

    if (existingUser) {
      console.log('CASE: existingUser', existingUser)
      const isSubscribed = await verifySubscription(
        ctx,
        language_code,
        SUBSCRIBE_CHANNEL_ID
      )
      if (isSubscribed) {
        console.log('CASE 1: isSubscribed', isSubscribed)
        ctx.scene.enter('startScene')
      }
      return
    }
    console.log('CASE: user not exists')
    const photo_url = await getUserPhotoUrl(ctx, telegram_id)

    if (ctx.session.inviteCode) {
      console.log('CASE: ctx.session.inviteCode', ctx.session.inviteCode)
      const { count, userData } = await getReferalsCountAndUserData(
        ctx.session.inviteCode.toString()
      )

      ctx.session.inviter = userData.user_id

      const newCount = count + 1
      if (ctx.session.inviteCode) {
        await ctx.telegram.sendMessage(
          ctx.session.inviteCode,
          isRu
            ? `🔗 Новый пользователь зарегистрировался по вашей ссылке: @${finalUsername}.\n🆔 Уровень аватара: ${count}\n🎁. За каждого приглашенного друга вы получаете дополнительные ${BONUS_AMOUNT} звезд для генерации!\n🤑 Ваш новый баланс: ${
                userData.balance + BONUS_AMOUNT
              }⭐️ `
            : `🔗 New user registered through your link: @${finalUsername}.🆔 Avatar level: ${count}\n🎁. For each friend you invite, you get additional ${BONUS_AMOUNT} stars for generation!\n🤑 Your new balance: ${
                userData.balance + BONUS_AMOUNT
              }⭐️`
        )
        await incrementBalance({
          telegram_id: startNumber,
          amount: BONUS_AMOUNT,
        })
        await ctx.telegram.sendMessage(
          `@${SUBSCRIBE_CHANNEL_ID}`,
          `🔗 Новый пользователь зарегистрировался в боте: @${finalUsername}. По реферальной ссылке от: @${userData.username}.\n🆔 Уровень аватара: ${newCount}\n🎁 Получил(a) бонус в размере ${BONUS_AMOUNT}⭐️ на свой баланс.\nСпасибо за участие в нашей программе!`
        )

        // const isSubscribed = await verifySubscription(
        //   ctx,
        //   language_code,
        //   SUBSCRIBE_CHANNEL_ID
        // )
        // console.log('CASE 2: isSubscribed', isSubscribed)
        // if (isSubscribed) {
        //   console.log('CASE 3: ctx.scene.enter(startScene)')
        //   ctx.scene.enter('startScene')
        // }
      }
    } else {
      console.log('CASE: ctx.session.inviteCode not exists')

      const { count } = await getReferalsCountAndUserData(
        telegram_id.toString()
      )
      await ctx.telegram.sendMessage(
        `@${SUBSCRIBE_CHANNEL_ID}`,
        `🔗 Новый пользователь зарегистрировался в боте: @${finalUsername}.\n🆔 Уровень аватара: ${count}.`
      )
    }

    const userData = {
      username: finalUsername,
      telegram_id: telegram_id.toString(),
      first_name: first_name || null,
      last_name: last_name || null,
      is_bot: is_bot || false,
      language_code: language_code || 'en',
      photo_url,
      chat_id: ctx.chat?.id || null,
      mode: 'clean',
      model: 'gpt-4-turbo',
      count: 0,
      aspect_ratio: '9:16',
      balance: 100,
      inviter: ctx.session.inviter || null,
      bot_name: botName,
    }

    await createUser(userData as CreateUserData)

    await next()
  } catch (error) {
    console.error('Critical error in subscriptionMiddleware:', error)
    throw error
  }
}
