import { useMergedRef, useSelectAtomValue } from '@/hooks'
import classNames from 'classnames'
import React, { cloneElement, FC, memo, MouseEvent, RefObject, useCallback, useLayoutEffect, useRef } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { CustomElement } from '~/typings'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './index.module.less'
import './index.less'
import { ID_TO_ELEMENTS_MAP } from '../../weakMaps'
import { useGlobalIsDragging } from '@/core'
import { Editor, Range, Transforms } from 'slate'
import useBlockContentSearch from '@/core/components/editor/elements/block/useBlockContentSearch'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import useBlockSelect from '@/core/components/editor/elements/block/useBlockSelect'
import { useEditorComposing } from '@/core/components/editor/slate-react/components/editable'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import { Colors } from '@/consts'
import useBlockOverflow from '@/core/components/editor/elements/block/useBlockOverflow'
import useBlockWidth from '@/core/components/editor/elements/block/useBlockWidth'
import BlockSelectionRenderer from '@/core/components/editor/elements/block/BlockSelectionRenderer'
import { useUnmount } from 'react-use'
import useBlockSelectable from '@/core/components/editor/elements/block/useBlockSelectable'
import useBlockPadding from '@/core/components/editor/elements/block/useBlockPadding'
import EditorSettings from '@/core/components/editor/consts/settings'

type BlockProps = {
  blockId: number
  type?: string
  ratio?: number
  element?: CustomElement
  scrollElementRef: RefObject<HTMLElement>
}

const Block: FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & BlockProps & RenderElementProps> = memo(
  ({ scrollElementRef, blockId, children, ratio, type, attributes, element, ...rest }) => {
    const blockRef = useRef<HTMLDivElement>(null)
    const columnRef = useRef<HTMLDivElement>(null)
    const editor = useSlateStatic()
    const mergedChildrenRef = useMergedRef(blockRef, attributes.ref)
    const [isGlobalDragging] = useGlobalIsDragging()
    const instance = useEditorInstance()
    const path = ReactEditor.findPath(editor, element)
    const alwaysShowPlaceholder = useSelectAtomValue(EditorStateAtom, s => s.layout?.alwaysShowPlaceholder)
    useBlockContentSearch(element, instance)
    const blockWidth = useBlockWidth(element, editor)
    const blockOverflow = useBlockOverflow(element)
    const isComposing = useEditorComposing()
    const { handleCollisionSelectBlock, selectBlock, isSelected } = useBlockSelect({
      element,
      instance,
      blockRef,
      scrollElementRef
    })

    useLayoutEffect(() => {
      return () => {
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
      }
    }, [])

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

    useLayoutEffect(() => {
      if (element.type === 'column') {
        const width = `calc(( 100% - ${
          46 * ((columnRef.current?.parentElement?.querySelectorAll("[data-type='column']").length || 2) - 1)
        }px ) * ${ratio?.toFixed(3)})`
        if (columnRef.current) {
          columnRef.current.style.width = width
        }
      }
    }, [ratio])

    useLayoutEffect(() => {
      instance.blockOps?.setBlockFuncs(blockId, {
        selectBlock,
        collisionSelectBlock: handleCollisionSelectBlock,
        getElement: () => element,
        getIndicatorPosition,
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
    })
    const { background, color, align, cardType } = element
    const nestedBlocks = ['table']
    let isBlockEmpty = instance.blockOps?.isBlockEmpty(element)

    if (isComposing) {
      if (blockRef.current?.hasAttribute('data-selected')) {
        isBlockEmpty = false
      }
    }
    const isSelectable = useBlockSelectable(element)
    const scrollPadding = useBlockPadding(element, editor)
    const renderChildren = () => (
      // @ts-ignore
      <div
        key={blockId}
        {...attributes}
        ref={mergedChildrenRef}
        data-empty={isBlockEmpty}
        data-show-placeholder={
          alwaysShowPlaceholder &&
          path.length === 1 &&
          path[0] === 0 &&
          (editor.selection ? Range.isCollapsed(editor.selection) && Range.includes(editor.selection, path) : true)
        }
        suppressContentEditableWarning
        data-level={element?.level}
        contentEditable={Editor.isVoid(editor, element) ? 'false' : undefined}
        style={{
          ...rest.style,
          textAlign: align,
          '--block-bg': EditorSettings.NoBackgroundTypes.has(element.type) ? undefined : Colors.getAdaptColor(background),
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
          type === 'columnList' && styles.ColumnListBlock,
          type === 'column' && styles.ColumnBlock,
          type?.startsWith('heading') && styles.HeadingBlock,
          type !== 'column' && type !== 'columnList' && !type?.startsWith('heading') && 'ParagraphBlock',
          isSelectable && 'selectable'
        )}
        {...rest}
      >
        {children}
        <BlockSelectionRenderer element={element} blockRef={blockRef} selected={isSelected} />
      </div>
    )

    return type === 'column'
      ? cloneElement(
          <div></div>,
          {
            ref: columnRef,
            style: {
              paddingTop: 12,
              paddingBottom: 12,
              flexGrow: 1,
              flexShrink: 0,
              overflow: 'visible'
            },
            role: 'column'
          },
          renderChildren()
        )
      : renderChildren()
  }
)

export default Block
