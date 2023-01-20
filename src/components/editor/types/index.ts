import { Noop } from '@/common/types'
import EventEmitter from '@/events/eventEmitter'
import { YHistoryEditor, YjsEditor } from '@slate-yjs/core'
import { BaseEditor, Element } from 'slate'
import { HistoryEditor } from 'slate-history'
import { ReactEditor } from 'slate-react'
import { INote } from '~/typings/data'
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
    note?: INote
  } & {
    currentEnterElement?: Element
    currentAddClickElement?: Element
    currentCopyElement?: Element
  } & {
    fontSize?: number
  } & {
    handler?: (e: { data?: any; type: string }) => void
    initialized?: boolean
    readonly?: boolean
  }

export type CustomElement = (CommonElement | OuterElement) & {
  hide?: boolean
  id: number
  color?: string
  background?: string
  align?: string
  cardType?: string
}

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText | EmptyText
  }
}

export type { OuterElement, CommonElement }
