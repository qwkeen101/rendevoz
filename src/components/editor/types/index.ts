import { Noop } from '@/common/types'
import EventEmitter from '@/events/eventEmitter'
import { YHistoryEditor, YjsEditor } from '@slate-yjs/core'
import { BaseEditor, Element } from 'slate'
import { HistoryEditor } from 'slate-history'
import { ReactEditor } from 'slate-react'
import { CustomText, EmptyText } from './baseTypes'
import { CommonElement } from './commonElementTypes'
import { OuterElement } from './outerElementTypes'

export type CustomEditor = BaseEditor &
  ReactEditor &
  YjsEditor &
  YHistoryEditor &
  HistoryEditor & {
    emitter?: EventEmitter
    id?: string
    noteId?: number
  } & {
    currentEnterElement?: Element
    currentAddClickElement?: Element
  } & {
    fontSize?: number
  } & {
    handler?: (e: { data?: any; type: string }) => void
  }

export type CustomElement = CommonElement | OuterElement

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement & { hide?: boolean; id: number }
    Text: CustomText | EmptyText
  }
}

export type { OuterElement, CommonElement }
