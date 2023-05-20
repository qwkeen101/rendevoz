import EventEmitter from '@/events/eventEmitter'
import { YHistoryEditor, YjsEditor } from '@slate-yjs/core'
import { BaseEditor, Element } from 'slate'
import { HistoryEditor } from 'slate-history'
import { ReactEditor } from '@/core/editor/slate-react'
import { INote } from '~/typings/data'
import { EditableProps } from '../slate-react/components/editable'
import { CustomText, EmptyText } from './baseTypes'
import { CommonElement } from './commonElements'
import { OuterElement } from './outerElements'
import DragManager from '@/core/editor/hooks/DragManager'
import { EditorOverlayManager } from '@/core/editor/components/overlay/useEditorOverlay'
import { Virtualizer } from '@tanstack/react-virtual'
import React, { ReactElement, ReactNode, RefObject } from 'react'

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
    currentCopyElements?: Element[]
    currentDragElement?: HTMLElement
    dragManager?: DragManager
    overlayManager?: EditorOverlayManager
  } & {
    fontSize?: number
  } & {
    handler?: (e: { data?: any; type: string }) => void
    onHighlightClick?: (highlightId: number) => void
    onHighlightDrag?: (highlightId: number, editor: CustomEditor) => void
    onHighlight?: (highlightId: number) => void
    onHighlightRemove?: (highlightId: number) => void
    onTranslate?: (selectedText: string, blockId: number, e: React.MouseEvent) => void
    onSearch?: (selectedText: string, blockId: number, e: React.MouseEvent) => void
    onContentRendered?: () => void
    initialized?: boolean
    contentInitialized?: boolean
    readonly?: boolean
    innerRef?: EditableProps['innerRef']
    virtualizer?: Virtualizer
    renderTitle?: (ref: (node: HTMLElement) => void) => ReactNode
    goToHighlight?: (highlightId: number) => void
    titleEle?: HTMLElement | null
  }

export type CustomElement = (CommonElement | OuterElement) & {
  hide?: boolean
  id: number
  color?: string
  background?: string
  align?: string
  cardType?: string
  collapsed?: boolean
  level?: number
}

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText | EmptyText
  }
}

export type { OuterElement, CommonElement, CommonElement }

export * from './commonElements'

export * from './baseElements'
