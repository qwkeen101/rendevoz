import { AIService } from '@/api/services'
import z from 'zod'
import { CoreMessage } from 'ai'

export default async (messages: Partial<CoreMessage>[]) => {
  const prompt = `Please read the following conversation and generate a concise title that captures the main topic and core idea:
${messages
  .map(i => {
    if (typeof i.content === 'string') {
      return i.content
    }
    return i.content
      ?.map(i => i.type === 'text' && i.text)
      .filter(i => i)
      .join('')
  })
  .join('')}
Requirements: The title should be written in ${AIService.getAIOutputLanguage()} and no longer than ten words and clearly reflect the primary subject of the discussion.
`
  const title = await AIService.chatStructured<string>(prompt, {
    toast: false,
    schema: z.string()
  })
  return title
}
