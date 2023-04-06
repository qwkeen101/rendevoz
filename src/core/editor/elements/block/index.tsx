import { useMemoizedFn, useMergedRef, useUpdateEffect } from '@/hooks'
import classNames from 'classnames'
import { FC, memo, useRef, useState, useEffect, cloneElement, MouseEvent, useCallback, RefObject, useLayoutEffect } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { CustomElement } from '~/typings'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './index.module.less'
import './index.less'
import { scrollToTarget } from '../../utils/positions/scroll'
import { SELECT_AREA_MAP, ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from '../../weakMaps'
import useIsSelecting from '../../hooks/useIsSelecting'
import { getDistanceBetweenElementAndScrollableElement } from '@/core/editor/utils/scroll'
import { isRectsCollision } from '../../utils/positions/collision'
import { css } from '@emotion/css'
import { hexToRgb } from '@/utils/color'
import { useGlobalIsDragging } from '@/core'
import { Range, Transforms } from 'slate'
import { NODE_TO_PARENT } from '../../slate-react/utils/weak-maps'

type BlockProps = {
  blockId: number
  type?: string
  ratio?: number
  onMouseEnter?: (e: MouseEvent, element: CustomElement) => void
  onMouseLeave?: (e: MouseEvent, element: CustomElement) => void
  onMouseMove?: (e: MouseEvent, element: CustomElement) => void
  element?: CustomElement
  scrollElementRef?: RefObject<HTMLElement>
}

const CardBlocks = ['pdf', 'book-highlight', 'note']

const Block: FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & BlockProps & RenderElementProps> = memo(
  ({ scrollElementRef, blockId, children, ratio, type, attributes, element, onMouseEnter, onMouseLeave, onMouseMove, ...rest }) => {
    const blockRef = useRef<HTMLDivElement>(null)
    const columnRef = useRef<HTMLDivElement>(null)
    const editor = useSlateStatic()
    const idx = editor.children.findIndex(i => i === element)
    const map = ID_TO_ELEMENTS_MAP.get(editor)
    const mergedChildrenRef = useMergedRef(blockRef, attributes.ref)
    const [selected, setSelected] = useState(false)
    const [isSelecting] = useIsSelecting()
    const [isGlobalDragging] = useGlobalIsDragging()
    const distanceToScrollElementRef = useRef<{ left: number; top: number; right: number; bottom: number }>()

    const handleCollisionSelectBlock = useMemoizedFn(() => {
      const selectArea = SELECT_AREA_MAP.get(editor)
      if (!selectArea || !distanceToScrollElementRef.current) return
      if (isRectsCollision(selectArea, distanceToScrollElementRef.current)) {
        setSelected(true)
      } else {
        setSelected(false)
      }
    })

    const handleGlobalClick = useMemoizedFn(e => {
      if (!isSelecting && selected) {
        if (!blockRef.current?.contains(e.target)) {
          setSelected(false)
        }
      }
    })

    useLayoutEffect(() => {
      document.addEventListener('click', handleGlobalClick)
      const selectedBlocksMap = SELECTED_BLOCKS_MAP.get(editor)
      if (selectedBlocksMap?.has(blockId)) {
        setSelected(true)
      }
      return () => {
        document.removeEventListener('click', handleGlobalClick)
        if (editor.selection && Range.includes(editor.selection, ReactEditor.findPath(editor, element))) {
          ReactEditor.deselect(editor)
          // ReactEditor.blur(editor)
        }
      }
    }, [])

    useLayoutEffect(() => {
      if (isSelecting) {
        const block = blockRef.current
        if (block && scrollElementRef?.current) {
          distanceToScrollElementRef.current = getDistanceBetweenElementAndScrollableElement(block, scrollElementRef.current)
        }
      }
    })

    useUpdateEffect(() => {
      const selectedBlocksMap = SELECTED_BLOCKS_MAP.get(editor)
      if (selected) {
        selectedBlocksMap?.set(blockId, blockRef.current)
      } else {
        selectedBlocksMap?.delete(blockId)
      }
    }, [selected])

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

    const selectBlock = useMemoizedFn(() => {
      setSelected(true)
      if (scrollElementRef?.current) {
        scrollToTarget(blockRef.current, scrollElementRef.current)
      }
    })

    useEffect(() => {
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
    useEffect(() => {
      const width = `calc(( 100% - ${
        46 * ((columnRef.current?.parentElement?.querySelectorAll("[data-type='column']").length || 2) - 1)
      }px ) * ${ratio?.toFixed(3)})`
      if (columnRef.current) {
        columnRef.current.style.width = width
      }
    }, [ratio])
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
    const renderChildren = () => (
      <div
        key={blockId}
        {...attributes}
        ref={mergedChildrenRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMoveCapture={handleMouseMove}
        suppressContentEditableWarning
        data-level={element?.level}
        data-index={idx}
        style={{
          textAlign: align,
          '--block-linear-font': linearFont ? color : undefined,
          '--text-fill': linearFont ? 'transparent' : undefined,
          '--block-rgb-bg': !linearBg && rgbaBg ? `${rgbaBg.r},${rgbaBg.g},${rgbaBg.b}` : undefined,
          '--block-linear-bg': linearBg ? background : undefined,
          '--block-font-color': linearFont ? undefined : color,
          color: 'var(--block-font-color)',
          margin: type === 'table' ? '10px -10px' : undefined,
          padding: type === 'table' ? '0px 12px 10px' : undefined,
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
          {selected && (
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
              flexGrow: 0,
              flexShrink: 0
            }
          },
          renderChildren()
        )
      : renderChildren()
  }
)

export default Block
