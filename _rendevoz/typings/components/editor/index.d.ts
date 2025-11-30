import { BaseEditor, Descendant, Element, Location, Operation, Path, Range } from 'slate'
import { HistoryEditor } from 'slate-history'
import { IAISummary, ILabelContainerProps, ISidebarDefaultProps, ISubChat } from '~/typings/data'
import { EditableProps, RenderElementProps, ReactEditor } from 'slate-react'
import { IEditorInstance, Box } from '.'
import { CustomText, EmptyText } from './baseTypes'
import { CommonElement } from './commonElements'
import { OuterElement } from './outerElements'
import { EditorOverlayManager } from '@/core/editor/components/overlay/useEditorOverlay'
import { Virtualizer } from '@tanstack/virtual-core'
import { CSSProperties, ReactElement, ReactNode } from 'react'
import { IEditorEvent } from './events'
import { IMenuLayoutItem } from '@/components/base/menu'
import { ToolbarConfig } from '@rendevoz/editor/toolbar'

export type CustomEditor = BaseEditor &
  ReactEditor &
  HistoryEditor & {
    currentEnterElement?: Element
    currentAddClickElement?: Element
    overlayManager?: EditorOverlayManager
  } & {
    id?: string
    changeHandled?: boolean
    onOperationApplied?: (op: Operation) => void
    onHighlightClick?: (highlightId: number, e: MouseEvent) => void
    virtualizer?: Virtualizer
    titleEle?: HTMLElement | null
    labelIds?: number[]
    instance: IEditorInstance
    nodeToDecorations: Map<CustomElement, Range[]>
  }
  toolbarConfig?: ToolbarConfig

export type CustomElement = (CommonElement | OuterElement) & {
  hide?: boolean
  id: number
  color?: string
  background?: string
  translated?: boolean
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
  toolbarConfig?: ToolbarConfig
}

export interface ElementFunctions {
  selectBlock: VoidFunction
  deselectBlock: VoidFunction
  collisionSelectBlock: (box: Box) => void
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
  toolbarConfig?: ToolbarConfig
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
  toolbarConfig?: ToolbarConfig
  renderElement: (props: RenderElementProps) => ReactElement
  isInline?: boolean
  isVoid?: boolean
  type: string
  name?: string | (() => string)
}
export type IEditorAISummary = IAISummary & {
  outlines: {
    highlights: {
      description: string
      id: number
    }[]
    title: string
    description: string
    id: number
  }[]
  summary: {
    summary: string
    takeaways: {
      description: string
      id: number
    }[]
    keywords: string[]
  }
  toolbarConfig?: ToolbarConfig
}
export interface EditorProps {
  onClick?: React.MouseEventHandler
  metaId?: number
  on?: (
    event: IEditorEvent & {
      editor: CustomEditor
      instance: IEditorInstance
    }
  toolbarConfig?: ToolbarConfig
  ) => Promise<any>
  aiSummary?: IEditorAISummary
  layout?: {
    // for initial placeholder
    firstLinePlaceholder?: string
    emptyPlaceholder?: ReactElement
    virtualizer?: boolean
    showHeader?: boolean
    showTitle?: boolean
    showToolbar?: boolean
    showBlockHandle?: boolean
    overscan?: number
    disableOverscanInReadOnly?: boolean
    showLastSave?: boolean
    showProps?: boolean
    showBottomPadding?: boolean
    showBlockHandleAdd?: boolean
    alwaysShowPlaceholder?: boolean
    propsMetaId?: number
    settings?: (onClose?: VoidFunction) => IMenuLayoutItem[]
    displayMode?: boolean
  }
  toolbarConfig?: ToolbarConfig
  title?: {
    customTitleRenderer?: (realTitle: string) => ReactElement
    titleStyle?: CSSProperties
    titleContainerStyle?: CSSProperties
    titleEditable?: boolean
    titleClassName?: string
  }
  toolbarConfig?: ToolbarConfig
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
  toolbarConfig?: ToolbarConfig
  header?: {
    boxShadow?: boolean
    display?: {
      modeSwitcher?: boolean
      search?: boolean
      label?: boolean
      translate?: boolean
      title?: boolean
      more?: boolean
    }
  toolbarConfig?: ToolbarConfig
    moreOptions?: {
      exportMD?: boolean
      exportPDF?: boolean
    }
  toolbarConfig?: ToolbarConfig
    leftExtra?: ReactElement
    rightExtra?: ReactElement
  }
  toolbarConfig?: ToolbarConfig
  state?: {
    loaded?: boolean
    pageWidth?: 'X-Small' | 'Small' | 'Medium' | 'Large' | 'X-Large' | 'Max'
    fontSize?: number
    lastSavedAt?: number
    lineSpacing?: number
    saveImgLocally?: boolean
    showSyncBlockShadow?: boolean
    aiChat?: ISubChat
    exam?: number
  } & ILabelContainerProps &
    ISidebarDefaultProps
  labelType?: string
  labelIds?: number[]
  toolbar?: {
    config?: ToolbarConfig
    fontSize?: boolean
    color?: boolean
    highlight?: boolean
    extra?: boolean
  }
  toolbarConfig?: ToolbarConfig
  classNames?: {
    editorContainerClassName?: string
  }
  toolbarConfig?: ToolbarConfig
  plugins?: {
    blockHandle?: boolean
    dragBlock?: boolean
    dropElement?: boolean
    select?: boolean
    labelPopover?: boolean
    addUnderLastLine?: boolean
  }
  toolbarConfig?: ToolbarConfig
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
