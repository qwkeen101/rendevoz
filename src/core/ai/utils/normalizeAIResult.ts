import { IQuestion } from '~/typings'
import Id from '@/utils/id'
import { AISummarizeEvent, IAIResult } from '@/core/ai/components/AskAIPanel'

const removeRepeatIds = (ids: number[] | undefined) => {
  const set = new Set(ids)
  return Array.from(set.values())
}

export default (result: IAIResult, questionType: IQuestion['questionType']): AISummarizeEvent => {
  if (!result.questions) {
    return {
      summary: result.summary,
      questions: []
    }
  }
  switch (questionType) {
    case 'text': {
      return {
        summary: result.summary,
        questions: result.questions.map(i => ({
          id: Id.getId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          specType: 'question',
          answerType: 'pointer',
          answerPointers: [...removeRepeatIds(i.relatedIds)],
          questionType: 'text',
          name: i.question,
          explanation: i.answer
        }))
      }
    }
    case 'singleSelect': {
      return {
        summary: result.summary,
        questions: result.questions.map(i => ({
          id: Id.getId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          specType: 'question',
          answerType: 'pointer',
          answerPointers: [...removeRepeatIds(i.relatedIds)],
          questionType: 'singleSelect',
          choices: i.answer,
          name: i.question,
          sAnswer: (i.answer as string[])[i.rightAnswerIndex as number],
          explanation: i.explanation
        }))
      }
    }
    case 'trueOrFalse': {
      return {
        summary: result.summary,
        questions: result.questions.map(i => ({
          id: Id.getId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          specType: 'question',
          answerType: 'pointer',
          answerPointers: [...removeRepeatIds(i.relatedIds)],
          questionType: 'trueOrFalse',
          name: i.question,
          sAnswer: i.answer,
          explanation: i.explanation
        }))
      }
    }
    case 'multiSelect': {
      return {
        summary: result.summary,
        questions: result.questions.map(i => ({
          id: Id.getId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          specType: 'question',
          answerType: 'pointer',
          answerPointers: [...removeRepeatIds(i.relatedIds)],
          questionType: 'multiSelect',
          choices: i.answer,
          name: i.question,
          sAnswer: [...i.rightAnswerIndex.map(o => i.answer[o])],
          explanation: i.explanation
        }))
      }
    }
  }
}
