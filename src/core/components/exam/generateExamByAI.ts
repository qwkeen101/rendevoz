import { AIService } from '@/api/services'
import { IExamQuestion } from '~/typings'
import { Id } from '@/utils'
import { ObjectStore } from '@/api/stores'
import z from 'zod'
const prompt = (content: string, language: string) => `
Based on the following text, generate a JSON array of challenging and diverse questions in ${language}. The questions should assess not only factual recall but also higher-order thinking such as inference, analysis, synthesis, and application.
Requirements:
1. Include at least 1 inferential or analytical question.
2. Do not limit questions to surface-level facts; ask about implications, causes, or relationships where possible.
3. Vary the difficulty level across questions.
4. Use only information supported by the text.

Now, generate questions based on the following text: ${content}`
const SingleZtype = z.object({
  type: z.literal('singleSelect'),
  name: z.string(),
  choices: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        answer: z.boolean()
      })
    )
    .length(4)
})

const MultiZtype = z.object({
  type: z.literal('multiSelect'),
  name: z.string(),
  choices: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        answer: z.boolean()
      })
    )
    .length(4)
})

const TextZtype = z.object({
  type: z.literal('text'),
  name: z.string(),
  answer: z.string()
})

const NumberZtype = z.object({
  type: z.literal('number'),
  name: z.string(),
  answer: z.string()
})
const TofZtype = z.object({
  type: z.literal('trueOrFalse'),
  name: z.string(),
  answer: z.boolean()
})

const DateZtype = z.object({
  type: z.literal('date'),
  name: z.string(),
  answer: z.string().describe('YYYY/MM/DD')
})
export default async (content: string) => {
  const withContentPrompt = prompt(content, AIService.getAIOutputLanguage())
  const result = await AIService.chatStructured<Partial<IExamQuestion>[]>(withContentPrompt, {
    schema: z.array(z.union([SingleZtype, MultiZtype, NumberZtype, TextZtype, DateZtype, TofZtype]))
  })
  const examId = Id.getId()
  const finalQuestions = result.map(i => {
    const question = {
      ...i,
      parentObjectId: examId,
      content: []
    }
    return question
  })
  const questions = await Promise.all(finalQuestions.map(async i => await ObjectStore('examQuestion').addOne({ ...i })))
  const exam = await ObjectStore('exam').addOne({ questions: questions.map(i => i.id) })
  return exam
}
