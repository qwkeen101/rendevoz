import { forwardRef, useState } from 'react'
import YoutubeServices from '@/core/components/youtube/YoutubeServices'
import { useTranslation } from 'react-i18next'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'

export default forwardRef(
  (
    {
      onClick,
      duration,
      image,
      title,
      channel,
      time,
      watch,
      channelId
    }: {
      onClick: VoidFunction
      title: string
      image: string
      watch?: string | number
      duration?: string | number
      channelId?: string
      playedTime?: number
      channel?: string
      time?: string
    },
    ref
  ) => {
    const instance = useYoutubeInstance()
    const { t } = useTranslation()
    const isWatchNull = watch === undefined || Number(watch) === 0
    const seconds = duration ? (typeof duration === 'string' ? YoutubeServices.iso8601DurationToSeconds(duration) : duration) : undefined
    return (
      <div onClick={onClick} className={'flex flex-col w-full'} ref={ref}>
        <div className={'w-full relative origin-center cursor-pointer aspect-video shrink-0 overflow-hidden rounded-xl'}>
          <img src={image} className={'w-full h-full object-cover'} />
          {seconds !== undefined && seconds > 0 && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                borderRadius: '4px',
                padding: '0px 4px',
                fontSize: '11px',
                fontWeight: 600
              }}
              className={'absolute bottom-2 right-2'}
            >
              {DateFormat.formatDuration(seconds)}
            </div>
          )}
        </div>
        <div dangerouslySetInnerHTML={{ __html: title }} className={`font-bold cursor-pointer mt-3 mb-1 line-clamp-2`}></div>
        {channel && (
          <div
            onClick={e => {
              if (channelId) {
                e.stopPropagation()
                instance.load?.(channelId, 'channel')
              }
            }}
            className={'font-size-13 transition-colors cursor-pointer line-clamp-1 hover-primary-color transparent-font'}
          >
            {channel}
          </div>
        )}
        {(!isWatchNull || time !== undefined) && (
          <div className={'font-size-13 line-clamp-1 transparent-font'}>
            {[
              !isWatchNull &&
                t('feed.WatchCount', {
                  count: new Intl.NumberFormat(undefined, {
                    notation: 'compact',
                    compactDisplay: 'short',
                    maximumFractionDigits: 1
                  }).format(Number(watch))
                }),
              time !== undefined && DateFormat.formatTime(time)
            ]
              .filter(Boolean)
              .join(' • ')}
          </div>
        )}
      </div>
    )
  }
)
