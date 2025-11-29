import { IYoutubeChannelItem } from '@/core/components/feed/youtube/YoutubeServices'
import { ReactElement, RefObject } from 'react'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useMeasure, useNorepeatNavigate } from '@/hooks'
import VirtualLoader from '@/core/components/feed/youtube/components/VirtualLoader'
import ImageTitleItem from '@/core/components/feed/youtube/components/ImageTitleItem'
import classnames from 'classnames'
export default ({
  items,
  onLoadMore,
  scrollElementRef,
  scrollKey,
  contextMenu = (i, c) => c,
  hasMore,
  gapClassName = 'gap-5 pb-5',
  maxColumns = 3
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
  const instance = useFeedInstance()
  const { width } = useMeasure(scrollElementRef)
  const cols = Math.min(Math.floor(width / 400) + 1, maxColumns)
  const rows = items.length % cols === 0 ? items.length / cols : Math.floor(items.length / cols) + 1
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
            className={classnames('grid', gapClassName)}
          >
            {sliced.map((i, index) =>
              contextMenu(
                idx * cols + index,
                <ImageTitleItem
                  onClick={() => {
                    instance.youtubeOps?.addChannel(i.snippet.channelId).then(res => {
                      instance.youtubeOps?.goTo(res.id, 'channel')
                    })
                  }}
                  id={i.snippet.channelId}
                  image={i.snippet.thumbnails?.high?.url}
                  title={i.snippet.title}
                  description={i.snippet.description}
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
