import YoutubeServices, { IYoutubeVideoItem } from '@/core/components/youtube/YoutubeServices'
import { ReactElement, RefObject } from 'react'
import { useMeasure } from '@/hooks'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/youtube/YoutubeItemMenu'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import YoutubeVideoCard from '@/core/components/youtube/components/YoutubeVideoCard'
import { ObjectStore } from '@/api/stores'
import { IYoutubeVideo } from '~/typings'
export default ({
  items,
  onLoadMore,
  scrollElementRef,
  hasMore,
  scrollKey,
  contextMenu = (i, c) => (
    <ContextMenu key={i} content={setV => <YoutubeItemMenu type={'video'} id={i} onClose={() => setV(false)} />}>
      {c}
    </ContextMenu>
  ),
  onNavigate,
  large,
  showChannel
}: {
  items: IYoutubeVideoItem[] | number[]
  onLoadMore: VoidFunction
  scrollKey?: string
  hasMore: boolean
  showChannel?: boolean
  large?: boolean
  scrollElementRef: RefObject<HTMLDivElement>
  contextMenu?: (id: string, children: ReactElement) => ReactElement
  onNavigate?: (item: string) => void
}) => {
  const instance = useYoutubeInstance()
  const { width } = useMeasure(scrollElementRef)
  const cols = Math.floor(width / (large ? 400 : 340)) + 1
  const videos = ObjectStore('youtubeVideo').useMultiple(typeof items?.[0] === 'number' ? (items as number[]) : undefined)
  const final =
    typeof items?.[0] === 'number'
      ? videos
      : ((items as IYoutubeVideoItem[] | undefined)?.map(i => ({
          name: i.snippet.title,
          thumbnail: i.snippet.thumbnails?.high?.url ?? '',
          channelTitle: i.snippet.channelTitle,
          publishedAt: i.snippet.publishedAt,
          viewCount: i.statistics?.viewCount,
          videoId: i.id,
          channelId: i.snippet.channelId,
          duration: YoutubeServices.iso8601DurationToSeconds(i.contentDetails?.duration)
        })) as IYoutubeVideo[])
  const rows = final.length % cols === 0 ? final.length / cols : Math.floor(final.length / cols) + 1
  return (
    <VirtualLoader
      className={'pb-40'}
      size={260}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      overscan={3}
      scrollElementRef={scrollElementRef}
      scrollKey={scrollKey}
      count={rows}
      renderItem={idx => {
        const sliced = final.slice(idx * cols, (idx + 1) * cols)
        return (
          <div
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
            className={'grid gap-6 pb-8'}
          >
            {sliced.map(i => {
              return contextMenu(
                i.videoId,
                <YoutubeVideoCard
                  key={i.videoId}
                  duration={i.duration}
                  time={i.publishedAt}
                  image={i.thumbnail}
                  channelId={i.channelId}
                  title={i.name}
                  watch={i.viewCount}
                  channel={showChannel ? i.channelTitle : undefined}
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate?.(i.videoId)
                      return
                    }
                    instance.load?.(i.videoId, 'video')
                  }}
                />
              )
            })}
          </div>
        )
      }}
    ></VirtualLoader>
  )
}
