import { useMemoizedFn, useMergedRef } from '@/hooks'
import classNames from 'classnames'
import { FC, memo, useRef, useState, CSSProperties, useEffect, cloneElement, MouseEvent } from 'react'
import { RenderElementProps, useSlate } from 'slate-react'
import { CustomElement } from '../../customTypes'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './index.module.less'
import useClickOutside from '@/hooks/utils/useClickOutside'
import { scrollToTarget } from '../../utils/positions/scroll'
import { ID_TO_ELEMENTS_MAP } from '../../weakMaps'
import { getDistanceBetweenPointAndElement } from '@/components/dragReposition/utils/position'
import { Noop } from '@/common/types'

type BlockProps = {
  blockId: number
  type: string
  ratio?: number
  onMouseEnter?: (e: MouseEvent, element: CustomElement) => void
  onNestedListItem?: (isNested: boolean) => void
  element?: CustomElement
  scrollElement?: HTMLDivElement
}
const Block: FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & BlockProps & RenderElementProps> = memo(
  ({ scrollElement, blockId, children, ratio, type, attributes, element, onMouseEnter, onNestedListItem, ...rest }) => {
    const blockRef = useRef<HTMLDivElement>(null)
    const columnRef = useRef<HTMLDivElement>(null)
    const editor = useSlate()
    const map = ID_TO_ELEMENTS_MAP.get(editor)
    const mergedChildrenRef = useMergedRef(blockRef, attributes.ref)
    const [direction, setDirection] = useState<string>()
    const [selected, setSelected] = useState(false)
    const [withLine, setWithLine] = useState<{ width: number } | null>(null)
    useClickOutside(() => {
      setSelected(false)
    }, blockRef)
    const handleIndicatorChange = useMemoizedFn((direction: string | null, e?: MouseEvent) => {
      if (element?.type === 'list-item' || element?.level) {
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
      if (direction !== null) {
        setDirection(direction)
      } else {
        setWithLine(null)
        setDirection(undefined)
      }
    })
    const handleSelectBlock = useMemoizedFn(() => {
      setSelected(true)
      if (scrollElement) {
        scrollToTarget(blockRef.current, scrollElement)
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
      borderRadius: '3px'
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
      backgroundColor: '#8590aea8',
      zIndex: 2
    }
    useEffect(() => {
      map?.set(blockId, {
        selectBlock: handleSelectBlock,
        changeIndicator: handleIndicatorChange
      })
      return () => {
        map?.delete(blockId)
      }
    }, [])
    useEffect(() => {
      const width = `calc(( 100% - ${
        46 * ((columnRef.current?.parentElement?.querySelectorAll("[data-type='column']").length || 2) - 1)
      }px ) * ${ratio?.toFixed(3)})`
      if (columnRef.current) {
        columnRef.current.style.width = width
      }
    }, [ratio])
    const handleMouseEnter = (e: MouseEvent) => {
      onMouseEnter?.(e, element)
    }
    const renderChildren = () => (
      <div
        key={blockId}
        {...attributes}
        ref={mergedChildrenRef}
        onMouseEnter={handleMouseEnter}
        data-level={element?.level}
        {...rest}
        className={classNames(
          selected && styles.Selected,
          type === 'columnList' && styles.ColumnListBlock,
          type === 'column' && styles.ColumnBlock,
          type.startsWith('heading') && styles.HeadingBlock,
          type !== 'column' && type !== 'columnList' && !type.startsWith('heading') && styles.ParagraphBlock
        )}
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
