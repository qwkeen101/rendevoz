import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual'
import { CSSProperties, forwardRef, memo, ReactElement, useEffect, useImperativeHandle, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { useUpdateEffect } from '@/hooks'

type Props<T> = {
  items: T[]
  renderItem: (item: T, idx: number, selected?: boolean) => ReactElement
  estimateSize: number
  style?: CSSProperties
  overscan?: number
  childrenContainerClassname?: string
  withKeyboardNavigation?: boolean
  onEnter?: (item: T, idex: number) => void
  onKeydown?: (e: KeyboardEvent) => void
}

type VirtualListRef = Virtualizer<Element, Element> & {
  setFocus: (index: number) => void
}
function VirtualList<T>(
  { items, renderItem, overscan, onEnter, estimateSize, style, childrenContainerClassname, withKeyboardNavigation }: Props<T>,
  ref: VirtualListRef
) {
  const contentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize,
    getScrollElement: () => contentRef.current,
    overscan
  })
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0)
  useImperativeHandle(ref, () => ({
    ...virtualizer,
    setFocus: i => setCurrentFocusIndex(i)
  }))
  const itemzRef = useRef(items)
  itemzRef.current = items
  const itemz = virtualizer.getVirtualItems()
  const length = items.length
  useEffect(() => {
    if (withKeyboardNavigation) {
      const keyboardEvent = (e: KeyboardEvent) => {
        if (isHotkey(KEY.Enter, e) && withKeyboardNavigation) {
          e.stopPropagation()
          e.preventDefault()
          onEnter?.(itemzRef.current[currentFocusIndex], currentFocusIndex)
        }
        if (isHotkey(KEY.ArrowUp, e)) {
          e.stopPropagation()
          e.preventDefault()
          setCurrentFocusIndex(i => {
            const next = i - 1
            if (next < 0) {
              virtualizer.scrollToIndex(length - 1)
              return length - 1
            } else {
              return next
            }
          })
        }
        if (isHotkey(KEY.ArrowDown, e)) {
          e.preventDefault()
          e.stopPropagation()
          setCurrentFocusIndex(i => {
            const next = i + 1
            if (next > length - 1) {
              virtualizer.scrollToIndex(0)
              return 0
            } else {
              return next
            }
          })
        }
      }
      document.addEventListener('keydown', keyboardEvent, true)
      return () => {
        document.removeEventListener('keydown', keyboardEvent, true)
      }
    }
  }, [withKeyboardNavigation, length, currentFocusIndex])
  useUpdateEffect(() => {
    virtualizer.scrollToIndex(currentFocusIndex)
  }, [currentFocusIndex])

  return (
    <div
      ref={contentRef}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        ...style
      }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative'
        }}
        className={childrenContainerClassname}
      >
        {itemz.map(i => (
          <div
            key={i.key}
            data-index={i.index}
            ref={virtualizer.measureElement}
            onPointerEnter={() => {
              if (withKeyboardNavigation) {
                setCurrentFocusIndex(i.index)
              }
            }}
            tabIndex={0}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${i.start}px)`
            }}
          >
            {renderItem(items[i.index], i.index, currentFocusIndex === i.index)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(forwardRef(VirtualList))
