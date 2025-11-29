import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useNorepeatNavigate } from '@/hooks'
import { Icon } from '@/components'
import { Icons } from '@/consts'
import youtubeServices, { IYoutubeVideoItem } from '@/core/components/feed/youtube/YoutubeServices'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/feed/youtube/YoutubeItemMenu'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { normalizeSecondsToTime } from '@/core/components/media/utils'

export default ({ channelId, channelAppId }: { channelId: string; channelAppId: number }) => {
  const [state, setState] = useYoutubeState()
  const instance = useFeedInstance()
  const navigate = useNorepeatNavigate()
  const cache = state.dataCache.channel[channelId]
  const { t } = useTranslation()
  if (!cache?.videos) {
    return (
      <div className={'w-full grow flex items-center justify-center'}>
        <Icon name={Icons.Loading} spin size={40} />
      </div>
    )
  }
  const scroller = (title: string, items: IYoutubeVideoItem[], onClick?: VoidFunction, onItemClick?: (i: IYoutubeVideoItem) => void) => {
    if (!items.length) {
      return null
    }
    return (
      <>
        <div className={'text-2xl max-w-[80%] w-fit flex cursor-pointer items-center gap-2 group font-semibold mb-4'} onClick={onClick}>
          <span className={'line-clamp-1'}>{title}</span>
          <Icon strokeWidth={5} className={'transition-transform icon-18 group-hover:translate-x-1'} name={'park-right'} />
        </div>
        <div className={'no-scrollbar mb-10 flex min-w-full overflow-x-auto gap-5 -mr-6 pr-6 snap-x shrink-0 snap-mandatory'}>
          {items.map(i =>
            i.snippet?.thumbnails?.high ? (
              <ContextMenu
                content={setV => <YoutubeItemMenu type={'video'} id={i.snippet.resourceId.videoId} onClose={() => setV(false)} />}
              >
                <div
                  onClick={() => {
                    if (onItemClick) {
                      onItemClick?.(i)
                      return
                    }
                    instance.youtubeOps
                      ?.addVideo(i.snippet.resourceId.videoId, {
                        history: true
                      })
                      .then(v => {
                        instance.youtubeOps?.goTo(v.id, 'video')
                      })
                  }}
                  className={'flex group flex-col snap-start shrink-0 gap-2.5 cursor-pointer'}
                >
                  <div className={'relative'}>
                    <img src={i.snippet.thumbnails?.high?.url} className={'w-64 rounded-lg aspect-video object-cover shrink-0'} />
                    {i.contentDetails?.duration && (
                      <div
                        className={
                          'absolute leading-none text-white rounded text-opacity-90 font-size-12 font-medium bottom-1.5 right-1.5 px-1 py-1 bg-black bg-opacity-80'
                        }
                      >
                        {normalizeSecondsToTime(youtubeServices.iso8601DurationToSeconds(i.contentDetails.duration)!)}
                      </div>
                    )}
                  </div>
                  <div className={'max-w-64 font-medium group-hover:underline cursor-pointer text-base line-clamp-2'}>
                    {i.snippet.title}
                  </div>
                </div>
              </ContextMenu>
            ) : null
          )}
        </div>
      </>
    )
  }
  return (
    <>
      <div className={'pb-1'}></div>
      {scroller(t(trans.Feed.Videos), cache?.videos ?? [], () => {
        navigate(`/youtube/channel/${channelAppId}/videos`, { replace: true })
      })}
      {cache?.playlists?.map(i =>
        scroller(
          i.snippet.title,
          i.videos ?? [],
          () => {
            instance.youtubeOps?.addPlaylist(i.id).then(res => {
              instance.youtubeOps?.goTo(res.id, 'playlist')
            })
          },
          v => {
            instance.youtubeOps?.addPlaylist(i.id).then(res => {
              console.log(res)
              instance.youtubeOps
                ?.addVideo(v.snippet.resourceId.videoId, {
                  history: true,
                  playlistAppId: res.id
                })
                .then(v => {
                  instance.youtubeOps?.goTo(v.id, 'video')
                })
            })
          }
        )
      )}
      <div className={'pb-40'}></div>
    </>
  )
}
