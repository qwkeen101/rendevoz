import { AIService } from '@/api/services'
import { ObjectStore } from '@/api/stores'
import { GlobalSetting } from '@/core'
import { CoreMessage } from 'ai'

export default async (
  id: number,
  opts?: {
    signal?: AbortSignal
    context?: number
    onStartOutput?: VoidFunction
    initialMessages?: CoreMessage[] | (() => Promise<CoreMessage[]>)
  }
) => {
  const language = AIService.getAIOutputLanguage()
  const contextCount = opts?.context ?? Number(GlobalSetting.getSetting().AI.aiChatHistoryCount)
  const chat = await ObjectStore('chat').getOneById(id)
  if (chat) {
    let messages: CoreMessage[] = [
      {
        role: 'system',
        content: `You should always respond in ${language}, regardless of the language of the question.`
      }
    ]
    if (opts?.initialMessages) {
      const initialMessages = typeof opts.initialMessages === 'function' ? await opts.initialMessages() : opts.initialMessages
      initialMessages.forEach(m => messages.push(m))
    }
    const userMessages = (await ObjectStore('message').getMultipleByIds(chat.messages))
      .filter(i => !i.noContext)
      .map(i => ({
        content: i.content,
        role: i.role,
        id: i.id
      }))
    if (userMessages.at(-1)?.role === 'assistant') {
      const assistantMessage = userMessages.pop()!
      await ObjectStore('message').deleteOneById(assistantMessage.id)
      await ObjectStore('chat').updateOne({ id: chat.id, messages: chat.messages.filter(i => i !== assistantMessage.id) })
    }
    const lastMessage = userMessages.pop()!
    if (!Number.isNaN(contextCount)) {
      const context = contextCount === 0 ? [] : userMessages.slice(-contextCount)
      messages = [...messages, ...context]
    } else {
      messages = [...messages, ...userMessages]
    }
    messages.push(lastMessage)
    const message = await ObjectStore('message').addOne({
      content: '',
      role: 'assistant',
      parentObjectId: chat.id,
      loadState: 'connecting'
    })
    await ObjectStore('chat').updateOne({ id: chat.id, messages: [...chat.messages, message.id] })
    await AIService.chatStream(messages, {
      reasoning: chat.reasoning,
      web: chat.web,
      onFailed: () => {
        ObjectStore('message').updateOne({ id: message.id, loadState: 'failed' })
      },
      onEnd: timeUsed => {
        ObjectStore('message').updateOne({ id: message.id, timeUsed, loadState: 'succeeded' })
      },
      onReferences: async reference => {
        const currentMessage = await ObjectStore('message').getOneById(message.id)
        if (currentMessage) {
          await ObjectStore('message').updateOne({
            id: message.id,
            references: [...(currentMessage.references || []), reference],
            loadState: 'loading'
          })
        }
      },
      onReasoning: async text => {
        const currentMessage = await ObjectStore('message').getOneById(message.id)
        if (currentMessage) {
          await ObjectStore('message').updateOne({
            id: currentMessage.id,
            loadState: 'loading',
            reasoning: (currentMessage.reasoning ?? '') + text
          })
        }
      },
      onLoad: async text => {
        const currentMessage = await ObjectStore('message').getOneById(message.id)
        if (currentMessage) {
          if (!currentMessage.content) {
            opts?.onStartOutput?.()
          }
          await ObjectStore('message').updateOne({ id: currentMessage.id, content: currentMessage.content + text, loadState: 'loading' })
        }
      },
      signal: opts?.signal
    })
  }
}
