import { IQuestion } from '~/typings'
export type IAIEvent =
  | {
      type: 'questionGotoOriginalPlace'
      originalId: number
    }
  | {
      type: 'createQuestion'
      newQuestionId: number
    }
  | {
      type: 'getOriginalText'
      originalId: number
    }

export type AISummarizeEvent = { summary: string; questions: (Omit<IQuestion, 'answerPointers'> & { answerPointers: number[] })[] }

export type IAIResult = {
  summary: string
  questions: {
    question: string
    choices?: string[]
    answer: string | string[] | boolean
    relatedIds: number[]
    explanation: string
    rightAnswerIndex?: number | number[]
  }[]
}