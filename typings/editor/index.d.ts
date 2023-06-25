import EventEmitter from '@/events/eventEmitter'
import { YHistoryEditor, YjsEditor } from '@slate-yjs/core'
import { BaseEditor, Element, Location, NodeEntry } from 'slate'
import { HistoryEditor } from 'slate-history'
import { ReactEditor } from '@/core/editor/slate-react'
import { IHighlightLabel, INote, INoteLabel, IWebpageLabel } from '~/typings/data'
import { EditableProps } from '../slate-react/components/editable'
import { CustomText, EmptyText } from './baseTypes'
import { CommonElement } from './commonElements'
import { OuterElement } from './outerElements'
import DragManager from '@/core/editor/hooks/DragManager'
import { EditorOverlayManager } from '@/core/editor/components/overlay/useEditorOverlay'
import { Virtualizer } from '@tanstack/react-virtual'
import React, { ReactElement, ReactNode, RefObject } from 'react'
import { IEditorEvent } from './events'

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
    initialized?: boolean
    contentInitialized?: boolean
    readonly?: boolean
    innerRef?: EditableProps['innerRef']
    virtualizer?: Virtualizer
    renderTitle?: (ref: (node: HTMLElement) => void) => ReactNode
    goToHighlight?: (highlightId: number) => void
    titleEle?: HTMLElement | null
    on: (event: IEditorEvent) => void
    type?: 'note' | 'webpage'
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

export type IEditorInstance = Partial<{
  scrollToBlock: (options: { blockId?: number }) => Promise<void>
  selectBlock: (options: { blockId?: number }) => Promise<void>
  scrollToHighlight: (options: { highlightId: number }) => Promise<void>
  getSlateEditor: () => CustomEditor
  search: (query: string, reset?: boolean) => [number, string][]
  pureSearch: (query: string, reset?: boolean) => [number, string][]
  getOccurrences: (query: string) => number
  replace: (source: string, target: string, replaceCurrent?: boolean) => void
  changeOccurrence: (direction: 'up' | 'down') => void
  openSearch?: VoidFunction
  closeSearch?: VoidFunction
  toggleSearch?: VoidFunction
  addLabel?: (label: Partial<INoteLabel>) => Promise<INoteLabel | void>
  deleteLabel?: (id: number) => Promise<void>
  toggleLabel: VoidFunction
  getScrollElement: () => HTMLElement | undefined | null
  getHighlightLocation: (highlightId: number) => NodeEntry<CustomText | EmptyText>[]
}>

export type { OuterElement, CommonElement, CommonElement }

export * from './commonElements'

export * from './baseElements'

export * from './events'
