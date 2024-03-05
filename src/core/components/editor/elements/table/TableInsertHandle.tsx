import { CSSProperties, memo, useEffect, useState } from 'react'
import { useIsIn, useSelectAtomValue } from '@/hooks'
import { TableStateAtom } from '@/core/components/editor/elements/table/Table'
import { TableElement } from '~/typings'
import { Colors } from '@/consts'
import { Icon } from '@/components'
export default memo(
  ({
    direction,
    tableElement,
    onInsert,
    onDrag,
    onDragStart,
    onDragEnd
  }: {
    direction: 'row' | 'column' | 'both'
    tableElement: TableElement
    onInsert?: VoidFunction
    onDrag?: (e: PointerEvent) => void
    onDragEnd?: VoidFunction
    onDragStart?: VoidFunction
  }) => {
    const { ref, isIn } = useIsIn()
    const [visible, setVisible] = useState(false)
    const hoverPath = useSelectAtomValue(TableStateAtom, s => s.hoveredCellPath)
    const [isReordering, setIsReordering] = useState(false)
    useEffect(() => {
      let rowV = false,
        columnV = false
      if (hoverPath && tableElement.children.length) {
        if (hoverPath[hoverPath.length - 1] === tableElement.children[0].children.length - 1) {
          columnV = true
        }
        if (hoverPath[hoverPath.length - 2] === tableElement.children.length - 1) {
          rowV = true
        }
      }
      if (direction === 'column' && columnV) {
        setVisible(true)
        return
      }
      if (direction === 'row' && rowV) {
        setVisible(true)
        return
      }
      if (direction === 'both' && rowV && columnV) {
        setVisible(true)
        return
      }
      setVisible(false)
    }, [hoverPath, tableElement])
    useEffect(() => {
      if (isReordering) {
        const pointerHandler = (e: PointerEvent) => {
          if (e.type === 'pointerup') {
            onDragEnd?.()
            setIsReordering(false)
          }
          if (e.type === 'pointermove') {
            onDrag?.(e)
          }
        }
        document.addEventListener('pointermove', pointerHandler)
        document.addEventListener('pointerup', pointerHandler)
        return () => {
          document.removeEventListener('pointermove', pointerHandler)
          document.removeEventListener('pointerup', pointerHandler)
        }
      }
    }, [isReordering])
    const style: CSSProperties = {
      position: 'absolute',
      opacity: visible || isIn || isReordering ? 1 : 0,
      transition: 'opacity 0.25s ease',
      background: Colors.Background.ButtonHover,
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: Colors.Font.SuperTransparent,
      cursor: direction === 'row' ? 'row-resize' : direction === 'column' ? 'col-resize' : 'pointer'
    }
    if (direction === 'both') {
      style.bottom = -18
      style.right = -18
      style.width = 16
      style.height = 16
    }
    if (direction === 'column') {
      style.right = -18
      style.top = 0
      style.bottom = 0
      style.width = 16
      style.height = '100%'
    }
    if (direction === 'row') {
      style.bottom = -18
      style.left = 0
      style.right = 0
      style.width = '100%'
      style.height = 16
    }
    return (
      <div
        drag={direction === 'column' ? 'x' : direction === 'row' ? 'y' : true}
        style={style}
        ref={ref}
        onClick={onInsert}
        onPointerDown={() => {
          setIsReordering(true)
          onDragStart?.()
        }}
      >
        <Icon name={'park-plus'} size={14} />
      </div>
    )
  },
  (prev, curr) =>
    prev.direction === curr.direction &&
    prev.tableElement.children.length === curr.tableElement.children.length &&
    prev.tableElement.columns.length === curr.tableElement.columns.length
)
