import { IBase } from '~/typings'
import { Descendant } from 'slate'
import { RefObject } from 'react'
export type IExam = {
  questions: number[]
  name?: string
  specType: 'exam'
  analyticsSort?: 'name' | 'wrong' | 'correct' | 'order'
  history?: {
    id: number
    title?: string
    time: number
    questions: IExamQuestion[]
    // how many questions were correct
    correct: number
    comment?: string
  }[]
} & IBase

export type IExamQuestion = {
  specType: 'examQuestion'
  name: string
  description?: Descendant[]
  parentObjectId: number
  comment?: {
    id: number
    time: number
    text: string
  }[]
} & (
  | IExamTextQuestion
  | IExamImageOcclusionQuestion
  | IExamDateQuestion
  | IExamNumberQuestion
  | IExamLocationQuestion
  | IExamMultiSelectQuestion
  | IExamSingleSelectQuestion
  | IExamTrueOrFalseQuestion
  | IExamDescription
  | IExamClozeQuestion
)

type IQuestionWithHistory = {
  question: IExamQuestion
  correct: number
  wrong: number
  historys: {
    historyId: number
    time: number
    name: string
    question: IExamQuestion
  }[]
}
export type IExamState = {
  mode: 'edit' | 'test' | 'history' | 'display'
  historyVisible?: boolean
  currentFocusQuestionId?: number
  currentHistory?: Required<IExam>['history'][0]
  questionHistorySort?: 'wrong' | 'correct' | 'name' | 'order'
  allQuestions?: IExamQuestion[]
  currentViewingQuestionWithHistory?: IQuestionWithHistory
  categorizedQuestions?: Record<number, IQuestionWithHistory>
  explainSource?: (question: IExamQuestion) => void
}

export type IExamInstance = {
  addQuestion: (opts: { type: IExamQuestion['type']; direction: 'before' | 'after'; target?: number }) => Promise<IExamQuestion>
  deleteQuestion: (id: number) => void
  submit: VoidFunction
  viewHistory: (id: number) => void
  scrollElementRef: RefObject<HTMLDivElement>
}

export type IExamDescription = {
  id: number
  type: 'description'
  value?: Descendant[]
}
export type IExamImageOcclusionQuestion = {
  id: number
  type: 'imageOcclusion'
  name: string
  url?: string
  content: {
    id: number
    answer?: string
    value?: string
    // x, y
    position: [number, number]
    color?: string
    // width, height
    size: [number, number]
    tip?: string
    rotation?: number
    type: 'rect' | 'circle' | ''
  }[]
  arrows?: {
    // x1, y1, x2, y2
    id: number
    color: string
    position: [number, number, number, number]
  }[]
}
export type IExamTextQuestion = {
  id: number
  type: 'text'
  name: string
  value?: string
  answer?: string
}

export type IExamTrueOrFalseQuestion = {
  id: number
  type: 'trueOrFalse'
  name: string
  value?: boolean
  answer?: boolean
}

export type IExamNumberQuestion = {
  id: number
  type: 'number'
  name: string
  value?: string
  answer?: string
}

export type IExamClozeQuestion = {
  id: number
  type: 'cloze'
  name: string
  content?: Descendant[]
}

export type IExamDateQuestion = {
  id: number
  type: 'date'
  value?: string
  answer?: string
}

export type IExamLocationQuestion = {
  id: number
  type: 'location'
  name: string
}

export type IExamMultiSelectQuestion = {
  id: number
  type: 'multiSelect'
  name: string
  choices: {
    id: number
    name: string
    answer?: boolean
    value?: boolean
    image?: string
  }[]
}

export type IExamSingleSelectQuestion = {
  id: number
  type: 'singleSelect'
  name: string
  choices: {
    id: number
    name: string
    answer?: boolean
    value?: boolean
    image?: string
  }[]
}
