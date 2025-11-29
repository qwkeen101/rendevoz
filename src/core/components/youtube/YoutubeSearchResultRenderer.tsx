import YoutubeServices, { IYoutubeSearchResultItem } from '@/core/components/youtube/YoutubeServices'
import { ObjectStore } from '@/api/stores'
import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/youtube/YoutubeItemMenu'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Icon } from '@/components'
import { Icons } from '@/consts'
import { DateFormat } from '@/utils'

const VideoRenderer = forwardRef(
  (
    {
      item,
      onClick,
      id,
      showChannel = true
    }: { item?: IYoutubeSearchResultItem; onClick?: VoidFunction; id?: number; showChannel?: boolean },
    ref
  ) => {
    const { snippet, statistics } = item ?? {}
    const video = id ? ObjectStore('youtubeVideo').useValue(id) : undefined
    const { thumbnails, publishedAt, channelTitle } = snippet ?? {}
    const thumbnail = video?.thumbnail ?? (thumbnails?.['high'] || thumbnails?.['medium'] || thumbnails?.['default'])?.url
    const title = video?.name ?? snippet?.title ?? 'Unnamed video'
    const description = video?.description ?? snippet?.description ?? ''
    const duration = video?.duration ?? item?.contentDetails?.duration
    const normalizedDur = duration && typeof duration === 'string' ? YoutubeServices.iso8601DurationToSeconds(duration) : duration
    const seconds = normalizedDur ? normalizeSecondsToTime(normalizedDur) : undefined
    return (
      <ContextMenu ref={ref} content={setV => <YoutubeItemMenu id={id ?? item?.id.videoId} onClose={() => setV(false)} type={'video'} />}>
        <div
          onClick={onClick}
          className={'flex gap-6 w-full !rounded-xl items-center button !p-2 col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-3'}
        >
          <div className={'w-64 shrink-0 relative'}>
            <img src={thumbnail} className={'w-full aspect-video object-cover rounded-lg'} />
            {seconds && (
              <div
                className={
                  'absolute leading-none text-white rounded font-size-12 font-medium bottom-1.5 right-1.5 px-1 py-1 bg-black bg-opacity-90'
                }
              >
                {seconds}
              </div>
            )}
          </div>
          <div className={'flex flex-col gap-1'}>
            {publishedAt && (showChannel ? channelTitle : true) && (
              <div className={'transparent-font font-size-11 font-semibold'}>
                {DateFormat.format(new Date(publishedAt), DateFormat.Formats.default)}{showChannel ? ` · ${channelTitle}` : ''}
              </div>
            )}
            <div className={'text-lg line-clamp-2 font-semibold cursor-pointer'}>{title.replace(/&#39;/g, "'")}</div>
            <div className={'font-size-12 transparent-font line-clamp-3 max-w-4xl'}>{description}</div>
          </div>
        </div>
      </ContextMenu>
    )
  }
)

const cachedFormatter: { current?: Intl.NumberFormat; lang?: string } = {
  current: undefined,
  lang: undefined
}
const getFormatter = (lang: string) => {
  const cachedLang = cachedFormatter.lang
  if (cachedLang && cachedFormatter.current && cachedLang === lang) {
    return cachedFormatter.current
  }
  cachedFormatter.lang = lang
  cachedFormatter.current = new Intl.NumberFormat(lang, {
    compactDisplay: 'short',
    notation: 'compact'
  })
  return cachedFormatter.current
}
const PlaylistRenderer = forwardRef(
  ({ item, onClick, id }: { item?: IYoutubeSearchResultItem; onClick?: VoidFunction; id?: number }, ref) => {
    const { snippet, statistics } = item ?? {}
    const { thumbnails } = snippet ?? {}
    const playlist = id ? ObjectStore('youtubePlaylist').useValue(id) : undefined
    const thumbnail = playlist?.thumbnail ?? (thumbnails?.['high'] || thumbnails?.['medium'] || thumbnails?.['default'])?.url
    const title = playlist?.name ?? snippet?.title ?? 'Unnamed playlist'
    const description = playlist?.description ?? snippet?.description ?? ''
    const { t, i18n } = useTranslation()
    const formatter = getFormatter(i18n.language)
    return (
      <ContextMenu
        ref={ref}
        content={setV => <YoutubeItemMenu id={id ?? item?.id.playlistId} onClose={() => setV(false)} type={'playlist'} />}
      >
        <div
          onClick={onClick}
          className={'flex gap-6 w-full !rounded-xl items-center button !p-2 col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-3'}
        >
          <div className={'w-64 shrink-0 relative'}>
            <img src={thumbnail} className={'w-full aspect-video object-cover rounded-lg'} />
            <div
              className={
                'flex items-center gap-1 absolute leading-none text-white rounded font-size-12 font-medium bottom-1.5 right-1.5 px-1 py-1 bg-black bg-opacity-90'
              }
            >
              <Icon size={14} name={Icons.Playlist} />
              <span>
                {formatter.format(Number(statistics?.videoCount ?? playlist?.itemCount ?? 0))} {t(trans.Feed.Videos)}
              </span>
            </div>
          </div>
          <div className={'flex flex-col gap-1'}>
            <div className={'text-xl line-clamp-2 font-medium cursor-pointer'}>{title}</div>
            {item?.snippet.channelTitle && (
              <div className={'transparent-font leading-none line-clamp-1 font-size-12'}>{item.snippet.channelTitle}</div>
            )}
            <div className={'font-size-13 line-clamp-2'}>{description}</div>
          </div>
        </div>
      </ContextMenu>
    )
  }
)

const ChannelRenderer = forwardRef(
  (
    {
      item,
      onNavigate,
      id
    }: {
      item?: IYoutubeSearchResultItem
      onNavigate: (i: IYoutubeSearchResultItem) => void
      id?: number
    },
    ref
  ) => {
    const { snippet, statistics } = item ?? {}
    const { thumbnails } = snippet ?? {}
    const channel = id ? ObjectStore('youtubeChannel').useValue(id) : undefined
    const thumbnail = channel?.thumbnail ?? (thumbnails?.['high'] || thumbnails?.['medium'] || thumbnails?.['default'])?.url
    const title = channel?.name ?? snippet?.title ?? 'Unnamed channel'
    const description = channel?.description ?? snippet?.description ?? ''
    return (
      <ContextMenu
        ref={ref}
        content={setV => <YoutubeItemMenu id={id ?? item?.snippet.channelId} onClose={() => setV(false)} type={'channel'} />}
      >
        <div
          ref={ref}
          onClick={() => {
            onNavigate?.(item)
          }}
          className={'flex gap-6 w-full !rounded-xl items-center button !p-2 col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-3'}
        >
          <div className={'w-64 flex justify-center items-center shrink-0'}>
            <img src={thumbnail} className={'w-36 h-36 rounded-full'} />
          </div>
          <div className={'flex flex-col gap-1'}>
            <div className={'text-xl font-semibold cursor-pointer'}>{title}</div>
            <div className={'font-size-13 transparent-font line-clamp-2'}>{description}</div>
          </div>
        </div>
      </ContextMenu>
    )
  }
)

export default {
  VideoRenderer,
  PlaylistRenderer,
  ChannelRenderer
}
