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

export type IAIResponse = {
  result: IAIResult
  creditUsage: number
  // in millisecond
  timeUsed: number
}
