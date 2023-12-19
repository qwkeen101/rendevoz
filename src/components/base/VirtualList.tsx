import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual'
import { CSSProperties, forwardRef, memo, ReactElement, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
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
  paddingEnd?: number
  itemClassname?: string
  itemStyle?: CSSProperties
  itemContainerClassname?: string
}

type VirtualListRef = Virtualizer<Element, Element> & {
  setFocus: (index: number) => void
}
function VirtualList<T>(
  {
    items,
    renderItem,
    overscan,
    onEnter,
    itemStyle,
    itemClassname,
    itemContainerClassname,
    estimateSize,
    style,
    childrenContainerClassname,
    withKeyboardNavigation,
    paddingEnd
  }: Props<T>,
  ref: VirtualListRef
) {
  try {
    const contentRef = useRef<HTMLDivElement>(null)
    const virtualizer = useVirtualizer({
      count: items.length,
      estimateSize: useCallback(() => estimateSize, [estimateSize]),
      getScrollElement: () => contentRef.current,
      overscan,
      paddingEnd
    })
    const [currentFocusIndex, setCurrentFocusIndex] = useState(0)
    useImperativeHandle(ref, () => ({
      ...virtualizer,
      setFocus: i => {
        setCurrentFocusIndex(i)
        virtualizer.scrollToIndex(i)
      }
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
                virtualizer.scrollToIndex(next)
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
                virtualizer.scrollToIndex(next)
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
    }, [withKeyboardNavigation, length, currentFocusIndex, onEnter])

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
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${itemz[0]?.start || 0}px)`
            }}
            className={itemContainerClassname}
          >
            {itemz.map(i => (
              <div
                key={i.key}
                data-index={i.index}
                data-selected={currentFocusIndex === i.index}
                ref={virtualizer.measureElement}
                className={itemClassname}
                onPointerEnter={() => {
                  if (withKeyboardNavigation) {
                    setCurrentFocusIndex(i.index)
                  }
                }}
                style={itemStyle}
                tabIndex={0}
              >
                {renderItem(items[i.index], i.index, currentFocusIndex === i.index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  } catch (e) {
    console.error(e)
  }
}

export default memo(forwardRef(VirtualList))
