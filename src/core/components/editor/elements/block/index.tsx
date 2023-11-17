import { useMergedRef } from '@/hooks'
import classNames from 'classnames'
import React, { cloneElement, FC, memo, MouseEvent, RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { CustomElement } from '~/typings'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './index.module.less'
import './index.less'
import { ID_TO_ELEMENTS_MAP } from '../../weakMaps'
import { css } from '@emotion/css'
import { hexToRgb } from '@/utils/color'
import { useGlobalIsDragging } from '@/core'
import { Editor, Range, Transforms } from 'slate'
import { NODE_TO_PARENT } from '../../slate-react/utils/weak-maps'
import useBlockContentSearch from '@/core/components/editor/elements/block/useBlockContentSearch'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import useBlockSelect from '@/core/components/editor/elements/block/useBlockSelect'

type BlockProps = {
  blockId: number
  type?: string
  ratio?: number
  onMouseEnter?: (e: MouseEvent, element: CustomElement) => void
  onMouseLeave?: (e: MouseEvent, element: CustomElement) => void
  onMouseMove?: (e: MouseEvent, element: CustomElement) => void
  element?: CustomElement
  scrollElementRef: RefObject<HTMLElement>
}

const CardBlocks = ['pdf', 'book-highlight', 'note']
const disableOverflowTypes = ['list-item', 'order-list-item', 'table', 'synced', 'column', 'columnList']
const Block: FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & BlockProps & RenderElementProps> = memo(
  ({ scrollElementRef, blockId, children, ratio, type, attributes, element, onMouseEnter, onMouseLeave, onMouseMove, ...rest }) => {
    const blockRef = useRef<HTMLDivElement>(null)
    const columnRef = useRef<HTMLDivElement>(null)
    const editor = useSlateStatic()
    const map = ID_TO_ELEMENTS_MAP.get(editor)
    const mergedChildrenRef = useMergedRef(blockRef, attributes.ref)
    const [isGlobalDragging] = useGlobalIsDragging()

    const instance = useEditorInstance()
    useBlockContentSearch(element, instance)
    const { isSelected, handleCollisionSelectBlock, selectBlock } = useBlockSelect({
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
      const blockBound = blockRef.current?.getBoundingClientRect()
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
      map?.set(blockId, {
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
      return () => {
        map?.delete(blockId)
      }
    })

    const handleMouseEnter = useCallback(e => onMouseEnter?.(e, element), [onMouseEnter, element])
    const handleMouseLeave = useCallback(e => onMouseLeave?.(e, element), [onMouseLeave, element])
    const handleMouseMove = useCallback(
      e => {
        if (NODE_TO_PARENT.get(element)?.type === 'tableCell') {
          e.stopPropagation()
        }
        onMouseMove?.(e, element)
      },
      [onMouseMove, element]
    )

    const { background, color, align, cardType } = element
    const linearBg = background && (background as string).startsWith('linear-gradient')
    const rgbaBg = background && hexToRgb(background)
    const linearFont = color && (color as string).startsWith('linear-gradient')
    const nestedBlocks = ['table']
    const renderChildren = () => (
      <div
        key={blockId}
        {...attributes}
        ref={mergedChildrenRef}
        onPointerEnter={handleMouseEnter}
        onPointerLeave={handleMouseLeave}
        onPointerMove={handleMouseMove}
        suppressContentEditableWarning
        data-level={element?.level}
        style={{
          textAlign: align,
          '--block-linear-font': linearFont ? color : undefined,
          '--text-fill': linearFont ? 'transparent' : undefined,
          '--block-rgb-bg': !linearBg && rgbaBg && !nestedBlocks.includes(type) ? `${rgbaBg.r},${rgbaBg.g},${rgbaBg.b}` : undefined,
          '--block-linear-bg': linearBg ? background : undefined,
          '--block-font-color': linearFont ? undefined : color,
          color: 'var(--block-font-color)',
          background: nestedBlocks.includes(type) && rgbaBg ? `rgba(${rgbaBg.r},${rgbaBg.g},${rgbaBg.b},0.6)` : undefined,
          overflow: disableOverflowTypes.includes(type) ? 'visible' : 'hidden',
          ...rest.style
        }}
        className={classNames(
          'BlockCommon',
          type === 'columnList' && styles.ColumnListBlock,
          type === 'column' && styles.ColumnBlock,
          type?.startsWith('heading') && styles.HeadingBlock,
          type === 'block-quote' && styles.BlockquoteBlock,
          cardType === 'slim' && styles.SlimCardBlock,
          cardType === 'line' && styles.LineCardBlock,
          (cardType === 'wide' || (CardBlocks.includes(type) && cardType === undefined)) && styles.WideCardBlock,
          type !== 'column' && type !== 'columnList' && !type?.startsWith('heading') && 'ParagraphBlock',
          isGlobalDragging &&
            css({
              pointerEvents: 'auto'
            })
        )}
        {...rest}
      >
        {children}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              transition={{ duration: 0.2 }}
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.Selected}
            ></motion.div>
          )}
        </AnimatePresence>
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
