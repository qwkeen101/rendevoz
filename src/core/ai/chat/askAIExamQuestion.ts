import { IChat, IExamQuestion } from '~/typings'
import extractQuestionText from '@/core/components/exam/extractQuestionText'
import { ObjectStore } from '@/api/stores'
import getChatResponse from '@/core/ai/chat/getChatResponse'
import { t } from 'i18next'
import { TYPE_TO_QUESTION_NAME } from '@/core/components/exam/consts'
import { CoreMessage } from 'ai'

const getPrompt = (question: IExamQuestion) => {
  return `Give a hint of the question, the hint should provide some relevant background information and insight from the content to help reader find the answer instead of revealing the answer. Question is ${[t(TYPE_TO_QUESTION_NAME[question.type]), question.name, extractQuestionText(question)].filter(i => i).join(' ')}`
}

export default async (opts: {
  chatId: number
  initialMessages?: CoreMessage[]
  parentMetaId?: number
  question: IExamQuestion
}) => {
  const prompt = getPrompt(opts.question)
  const message = await ObjectStore('message').addOne({
    content: prompt,
    role: 'user',
    type: 'explainExamQuestion',
    source: {
      type: 'question',
      name: opts.question.name,
      objectId: opts.question.id,
      metaId: opts.parentMetaId
    }
  })
  const chat = await ObjectStore('chat').getOneById(opts.chatId)
  if (chat) {
    const messages: IChat['messages'] = [...(chat?.messages || []), message.id]
    await ObjectStore('chat').updateOne({ id: opts.chatId, messages })
    getChatResponse(opts.chatId, {
      initialMessages: opts.initialMessages
    })
  }
}
