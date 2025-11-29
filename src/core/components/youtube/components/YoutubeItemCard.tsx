import { forwardRef, memo, useState } from 'react'
import { getImageMainColor } from '@/core/components'
import { Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'

export default memo(
  forwardRef<
    HTMLDivElement,
    {
      name: string
      image: string
      onClick: VoidFunction
      type: 'playlist' | 'channel'
      channel?: string
      channelId?: string
      count?: number
      subscriber?: string
    }
  >(({ name, image, onClick, count, subscriber, type, channel, channelId }, ref) => {
    const [color, setColor] = useState()
    const { t } = useTranslation()
    const instance = useYoutubeInstance()
    if (type === 'playlist') {
      return (
        <div ref={ref} style={{ paddingTop: 8 }} onClick={onClick} className={'flex flex-col'}>
          <div className={'w-full aspect-video cursor-pointer relative'}>
            <div
              style={{
                position: 'absolute',
                top: -8,
                opacity: 0.5,
                width: 'calc(100% - 24px)',
                height: '100%',
                background: color,
                left: 12,
                right: 12,
                borderRadius: 12
              }}
            ></div>
            <div
              style={{
                position: 'absolute',
                top: -4,
                opacity: 0.8,
                background: color,
                width: 'calc(100% - 16px)',
                height: '100%',
                left: 8,
                right: 8,
                borderRadius: 8
              }}
            ></div>
            <img
              onLoad={e => getImageMainColor(e.currentTarget, image).then(res => setColor(res))}
              src={image}
              className={'object-cover absolute inset-0 z-20 size-full'}
              style={{
                borderRadius: 8
              }}
            />
            {count ? (
              <div
                style={{
                  padding: '1px 4px'
                }}
                className={
                  'absolute text-white flex items-center font-medium gap-1 bg-neutral-900 bg-opacity-70 font-size-12 rounded-md bottom-2 right-2 z-20'
                }
              >
                <Icon name={'park-music-list'} size={13} />
                {t('feed.VideoCount', { count })}
              </div>
            ) : null}
          </div>
          <div dangerouslySetInnerHTML={{ __html: name }} className={'line-clamp-2 mt-3 font-bold cursor-pointer'}></div>
          {channel && (
            <div
              onClick={e => {
                e.stopPropagation()
                if (channelId) {
                  instance.load?.(channelId, 'channel')
                }
              }}
              className={'mt-1 transparent-font hover-primary-color transition-colors cursor-pointer line-clamp-1 font-size-13'}
            >
              {channel}
            </div>
          )}
        </div>
      )
    }
    if (type === 'channel') {
      return (
        <div ref={ref} onClick={onClick} className={'flex flex-col'}>
          <img src={image} className={'object-cover cursor-pointer w-full aspect-square rounded-3xl'} />
          <div dangerouslySetInnerHTML={{ __html: name }} className={'line-clamp-2 mt-3 font-bold cursor-pointer'}></div>
          {(count || subscriber) && (
            <div className={'mt-1 transparent-font font-size-13'}>
              {[
                count ? t('feed.VideoCount', { count: count }) : '',
                subscriber
                  ? t('feed.SubscriberCount', {
                      count: new Intl.NumberFormat(undefined, {
                        notation: 'compact',
                        compactDisplay: 'short',
                        maximumFractionDigits: 1
                      }).format(Number(subscriber))
                    })
                  : undefined
              ]
                .filter(Boolean)
                .join(' • ')}
            </div>
          )}
        </div>
      )
    }
  })
)
