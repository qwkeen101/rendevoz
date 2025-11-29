import { AIService } from '@/api/services'
import { systemInstruction, systemQuestionPrompt } from '@/api/services/ai/deepsearch/consts'
import z from 'zod'

export type IResearchQuestion = {
  researchGoal: string
  query: string
}
export default async (query: string) => {
  const res = await AIService.chatStructured<{
    explanation: string
    questions: {
      goal: string
      query: string
    }[]
  }>(
    [
      {
        role: 'system',
        content: systemInstruction.replace('{now}', new Date().toISOString()).replace('{language}', AIService.getAIOutputLanguage())
      },
      {
        role: 'user',
        content: systemQuestionPrompt.replace('{query}', query)
      }
    ],
    {
      schema: z.object({
        explanation: z.string(),
        questions: z.array(
          z.object({
            goal: z.string(),
            query: z.string()
          })
        )
      })
    }
  )
  return res
}
