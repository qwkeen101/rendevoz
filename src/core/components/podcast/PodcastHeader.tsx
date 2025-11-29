import { IPodcast } from '@/core/components/feed/components/podcast/types'
import { Content, Icon } from '@/components'
import classnames from 'classnames'
import { useMeasure } from '@/hooks'
import { memo, useMemo, useRef } from 'react'
import { ObjectStore } from '@/api/stores'
import usePodcastInstance from '@/core/components/feed/components/podcast/usePodcastInstance'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'
import usePodcastState from '@/core/components/feed/components/podcast/usePodcastState'

export default memo(({ id }: { id?: number }) => {
  const podcast = ObjectStore('podcast').useValue(id)
  const { thumbnail, name, artist, description } = podcast || {
    name: 'Unknown podcast'
  }
  const playlist = usePodcastData().playlist
  const [state, setState] = usePodcastState()
  const isPlaying = state.isPlaying
  const { t } = useTranslation()
  const playIconState = useMemo(() => {
    if (playlist.current && podcast?.episodes.includes(playlist.current)) {
      if (isPlaying) {
        return {
          text: t('general.Pause'),
          key: 'pause',
          icon: 'park-pause'
        }
      }
      return {
        text: t('general.Continue'),
        key: 'continue',
        icon: 'park-play-one'
      }
    }
    if (playlist.list.some(i => podcast?.episodes.includes(i))) {
      return {
        text: t('general.Continue'),
        key: 'continue',
        icon: 'park-play-one'
      }
    }
    return {
      text: t('general.Play'),
      key: 'play',
      icon: 'park-play-one'
    }
  }, [podcast?.episodes, isPlaying])
  const instance = usePodcastInstance()
  const first = podcast?.episodes?.[0]
  const handlePlay = () => {
    if (playIconState.key === 'continue') {
      playlist.current && instance.actionOps?.playEpisode?.(playlist.current)
    }
    if (playIconState.key === 'pause') {
      instance.actionOps?.pause?.()
    }
    if (playIconState.key === 'play') {
      const inPlaylist = playlist.list.find(i => podcast?.episodes.includes(i))
      if (inPlaylist) {
        instance.actionOps?.playEpisode?.(inPlaylist)
      } else if (first) {
        instance.actionOps?.playEpisode?.(first)
      }
    }
  }
  return (
    <div className={'p-6 items-center gap-y-4 gap-x-8 flex flex-col @4xl:flex-row'}>
      {thumbnail && (
        <img className={'rounded-xl shadow-xl flex-shrink-0 bg-secondary w-64 h-64'} style={{ objectFit: 'cover' }} src={thumbnail} />
      )}
      <Content flex column className={'gap-y-1 items-center @4xl:items-start'}>
        <div className={classnames('font-semibold text-center line-clamp-3 text-xl @4xl:line-clamp-2 @4xl:text-2xl')}>{name}</div>
        <div className={'transparent-font'}>{artist}</div>
        {description && (
          <div className={'ellipsis-font-3'} style={{ maxWidth: 'min(100%, 500px)' }}>
            {description}
          </div>
        )}
        <div className={'flex mt-3 gap-3 font-medium select-none'}>
          {(podcast?.episodes.length ?? 0) > 0 && (
            <div
              onClick={() => {
                handlePlay()
              }}
              className={'reverse-theme-button common-button !rounded-full !h-9 !pr-4 !pl-3'}
            >
              <Icon name={playIconState.icon} strokeWidth={6} className={'icon-18'} theme={'filled'} />
              {playIconState.text}
            </div>
          )}
          <div
            onClick={() => {
              id && instance.dataOps?.follow?.(id, 'podcast')
            }}
            className={'common-button font-normal hover-bg-hover border !h-9 !rounded-full !pr-4 !pl-3'}
          >
            <Icon
              name={'park-like'}
              theme={podcast?.followed ? 'filled' : undefined}
              style={{
                color: podcast?.followed ? Colors.Common.Red : undefined
              }}
            />
            {podcast?.followed ? t('general.Unfollow') : t('general.Follow')}
          </div>
          <div
            onClick={() => {
              id && instance.dataOps?.star?.(id, 'podcast')
            }}
            className={'common-button font-normal hover-bg-hover border !rounded-full !h-9 !pr-4 !pl-3'}
          >
            <Icon
              theme={podcast?.starred ? 'filled' : undefined}
              name={'park-star'}
              style={{
                color: podcast?.starred ? Colors.Emphasis.Emphasis : undefined
              }}
            />
            {podcast?.starred ? t('general.Unstar') : t('general.Star')}
          </div>
        </div>
      </Content>
    </div>
  )
})
