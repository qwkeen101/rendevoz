import YoutubeServices, { IYoutubeVideoItem } from '@/core/components/feed/youtube/YoutubeServices'
import { ReactElement, RefObject } from 'react'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useMeasure, useNorepeatNavigate } from '@/hooks'
import ImageTitleItem from '@/core/components/feed/youtube/components/ImageTitleItem'
import VirtualLoader from '@/core/components/feed/youtube/components/VirtualLoader'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/feed/youtube/YoutubeItemMenu'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { DateFormat } from '@/utils'
export default ({
  items,
  onLoadMore,
  scrollElementRef,
  hasMore,
  showChannelTitle,
  scrollKey,
  contextMenu = (i, c) => (
    <ContextMenu content={setV => <YoutubeItemMenu type={'video'} id={items[i].snippet.resourceId.videoId} onClose={() => setV(false)} />}>
      {c}
    </ContextMenu>
  ),
  onNavigate
}: {
  items: IYoutubeVideoItem[]
  onLoadMore: VoidFunction
  scrollKey: string
  hasMore: boolean
  showChannelTitle?: boolean
  withFilter?: boolean
  scrollElementRef: RefObject<HTMLDivElement>
  contextMenu?: (index: number, children: ReactElement) => ReactElement
  onNavigate?: (item: IYoutubeVideoItem) => void
}) => {
  const instance = useFeedInstance()
  const { width } = useMeasure(scrollElementRef)
  const cols = Math.min(Math.floor(width / 400) + 1, 3)
  const rows = items.length % cols === 0 ? items.length / cols : Math.floor(items.length / cols) + 1
  return (
    <VirtualLoader
      className={'pb-40'}
      size={260}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      overscan={1}
      scrollElementRef={scrollElementRef}
      scrollKey={scrollKey}
      count={rows}
      renderItem={idx => {
        const sliced = items.slice(idx * cols, (idx + 1) * cols)
        return (
          <div
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
            className={'grid gap-5 pb-5'}
          >
            {sliced.map((i, index) =>
              contextMenu(
                idx * cols + index,
                <ImageTitleItem
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate?.(i)
                      return
                    }
                    instance.youtubeOps
                      ?.addVideo(i.snippet.resourceId.videoId, {
                        history: true
                      })
                      .then(res => {
                        instance.youtubeOps?.goTo(res.id, 'video')
                      })
                  }}
                  id={i.id}
                  image={i.snippet.thumbnails?.high?.url}
                  title={i.snippet.title}
                  aboveTitle={
                    <div className={'text-white font-size-12 flex gap-1'}>
                      {showChannelTitle && i.snippet.channelTitle && (
                        <>
                          <div>{i.snippet.channelTitle}</div>
                          <div>·</div>
                        </>
                      )}
                      {i.snippet?.publishedAt && !showChannelTitle && (
                        <>
                          <div>{DateFormat.format(new Date(i.snippet.publishedAt), DateFormat.Formats.yearMonthDays)}</div>
                          <div>·</div>
                        </>
                      )}
                      {i.contentDetails?.duration && YoutubeServices.iso8601DurationToSeconds(i.contentDetails.duration) && (
                        <div>{normalizeSecondsToTime(YoutubeServices.iso8601DurationToSeconds(i.contentDetails.duration)!)}</div>
                      )}
                    </div>
                  }
                  description={i.snippet.description}
                  key={i.id}
                />
              )
            )}
          </div>
        )
      }}
    ></VirtualLoader>
  )
}
