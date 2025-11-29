import { IBase, IGeneralSource } from '~/typings'
import { IAIActions } from '../../../src/core/ai/chat/ChatDialog'
import { LanguageModelV1Source } from '@ai-sdk/provider'
import { CoreMessage } from 'ai'

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

export type ISubChat = {
  ids: number[]
  currentChat: number
}

export type IAISummary = {
  mindmap?: string
  summary: {
    summary: string
    keywords?: string[]
  }
}

export type IAIResponse = {
  result: IAIResult
  creditUsage: number
  // in millisecond
  timeUsed: number
}

export type IChat = {
  name: string
  objectId?: number
  parentMetaId?: number
  messages: number[]
  web?: boolean
  reasoning?: boolean
} & IBase

export type IChatInstance = Partial<{
  chat: VoidFunction
  scrollToMessage: (id: number) => void
}>

export type IAISearchSource = {
  id: number
  url: string
  title: string
  logo?: string
  abstract?: string
  content?: string
  time?: number
  source?: string
  type: 'web' | 'scholar'
  pdfDownloadUrl?: string
}

export type IAIMessage = {
  role: CoreMessage['role']
  content: CoreMessage['content']
  id: number
  hidden?: boolean
  source?: IGeneralSource
  references?: IAISearchSource[]
  reasoningCollapsed?: boolean
  reasoning?: string
  timeUsed?: number
  loadState?: 'loading' | 'failed' | 'succeeded' | 'connecting'
  type?: 'translate' | 'explain' | 'summarize' | IAIActions | 'explainExamQuestion'
  collapsed?: boolean
  parentObjectId?: number
  prevMessageId?: number
  note?: number
  label?: number
  noContext?: boolean
} & IBase

