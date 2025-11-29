import { IYoutubeChannelItem } from '@/core/components/youtube/YoutubeServices'
import { ReactElement, RefObject } from 'react'
import { useMeasure } from '@/hooks'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import classnames from 'classnames'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import YoutubeItemCard from '@/core/components/youtube/components/YoutubeItemCard'

export default ({
  items,
  onLoadMore,
  scrollElementRef,
  scrollKey,
  contextMenu = (i, c) => c,
  hasMore,
  gapClassName,
  maxColumns = Number.MAX_SAFE_INTEGER
}: {
  items: IYoutubeChannelItem[]
  onLoadMore: VoidFunction
  scrollKey: string
  scrollElementRef: RefObject<HTMLDivElement>
  hasMore: boolean
  maxColumns?: number
  gapClassName?: string
  contextMenu?: (index: number, children: ReactElement) => ReactElement
}) => {
  const instance = useYoutubeInstance()
  const { width } = useMeasure(scrollElementRef)
  const cols = Math.min(Math.floor(width / 260) + 1, maxColumns)
  const rows = items.length % cols === 0 ? items.length / cols : Math.floor(items.length / cols) + 1
  console.log(items)
  return (
    <VirtualLoader
      className={'pb-40'}
      hasMore={hasMore}
      renderItem={idx => {
        const sliced = items.slice(idx * cols, (idx + 1) * cols)
        return (
          <div
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
            className={classnames('grid gap-7 pb-7', gapClassName)}
          >
            {sliced.map((i, index) =>
              contextMenu(
                idx * cols + index,
                <YoutubeItemCard
                  type="channel"
                  subscriber={i.statistics?.subscriberCount}
                  onClick={() => {
                    instance.load?.(i.snippet.channelId, 'channel')
                  }}
                  count={i.statistics?.videoCount ? Number(i.statistics.videoCount) : undefined}
                  image={i.snippet.thumbnails?.high?.url}
                  name={i.snippet.title}
                  key={i.snippet.channelId}
                />
              )
            )}
          </div>
        )
      }}
      scrollKey={scrollKey}
      size={260}
      onLoadMore={onLoadMore}
      overscan={1}
      count={rows}
      scrollElementRef={scrollElementRef}
    ></VirtualLoader>
  )
}
