import { defaultRangeExtractor, useVirtualizer, Virtualizer } from '@tanstack/react-virtual'
import { CSSProperties, forwardRef, memo, ReactElement, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'
import { useUpdateEffect } from '@/hooks'
import { Reorder } from 'framer-motion'
type Props<T> = {
  items: T[]
  renderItem: (item: T, idx: number, selected?: boolean) => ReactElement
  estimateSize: number
  style?: CSSProperties
  overscan?: number
  childrenContainerClassname?: string
  withKeyboardNavigation?: boolean
  onSelect?: (item: T, idex: number) => void
  onKeydown?: (e: KeyboardEvent) => void
  paddingEnd?: number
  itemClassname?: string
  itemStyle?: CSSProperties
  itemContainerClassname?: string
  rangeExtractor?: Virtualizer<any, any>['options']['rangeExtractor']
  reorder?: boolean
  canReorder?: boolean
  onReorder?: (items: T[]) => void
}

type VirtualListRef = Virtualizer<Element, Element> & {
  setFocus: (index: number) => void
}
function VirtualList<T>(
  {
    items = [],
    renderItem,
    overscan,
    onSelect,
    itemStyle,
    itemClassname,
    itemContainerClassname,
    estimateSize,
    style,
    rangeExtractor,
    reorder,
    canReorder = true,
    onKeydown,
    onReorder,
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
      estimateSize: () => estimateSize,
      getScrollElement: () => contentRef.current,
      overscan: reorder ? items.length : overscan,
      paddingEnd,
      rangeExtractor: rangeExtractor || defaultRangeExtractor
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
            if (e.target instanceof HTMLElement && e.target.closest('input,textarea')) return
            e.stopPropagation()
            e.preventDefault()
            onSelect?.(itemzRef.current[currentFocusIndex], currentFocusIndex)
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
    }, [withKeyboardNavigation, length, currentFocusIndex, onSelect])
    const [isReorder, setIsReorder] = useState(false)
    const [innerItems, setInnerItems] = useState(items)
    useEffect(() => {
      setInnerItems(items)
    }, [items])
    const renderChildren = () => {
      if (reorder) {
        return (
          <Reorder.Group
            as={'div'}
            axis={'y'}
            className={childrenContainerClassname}
            onReorder={itemz => {
              if (!canReorder) return
              setInnerItems(itemz)
              setCurrentFocusIndex(itemz.findIndex(i => i === innerItems[currentFocusIndex]))
            }}
            values={innerItems}
            ref={contentRef}
            layoutScroll={true}
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              ...style
            }}
          >
            {innerItems.map((i, idx) => (
              <Reorder.Item
                transition={{
                  duration: isReorder ? undefined : 0
                }}
                onDragStart={() => {
                  setIsReorder(true)
                }}
                onDragEnd={() => {
                  setTimeout(() => {
                    setIsReorder(false)
                  })
                  onReorder?.(innerItems)
                }}
                drag={canReorder ? 'y' : false}
                as={'div'}
                key={i.id || JSON.stringify(i)}
                data-index={idx}
                data-selected={currentFocusIndex === idx}
                ref={virtualizer.measureElement}
                className={itemClassname}
                onPointerEnter={() => {
                  if (withKeyboardNavigation && !isReorder) {
                    setCurrentFocusIndex(idx)
                  }
                }}
                onClick={() => {
                  if (isReorder) return
                  onSelect?.(i, idx)
                }}
                style={itemStyle}
                tabIndex={0}
                value={i}
              >
                {renderItem(i, idx, currentFocusIndex === idx)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )
      }
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
                  onClick={() => {
                    onSelect?.(items[i.index], i.index)
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
    }
    return renderChildren()
  } catch (e) {
    console.error(e)
  }
}

export default memo(forwardRef(VirtualList))
