import React, { CSSProperties, FC, ReactElement, ReactNode, RefObject, SetStateAction } from 'react'
import { MetaObject, IDraggableElement, Size, IEditorInstance, CustomEditor } from '..'
import { TFunction } from 'i18next'
import { EditorProps } from '../../src/core/editor/Editor'

declare const InnerComponents: {
  /**
   * Drag Object Wrapper Element, you can set dragging details here
   */
  DraggableElement: React.ForwardRefExoticComponent<
    {
      children: ReactElement
      draggingDetails?: IDraggableElement
      draggable?: boolean
      onDragStart?: VoidFunction
      hoverElement?: ReactElement
      shouldPress?: number
    } & React.RefAttributes<HTMLElement>
  >
  /**
   * React element to set dock tab title
   */
  TabTitle: React.FC<{ title: string; icon?: ReactNode }>
  EditorPage: FC<
    {
      noteId?: number
      id: string
      disableTitle?: boolean
      defaultReadOnly?: boolean
      onTitleChange?: (t: string) => void
    } & EditorProps
  >
}
declare const TagRenderer: ({
  gap,
  flexWrap,
  containerStyle,
  showCreatedAt,
  showUpdatedAt,
  showViewAt,
  showAttachments,
  containerClassName,
  relatedNum,
  metaObject,
  t
}: {
  gap?: number
  flexWrap?: CSSProperties['flexWrap']
  containerStyle?: CSSProperties
  containerClassName?: string
  showUpdatedAt?: boolean
  showCreatedAt?: boolean
  showViewAt?: boolean
  showAttachments?: boolean
  maxTagsToShow?: number
  relatedNum: number
  metaObject?: MetaObject
  t: TFunction<'translation', undefined, 'translation'>
}) => JSX.Element
declare const _renderTitle: (
  {
    ellipsisLine,
    titleClassName,
    onTitleClick,
    style
  }: {
    titleClassName?: string
    onTitleClick?: React.MouseEventHandler
    style?: CSSProperties
    ellipsisLine?: number
  },
  metaObject?: MetaObject
) => JSX.Element
declare const _renderDescription: (
  {
    ellipsisLine,
    descriptionClassName,
    style
  }: {
    descriptionClassName?: string
    style?: CSSProperties
    ellipsisLine?: number
  },
  metaObject?: MetaObject
) => JSX.Element
declare const _renderImage: (
  { width, height, ratio, borderRadius, style, minWidth }: any,
  metaObject?: MetaObject,
  onSizeChange?: (size: Size) => void
) => JSX.Element
declare const _renderFrom: (
  {
    style,
    className,
    onFromClick
  }: {
    style?: CSSProperties
    className?: string
    onFromClick?: () => void
  },
  metaObject?: MetaObject
) => JSX.Element
declare const _renderOptions: (
  {
    iconName,
    style,
    customNode,
    renderOnParent,
    onClickOutside,
    zIndex
  }: {
    customNode?: ReactNode
    style?: CSSProperties
    iconName?: string
    renderOnParent?: boolean
    zIndex?: number
    onClickOutside?: (e: MouseEvent, setVisible: React.Dispatch<React.SetStateAction<boolean>>) => void
  },
  metaObject?: MetaObject
) => JSX.Element
declare const useRenderObject: (options: { metaObjectId: number }) => {
  renderTitle: (options: Parameters<typeof _renderTitle>[0]) => JSX.Element
  renderTags: (options: Parameters<typeof TagRenderer>[0]) => JSX.Element
  renderDescription: (options: Parameters<typeof _renderDescription>[0]) => JSX.Element | undefined
  renderWhole: (options?: Parameters<typeof WholeRenderer>[0]['options']) => JSX.Element
  metaObject: MetaObject | undefined
  renderFrom: (options: Parameters<typeof _renderFrom>[0]) => JSX.Element
  renderInline: ({
    containerStyle,
    ellipsisLine,
    showCircle,
    showUnderline,
    showHoverObjectDetails,
    renderAttOnParent,
    renderObjectDetailsOnParent
  }?: {
    containerStyle?: CSSProperties
    ellipsisLine?: number
    showCircle?: boolean
    showUnderline?: boolean
    showHoverObjectDetails?: boolean
    renderAttOnParent?: boolean
    renderObjectDetailsOnParent?: boolean
  }) => JSX.Element
  renderOptions: (options: Parameters<typeof _renderOptions>[0]) => JSX.Element | undefined
}
declare const WholeRenderer: import('react').MemoExoticComponent<
  ({
    options,
    metaObject,
    relatedNum
  }: {
    options: {
      columnGap?: number
      rowGap?: number
      containerClassName?: string
      containerStyle?: CSSProperties
      containerOnClick?: React.MouseEventHandler
      mainContainerStyle?: CSSProperties
      tagsOptions?: Parameters<typeof TagRenderer>[0]
      titleOptions?: Parameters<typeof _renderTitle>[0]
      imageOptions?: Parameters<typeof _renderImage>[0]
      fromOptions?: Parameters<typeof _renderFrom>[0]
      optionOptions?: Parameters<typeof _renderOptions>[0]
      descriptionOptions?: Parameters<typeof _renderDescription>[0]
      renderOptions: {
        renderImage?: boolean
        renderTitle?: boolean
        renderTags?: boolean
        renderDescription?: boolean
        renderFrom?: boolean
        renderOption?: boolean
        imageMode?: 'thumbnail' | 'whole'
      }
    }
    metaObject?: MetaObject
    relatedNum?: number
  }) => JSX.Element
>

declare const InnerHooks: {
  useRenderLabel: (opts: {
    objectId: number
    type: 'videoLabel' | 'pdfLabel' | 'noteLabel' | 'webpageLabel'
    draggable?: boolean
    onDragStart?: VoidFunction
  }) => {
    renderName: ({ onNameClick }: { onNameClick?: (name?: string) => void }) => JSX.Element
    renderPopover: ({ on }: { on?: (e: LabelActionEvent) => void }) => JSX.Element
    renderAttachment: ({
      style,
      renderAttOnParent,
      renderObjectDetailsOnParent
    }: {
      style?: CSSProperties
      renderObjectDetailsOnParent?: boolean
      renderAttOnParent?: boolean
    }) => JSX.Element | null
    renderDescription: ({ style }: { style?: CSSProperties }) => JSX.Element | null
    labelMeta: MetaObject | undefined
    label: any
    setDraggingDetails: React.Dispatch<SetStateAction<IDraggableElement>>
  }
  useRenderObject: typeof useRenderObject
  useEditorInstance: () => IEditorInstance
  useDropObjectArea: (
    dropArea: RefObject<HTMLElement> | HTMLElement,
    callback?: {
      onDragLeave?: () => void
      onDragOver?: (element: IDraggableElement) => void
      onDrop?: (element: IDraggableElement) => void
    }
  ) => void
  useSlate: () => CustomEditor
  useSlateStatic: () => CustomEditor
}
