import { IYoutubePlaylistItem } from '@/core/components/youtube/YoutubeServices'
import { ReactElement, RefObject } from 'react'
import { useMeasure } from '@/hooks'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import ImageTitleItem from '@/core/components/common/ImageTitleItem'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/youtube/YoutubeItemMenu'

import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import YoutubeItemCard from '@/core/components/youtube/components/YoutubeItemCard'
import { ObjectStore } from '@/api/stores'
import { IYoutubePlaylist } from '~/typings'
export default ({
  items,
  onLoadMore,
  scrollElementRef,
  gapClassName,
  showChannel = true,
  contextMenu = (i, c) => (
    <ContextMenu key={i} content={setV => <YoutubeItemMenu type={'playlist'} id={i} onClose={() => setV(false)} />}>
      {c}
    </ContextMenu>
  ),
  scrollKey,
  hasMore
}: {
  items: IYoutubePlaylistItem[] | number[]
  onLoadMore: VoidFunction
  scrollKey?: string
  contextMenu?: (id: string, children: ReactElement) => ReactElement
  scrollElementRef: RefObject<HTMLDivElement>
  hasMore: boolean
  gapClassName?: string
  showChannel?: boolean
}) => {
  const isNumber = typeof items?.[0] === 'number'
  const instance = useYoutubeInstance()
  const { width } = useMeasure(scrollElementRef)
  const playlists = ObjectStore('youtubePlaylist').useMultiple(isNumber ? (items as number[]) : undefined)
  const final = isNumber
    ? playlists
    : ((items as IYoutubePlaylistItem[]).map(i => ({
        name: i.snippet.title,
        channelId: i.snippet.channelId,
        playlistId: i.id,
        channelTitle: i.snippet.channelTitle,
        itemCount: i.contentDetails?.itemCount,
        thumbnail: i.snippet.thumbnails?.high?.url
      })) as IYoutubePlaylist[])
  const cols = Math.floor(width / 340) + 1
  const rows = final.length % cols === 0 ? final.length / cols : Math.floor(final.length / cols) + 1
  return (
    <VirtualLoader
      className={'pb-40'}
      hasMore={hasMore}
      renderItem={idx => {
        const sliced = final.slice(idx * cols, (idx + 1) * cols)
        return (
          <div
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
            className={classnames('grid gap-7 pb-7', gapClassName)}
          >
            {sliced.map(i =>
              contextMenu(
                i.playlistId,
                <YoutubeItemCard
                  channelId={i.channelId}
                  type={'playlist'}
                  onClick={() => {
                    instance.load?.(i.playlistId, 'playlist')
                  }}
                  channel={showChannel ? i.channelTitle : undefined}
                  count={i.itemCount}
                  image={i.thumbnail}
                  name={i.name}
                  key={i.playlistId}
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
