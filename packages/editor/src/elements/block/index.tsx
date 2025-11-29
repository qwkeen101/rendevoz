import { useMergedRef, usePrevious } from '@/hooks'
import classNames from 'classnames'
import React, { FC, memo, RefObject, useEffect, useLayoutEffect, useRef } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { CustomElement } from '~/typings'
import styles from './index.module.less'
import './index.less'
import { Editor, Path, Range, Transforms } from 'slate'
import useBlockContentSearch from '../elements/block/useBlockContentSearch'
import useEditorInstance from '../hooks/useEditorInstance'
import useBlockSelect from '../elements/block/useBlockSelect'
import { Colors } from '@/consts'
import BlockSelectionRenderer from '../elements/block/BlockSelectionRenderer'
import { useUnmount } from 'react-use'
import EditorSettings from '../consts/settings'
import useBlockDetails from '../elements/block/useBlockDetails'
import ColumnBlock from '../elements/block/ColumnBlock'
import useBlockPlaceholder from '../elements/block/useBlockPlaceholder'
export type BlockProps = {
  type?: string
  ratio?: number
  element?: CustomElement
  alwaysShowPlaceholder?: boolean
  isGlobalDragging?: boolean
  isComposing?: boolean
  isSelecting?: boolean
  firstLinePlaceholder?: string
}

const Block: FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & BlockProps & RenderElementProps> = memo(
  props => {
    if (props.element.type === 'column') return <ColumnBlock {...props} />
    const {
      children,
      type,
      attributes,
      isComposing,
      element,
      isGlobalDragging,
      alwaysShowPlaceholder,
      firstLinePlaceholder,
      isSelecting,
      ...rest
    } = props
    const blockId = element.id
    const blockRef = useRef<HTMLDivElement>(null)
    const editor = useSlateStatic()
    const mergedChildrenRef = useMergedRef(blockRef, attributes.ref)
    const instance = useEditorInstance()
    const path = ReactEditor.findPath(editor, element)
    useBlockContentSearch(element, instance)
    const scrollElementRef = instance.values.scrollElementRef
    const {
      width: blockWidth,
      overflow: blockOverflow,
      padding: scrollPadding,
      selectable: isSelectable,
      isVoid
    } = useBlockDetails(element, editor)
    const { handleCollisionSelectBlock, selectBlock, isSelected, deselectBlock } = useBlockSelect({
      element,
      instance,
      blockRef,
      scrollElementRef,
      isSelecting
    })

    const getIndicatorPosition = (
      direction: 'top' | 'left' | 'bottom' | 'right'
    ):
      | {
          left: number
          top: number
          width: number
          height: number
        }
      | undefined => {
      const block = blockRef.current
      if (!block) return
      const selectable = block.classList.contains('selectable') ? block : block.querySelector('.selectable')
      const blockBound = selectable?.getBoundingClientRect()
      if (blockBound) {
        const { left: bleft, top: btop, width: bwidth, height: bheight } = blockBound
        switch (direction) {
          case 'top':
            return {
              left: bleft,
              top: btop - 4,
              width: bwidth,
              height: 4
            }
          case 'bottom':
            return {
              left: bleft,
              top: btop + bheight,
              height: 4,
              width: bwidth
            }
          case 'left':
            return {
              width: 4,
              height: bheight,
              left: bleft - 4,
              top: btop
            }
          case 'right':
            return {
              width: 4,
              height: bheight,
              left: bleft + bwidth,
              top: btop
            }
        }
      }
    }

    useEffect(() => {
      instance.blockOps?.setBlockFuncs(blockId, {
        selectBlock,
        collisionSelectBlock: handleCollisionSelectBlock,
        getElement: () => element,
        getIndicatorPosition,
        deselectBlock,
        getClientBound: () => blockRef.current?.getBoundingClientRect(),
        removeSelf: () => {
          const path = ReactEditor.findPath(editor, element)
          Transforms.removeNodes(editor, {
            at: path
          })
        },
        getPath: () => ReactEditor.findPath(editor, element)
      })
    })
    useUnmount(() => {
      instance.blockOps?.removeBlockFuncs(blockId)
      try {
        const path = ReactEditor.findPath(editor, element)
        if (editor.selection && Range.includes(editor.selection, path)) {
          const currentPathEle = Editor.node(editor, path)
          // maybe deleted
          if (currentPathEle[0] === element) {
            ReactEditor.deselect(editor)
          }
        }
      } catch (e) {
        console.error(e)
      }
    })
    const { background, color, align } = element

    const placeholder = useBlockPlaceholder({
      element,
      editor,
      path,
      isComposing,
      alwaysShowPlaceholder,
      firstLinePlaceholder,
      blockRef,
      instance
    })
    return (
      // @ts-ignore
      <div
        {...attributes}
        ref={mergedChildrenRef}
        data-level={element?.level}
        contentEditable={isVoid ? 'false' : undefined}
        style={{
          ...rest.style,
          textAlign: align,
          '--block-bg': EditorSettings.NoBackgroundTypes.has(element.type)
            ? undefined
            : background
              ? `rgb(from ${Colors.getAdaptColor(background)} r g b / var(--editor-bg-opacity))`
              : undefined,
          '--block-font-color': color,
          width: blockWidth,
          maxWidth: blockWidth,
          color: 'var(--block-font-color)',
          overflow: blockOverflow,
          pointerEvents: isGlobalDragging ? 'none' : undefined,
          '--editor-scroll-padding': scrollPadding
            ? scrollPadding === 'column-table' || scrollPadding === 'group-in-column'
              ? '8px 18px 18px 8px'
              : '8px max(calc((var(--editor-width) - var(--editor-max-width))/2), var(--editor-padding-left)) 18px'
            : undefined,
          padding:
            scrollPadding && scrollPadding !== 'group-in-column' && scrollPadding !== 'group'
              ? 'var(--editor-scroll-padding)'
              : rest.style?.padding
        }}
        className={classNames(
          'BlockCommon',
          type === 'image' && 'ImageBlock',
          type === 'columnList' && styles.ColumnListBlock,
          type?.startsWith('heading') && 'HeadingBlock',
          type !== 'columnList' && !type?.startsWith('heading') && 'ParagraphBlock',
          isSelectable && 'selectable',
          placeholder && 'ShowPlaceholder',
          firstLinePlaceholder && Path.equals(path, [0]) && 'FirstLinePlaceholder'
        )}
        {...rest}
      >
        {children}
        <BlockSelectionRenderer element={element} blockRef={blockRef} selected={isSelected} />
      </div>
    )
  }
)

export default Block
