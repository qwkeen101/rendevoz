import { useMemoizedFn, useMergedRef, useUpdateEffect } from '@/hooks'
import classNames from 'classnames'
import {
  FC,
  memo,
  useRef,
  useState,
  CSSProperties,
  useEffect,
  cloneElement,
  MouseEvent,
  useCallback,
  RefObject,
  useLayoutEffect
} from 'react'
import { ReactEditor, RenderElementProps, useSlate, useSlateStatic } from '../../slate-react'
import { CustomElement } from '../../types/index'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './index.module.less'
import { scrollToTarget } from '../../utils/positions/scroll'
import { SELECT_AREA_MAP, ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from '../../weakMaps'
import { getDistanceBetweenPointAndElement } from '@/components/dragReposition/utils/position'
import useIsSelecting from '../../hooks/useIsSelecting'
import { getDistanceBetweenElementAndScrollableElement } from '@/components/editor/utils/scroll'
import { isRectsCollision } from '../../utils/positions/collision'
import { css } from '@emotion/css'
import { hexToRgb } from '@/utils/color'
import { useGlobalIsDragging } from '@/components/GlobalDragOverlay'
import { Transforms } from 'slate'

type BlockProps = {
  blockId: number
  type: string
  ratio?: number
  onMouseEnter?: (e: MouseEvent, element: CustomElement) => void
  onMouseLeave?: (e: MouseEvent, element: CustomElement) => void
  onMouseMove?: (e: MouseEvent, element: CustomElement) => void
  onNestedListItem?: (isNested: boolean) => void
  element?: CustomElement
  scrollElementRef?: RefObject<HTMLElement>
}
const CardBlocks = ['pdf', 'book-highlight', 'note']
const Block: FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & BlockProps & RenderElementProps> = memo(
  ({
    scrollElementRef,
    blockId,
    children,
    ratio,
    type,
    attributes,
    element,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onNestedListItem,
    ...rest
  }) => {
    const blockRef = useRef<HTMLDivElement>(null)
    const columnRef = useRef<HTMLDivElement>(null)
    const editor = useSlateStatic()
    const idx = editor.children.findIndex(i => i === element)
    const map = ID_TO_ELEMENTS_MAP.get(editor)
    const mergedChildrenRef = useMergedRef(blockRef, attributes.ref)
    const [direction, setDirection] = useState<string>()
    const [selected, setSelected] = useState(false)
    const [withLine, setWithLine] = useState<{ width: number } | null>(null)
    const [isSelecting] = useIsSelecting()
    const [isGlobalDragging] = useGlobalIsDragging()
    const distanceToScrollElementRef = useRef<{ left: number; top: number; right: number; bottom: number }>()

    const handleCollisionSelectBlock = useMemoizedFn(() => {
      const selectArea = SELECT_AREA_MAP.get(editor)
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
    useEffect(() => {
      document.addEventListener('click', handleGlobalClick)
      return () => {
        document.removeEventListener('click', handleGlobalClick)
      }
    }, [])

    useLayoutEffect(() => {
      if (isSelecting) {
        const block = blockRef.current
        if (block && scrollElementRef?.current) {
          distanceToScrollElementRef.current = getDistanceBetweenElementAndScrollableElement(block, scrollElementRef.current)
          console.log(distanceToScrollElementRef.current)
        }
      }
    })
    useUpdateEffect(() => {
      if (selected) {
        const selectedBlocksMap = SELECTED_BLOCKS_MAP.get(editor)
        selectedBlocksMap?.set(blockId, blockRef.current)
        return () => {
          selectedBlocksMap?.delete(blockId)
        }
      }
    }, [selected])

    const handleIndicatorChange = useMemoizedFn((direction: string | null, e?: MouseEvent) => {
      if (selected) {
        return false
      }

      if (direction === 'bottom' && (element?.type === 'list-item' || element?.level)) {
        if (e) {
          const distanceToBlock = getDistanceBetweenPointAndElement(e, blockRef.current)
          if (distanceToBlock.left > 0 && distanceToBlock.left < 20) {
            setWithLine(null)
            onNestedListItem?.(false)
          }
          if (distanceToBlock.left > 20 && distanceToBlock.right > 0) {
            setWithLine({ width: 20 })
            onNestedListItem?.(true)
          }
        }
      }
      if (direction !== null && direction !== undefined) {
        setDirection(direction)
      } else {
        setWithLine(null)
        setDirection(undefined)
      }
      return true
    })
    const handleSelectBlock = useMemoizedFn(() => {
      setSelected(true)
      if (scrollElementRef?.current) {
        scrollToTarget(blockRef.current, scrollElementRef.current)
      }
    })
    const indicatorStyle: CSSProperties = {
      position: 'absolute',
      left: direction === 'left' ? -4 : direction === 'top' || direction === 'bottom' ? 0 : undefined,
      top: direction === 'top' ? -4 : direction === 'left' || direction === 'right' ? 0 : undefined,
      bottom: direction === 'bottom' ? -4 : direction === 'left' || direction === 'right' ? 0 : undefined,
      right: direction === 'right' ? -4 : direction === 'top' || direction === 'bottom' ? 0 : undefined,
      width: direction === 'right' || direction === 'left' ? 4 : undefined,
      height: direction === 'top' || direction === 'bottom' ? 4 : undefined,
      backgroundColor: '#8590ae',
      borderRadius: '3px',
      opacity: 0.8
    }
    if (withLine) {
      indicatorStyle.left = withLine.width + 2
    }
    const withLineStyle: CSSProperties = {
      position: 'absolute',
      left: 0,
      height: 4,
      bottom: -4,
      width: withLine?.width - 1,
      borderRadius: '3px',
      backgroundColor: '#8590ae',
      opacity: 0.4,
      zIndex: 2
    }
    useEffect(() => {
      map?.set(blockId, {
        selectBlock: handleSelectBlock,
        collisionSelectBlock: handleCollisionSelectBlock,
        changeIndicator: handleIndicatorChange,
        getElement: () => element,
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
    const handleMouseMove = useCallback(e => onMouseMove?.(e, element), [onMouseMove, element])
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
        onMouseMove={handleMouseMove}
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
          ...rest.style
        }}
        className={classNames(
          styles.BlockCommon,
          type === 'columnList' && styles.ColumnListBlock,
          type === 'column' && styles.ColumnBlock,
          type.startsWith('heading') && styles.HeadingBlock,
          cardType === 'slim' && styles.SlimCardBlock,
          cardType === 'line' && styles.LineCardBlock,
          (cardType === 'wide' || (CardBlocks.includes(type) && cardType === undefined)) && styles.WideCardBlock,
          type !== 'column' && type !== 'columnList' && !type.startsWith('heading') && styles.ParagraphBlock,
          isGlobalDragging &&
            css({
              pointerEvents: 'none'
            })
        )}
        {...rest}
      >
        {children}
        <AnimatePresence>
          {direction && (
            <motion.div
              transition={{ duration: 0.15 }}
              key={direction}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {withLine && <div style={withLineStyle}></div>}
              <div style={indicatorStyle} />
            </motion.div>
          )}
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
