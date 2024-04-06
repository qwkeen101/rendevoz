import EventEmitter from '@/events/eventEmitter'
import { BaseEditor, Descendant, Element, Location, Operation, Path } from 'slate'
import { HistoryEditor } from 'slate-history'
import { INote } from '~/typings/data'
import { EditableProps, RenderElementProps, ReactEditor } from 'slate-react'
import { CustomTypes, IEditorInstance } from '.'
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
    currentEnterElement?: Element
    currentAddClickElement?: Element
    currentCopyElement?: Element
    currentCopyElements?: Element[]
    overlayManager?: EditorOverlayManager
  } & {
    emitter?: EventEmitter
    id?: string
    onOperationApplied?: (op: Operation) => void
    onHighlightClick?: (highlightId: number) => void
    initialized?: boolean
    contentInitialized?: boolean
    innerRef?: EditableProps['innerRef']
    virtualizer?: Virtualizer
    renderTitle?: (ref: (node: HTMLElement) => void) => ReactNode
    goToHighlight?: (highlightId: number) => void
    titleEle?: HTMLElement | null
    on: (event: IEditorEvent) => Promise<any>
    editorMode?: 'note' | 'webpage' | 'syncedBlock'
    labelIds?: number[]
    instance: IEditorInstance
    noBottomPadding?: boolean
    onSelectionChange?: VoidFunction
    initialScrollOffset?: number
  }

export type CustomElement = (CommonElement | OuterElement) & {
  hide?: boolean
  id: number
  color?: string
  background?: string
  align?: string
  cardType?: 'embeded' | 'block'
  collapsed?: boolean
  level?: number
  width?: number
  height?: number
  folded?: boolean
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
  openMathForm?: VoidFunction
  openPickMeta?: VoidFunction
  openTypeUrlForm?: VoidFunction
  getIndicatorPosition: (
    direction: 'top' | 'bottom' | 'left' | 'right'
  ) => { left: number; top: number; width: number; height: number } | undefined
}

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
  onClick?: React.MouseEventHandler
  on?: (
    event: IEditorEvent & {
      editor: CustomEditor
      instance: IEditorInstance
    }
  ) => void
  layout?: {
    virtualizer?: boolean
    showHeader?: boolean
    showTitle?: boolean
    showToolbar?: boolean
    showBlockHandle?: boolean
    disableOverscanInReadOnly?: boolean
    showLastSave?: boolean
    showProps?: boolean
    showBottomPadding?: boolean
    showHoverObjectDetails?: boolean
    showBlockHandleAdd?: boolean
    alwaysShowPlaceholder?: boolean
    showPlaceholderInFirstLine?: boolean
    propsMetaId?: number
    canScrollIntoView?: boolean
  }
  ai?: {
    summary?: string
    questions?: number[]
  }
  title?: {
    customTitleRenderer?: (realTitle: string) => ReactElement
    titleStyle?: CSSProperties
    titleContainerStyle?: CSSProperties
    titleEditable?: boolean
  }
  // title can be custom node, you should pass string title to show in header
  stringTitle?: string
  styles?: {
    editorContainerStyle?: CSSProperties
    pageMinPadding?: string | number
    bottomPadding?: number
    containerHeight?: number | string
    containerMaxHeight?: number | string
    containerStyle?: CSSProperties
  }
  header?: {
    boxShadow?: boolean
    display?: {
      modeSwitcher?: boolean
      search?: boolean
      label?: boolean
      translate?: boolean
      title?: boolean
      leftbar?: boolean
      more?: boolean
    }
    moreOptions?: {
      exportMD?: boolean
      exportPDF?: boolean
    }
    // before leftbar
    leftExtra?: ReactElement
    rightExtra?: ReactElement
  }
  state?: {
    pageWidth?: INote['pageWidth']
    fontSize?: number
    lastSavedAt?: number
    typeface?: INote['typeface']
    lineSpacing?: INote['lineSpacing']
    saveImgLocally?: boolean
    showSyncBlockShadow?: boolean
  }
  labelType?: string
  labelIds?: number[]
  toolbar?: {
    fontSize?: boolean
    color?: boolean
    highlight?: boolean
    extra?: boolean
  }
  classNames?: {
    editorContainerClassName?: string
  }
  initialScrollOffset?: number
  // slate can not be controlled component, but you can use instance.replaceChildren to replace its value (lose all history, no redo/undo)
  defaultValue?: Descendant[]
  id: string
  // controlled
  readOnly?: boolean
  onReadOnlyChange?: (v: boolean) => void
  onOperationApplied?: (operation: Operation) => void
  // not controlled
  defaultReadOnly?: boolean
  textboxMode?: boolean
  placeholder?: string
  onInstanceInitialized?: (instance: IEditorInstance) => void
}

export type { OuterElement, CommonElement }

export * from './commonElements'

export * from './baseElements'

export * from './events'

export * from './instance'
