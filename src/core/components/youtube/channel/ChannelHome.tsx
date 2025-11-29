import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import { useNorepeatNavigate } from '@/hooks'
import { DotLoading, Icon } from '@/components'
import { Icons } from '@/consts'
import { IYoutubeVideoItem } from '@/core/components/youtube/YoutubeServices'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/youtube/YoutubeItemMenu'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import YoutubeVideoCard from '@/core/components/youtube/components/YoutubeVideoCard'
import { Fragment } from 'react'

export default ({ channelId }: { channelId: string }) => {
  const [state, setState] = useYoutubeState()
  const instance = useYoutubeInstance()
  const cache = state.dataCache.channel[channelId]
  const { t } = useTranslation()
  if (!cache?.videos) {
    return (
      <div className={'w-full grow flex items-center justify-center'}>
        <DotLoading />
      </div>
    )
  }
  const scroller = (title: string, items: IYoutubeVideoItem[], onClick?: VoidFunction, onItemClick?: (i: IYoutubeVideoItem) => void) => {
    if (!items.length) {
      return null
    }
    return (
      <Fragment key={title}>
        <div className={'text-2xl line-clamp-1 max-w-[80%] w-fit cursor-pointer font-bold hover:underline mb-4'} onClick={onClick}>
          {title}
        </div>
        <div
          style={{
            gridAutoColumns: '240px',
            gridAutoFlow: 'column'
          }}
          className={'no-scrollbar mb-10 grid min-w-full overflow-x-auto gap-6 -mr-6 pr-6 snap-x shrink-0 snap-mandatory'}
        >
          {items.map(i =>
            i.snippet?.thumbnails?.high ? (
              <ContextMenu key={i.id} content={setV => <YoutubeItemMenu type={'video'} id={i.id} onClose={() => setV(false)} />}>
                <YoutubeVideoCard
                  onClick={() => {
                    if (onItemClick) {
                      onItemClick?.(i)
                      return
                    }
                    instance.load?.(i.id, 'video')
                  }}
                  image={i.snippet.thumbnails?.high?.url}
                  watch={i.statistics?.viewCount}
                  title={i.snippet.title}
                  duration={i.contentDetails?.duration}
                ></YoutubeVideoCard>
              </ContextMenu>
            ) : null
          )}
        </div>
      </Fragment>
    )
  }
  return (
    <div className={'pb-20'}>
      {scroller(t(trans.Feed.Videos), cache?.videos ?? [], () => {
        useYoutubeState.setChannelDataState(channelId, s => ({ ...s, tab: 'videos' }))
      })}
      {cache?.playlists?.map(i =>
        scroller(
          i.snippet.title,
          i.videos ?? [],
          () => {
            instance.load?.(i.id, 'playlist')
          },
          v => {
            instance.load?.(v.id, 'video', { playlistId: i.id })
          }
        )
      )}
    </div>
  )
}
