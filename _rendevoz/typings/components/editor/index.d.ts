import EventEmitter from '@/events/eventEmitter'
import { BaseEditor, Descendant, Element, Location, NodeEntry, Path } from 'slate'
import { HistoryEditor } from 'slate-history'
import { INote, INoteLabel } from '~/typings/data'
import { EditableProps, RenderElementProps, ReactEditor } from 'slate-react'
import { CustomTypes } from '../..'
import { CustomText, EmptyText } from './baseTypes'
import { CommonElement } from './commonElements'
import { OuterElement } from './outerElements'
import DragManager from '@/core/editor/hooks/DragManager'
import { EditorOverlayManager } from '@/core/editor/components/overlay/useEditorOverlay'
import { Virtualizer } from '@tanstack/react-virtual'
import { CSSProperties, ReactElement, ReactNode } from 'react'
import { IEditorEvent } from './events'

export type CustomEditor = BaseEditor &
  ReactEditor &
  // YjsEditor &
  // YHistoryEditor &
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

export type CustomElement = (CommonElement | OuterElement | CustomTypes['SlateElements']) & {
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

export interface ElementFunctions {
  selectBlock: VoidFunction
  collisionSelectBlock: VoidFunction
  getElement: () => CustomElement
  removeSelf: VoidFunction
  getPath: () => Path
  getClientBound: () => DOMRect | undefined
  getIndicatorPosition: (
    direction: 'top' | 'bottom' | 'left' | 'right'
  ) => { left: number; top: number; width: number; height: number } | undefined
}

export type IEditorInstance = Partial<{
  getTitle: () => string
  scrollToBlock: (options: { blockId?: number }) => Promise<void>
  selectBlock: (options: { blockId?: number }) => Promise<void>
  scrollToHighlight: (options: { highlightId: number }) => Promise<void>
  getSlateEditor: () => CustomEditor
  search: (query: string, reset?: boolean) => [number, string][]
  pureSearch: (query: string, reset?: boolean) => [number, string][]
  getOccurrences: (query: string) => number
  replace: (source: string, target: string, replaceCurrent?: boolean) => void
  changeOccurrence: (direction: 'up' | 'down') => void
  toggleLeftBar?: VoidFunction
  openSearch?: VoidFunction
  closeSearch?: VoidFunction
  toggleSearch?: VoidFunction
  openSetting?: VoidFunction
  closeSetting?: VoidFunction
  toggleSetting?: VoidFunction
  printToPDF: VoidFunction
  addLabel?: (label: Partial<INoteLabel>) => Promise<INoteLabel | void>
  deleteLabel?: (id: number) => Promise<void>
  toggleLabel: VoidFunction
  getScrollElement: () => HTMLElement | undefined | null
  getHighlightLocation: (highlightId: number) => NodeEntry<CustomText | EmptyText>[]
  getOverlayManager: () => EditorOverlayManager
  /**
   * Get element path by its id
   */
  getElementPathById: (id: number) => Path | undefined
  getSelectedElements: () => CustomElement[]
  getElementFunctionById: (id: number) => ElementFunctions | undefined
}>

export type DefaultAddElementHandler = (
  type: CustomElement['type'],
  instance: IEditorInstance,
  mode: 'slash' | 'block',
  opts?: {
    addAtCustomLocation?: Location
    addAtInitialSelection?: boolean
    addAtCurrentSelection?: boolean
  }
) => void

export type RegisteredEditorElement = {
  registerInMenu?: {
    slashMenu?: boolean
    addMenu?: boolean
    menuType: 'basic' | 'inline' | 'media' | 'block'
    icon?: string
    tooltip?: string
    // if present, use this, or use default
    onAddInMenu?: (actions: { type: string; defaultAddHandler: DefaultAddElementHandler; editor: CustomEditor }) => void
  }
  renderElement: (props: RenderElementProps) => ReactElement
  isInline?: boolean
  isVoid?: boolean
  type: string
  name?: string | (() => string)
}

export interface EditorProps {
  on?: (
    event: IEditorEvent & {
      editor: CustomEditor
      instance: IEditorInstance
    }
  ) => void
  stringTitle?: string
  defaultReadOnly?: boolean
  initialValue?: Descendant[]
  id: string
  noteId?: number
  readonly?: boolean
  showTitle?: boolean
  type: 'webpage' | 'note'
  onInstanceInitialized?: (instance: IEditorInstance) => void
  titleStyle?: CSSProperties
  titleContainerStyle?: CSSProperties
  title?: string | ReactNode
  titleEditable?: boolean
  innerEditorStyle?: CSSProperties
  innerEditorClassName?: string
  showToolbar?: boolean
  showBlockHandle?: boolean
  compact?: boolean
  showLeftBar?: boolean
  showRightBar?: boolean
  showHeader?: boolean
}

export type { OuterElement, CommonElement }

export * from './commonElements'

export * from './baseElements'

export * from './events'
