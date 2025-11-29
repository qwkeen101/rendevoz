import { ReactElement, RefObject, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Icon, useElementScrollRestore, useVirtualizer, VirtualItem } from '@/components'
import InfiniteScroll from 'react-infinite-scroller'
import { useLatest } from 'react-use'
import { Icons } from '@/consts'

const LoaderRectCache: Record<string, VirtualItem[]> = {}
export default forwardRef(
  (
    {
      count,
      onLoadMore,
      scrollElementRef,
      scrollKey,
      overscan,
      size,
      renderItem,
      itemClassName,
      className,
      hasMore = false,
      paddingEnd
    }: {
      count: number
      onLoadMore?: VoidFunction
      scrollKey?: string
      scrollElementRef: RefObject<HTMLDivElement>
      itemClassName?: string
      paddingEnd?: number
      className?: string
      overscan?: number
      size?: number
      hasMore?: boolean
      renderItem: (idx: number) => ReactElement | null
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const container = containerRef.current
    const scroller = scrollElementRef.current
    const offset =
      scrollKey &&
      useElementScrollRestore({
        elementRef: scrollElementRef,
        elementKey: scrollKey
      })

    const margin =
      container && scroller ? container.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop : 0
    const { getVirtualItems, getTotalSize, measureElement, measurementsCache, ...rest } = useVirtualizer({
      count: count,
      overscan: overscan,
      getScrollElement: () => scrollElementRef.current,
      estimateSize: () => size ?? 200,
      scrollMargin: margin,
      paddingEnd,
      initialOffset: offset,
      initialMeasurementsCache: LoaderRectCache[scrollKey]
    })
    const virtualItems = getVirtualItems()
    const latestMeasurement = useLatest(measurementsCache)
    useImperativeHandle(ref, () => ({ ...rest }))
    useEffect(() => {
      if (count === 0) {
        onLoadMore?.()
      }
      return () => {
        if (scrollKey) {
          LoaderRectCache[scrollKey] = latestMeasurement.current
        }
      }
    }, [])
    const renderInner = () => (
      <div
        style={{
          height: getTotalSize()
        }}
        ref={containerRef}
        className={'@container w-full relative'}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${(virtualItems[0]?.start || 0) - margin}px)`
          }}
          className={`flex flex-col`}
        >
          {virtualItems.map(item => {
            const i = renderItem(item.index)
            if (i) {
              return (
                <div ref={measureElement} className={itemClassName} data-index={item.index} key={item.key}>
                  {i}
                </div>
              )
            }
          })}
        </div>
      </div>
    )
    if (!onLoadMore) return <div className={className}>{renderInner()}</div>
    return (
      <InfiniteScroll
        getScrollParent={() => scrollElementRef.current}
        pageStart={0}
        loadMore={() => {
          if (!hasMore) return
          onLoadMore?.()
        }}
        initialLoad={false}
        hasMore={hasMore}
        useWindow={false}
        className={className}
        loader={
          <div className={'w-full flex justify-center py-10'}>
            <Icon size={40} spin name={Icons.Loading} />
          </div>
        }
      >
        {renderInner()}
      </InfiniteScroll>
    )
  }
)
