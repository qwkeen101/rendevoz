// review search result, decide whether continue searching
import { IAISearchTask } from '@/api/services/ai/deepsearch/runSearchTask'
import { reviewPrompt, systemInstruction } from '@/api/services/ai/deepsearch/consts'
import { AIService } from '@/api/services'
import z from 'zod'

export default async (query: string, tasks: IAISearchTask[]) => {
  const context = tasks.map(
    i => `
    <research>
      <query>\n${i.query}\n</learning>
      <goal>\n${i.researchGoal}\n</goal>
      <learning>\n${i.learning}\n</learning>
    </research>
  `
  )
  const prompt = reviewPrompt.replace('{context}', context.join('\n')).replace('{query}', query)
  const res = await AIService.chatStructured<{
    summary: string
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
        content: prompt
      }
    ],
    {
      schema: z.object({
        summary: z.string(),
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
