import { memo, ReactNode, useEffect, useState } from 'react'
import { DotLoading, Icon, IconWithPopover } from '@/components'
import { ObjectStore } from '@/api/stores'
import updatePodcastInfo from '@/core/components/podcast/services/podcastServices'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import { useLocation, useParams } from 'react-router-dom'
import PodcastMenu from '@/core/components/podcast/menu/PodcastMenu'
import ContextMenu from '@/components/contextMenu'
import classnames from 'classnames'
import useEpisodeFilter from '@/core/components/podcast/hooks/useEpisodeFilter'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import NoResult from '@/core/components/common/NoResult'
import { Icons } from '@/consts'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import EpisodePlayingIcon from '@/core/components/podcast/components/EpisodePlayingIcon'

export default memo(() => {
  const { id: paramsId } = useParams()
  const id = paramsId ? Number(paramsId) : undefined
  const podcast = ObjectStore('podcast').useValue(id)
  const [isFetchingEpisodes, setIsFetching] = useState(false)
  const scrollKey = paramsId
  const instance = usePodcastInstance()
  const current = usePodcastData().playlist.current
  const currentPlaying = usePodcastState()[0].isPlaying ? current : undefined
  useEffect(() => {
    if (podcast && id) {
      if (!podcast.episodes.length) {
        setIsFetching(true)
        updatePodcastInfo.fetchEpisodes(id).finally(() => setIsFetching(false))
      } else {
        updatePodcastInfo.fetchEpisodes(id)
      }
    }
  }, [podcast?.id])

  const { finalResults } = useEpisodeFilter(
    podcast?.episodes,
    scrollKey,
    {
      hasHighlight: true,
      isObject: true,
      listened: true,
      unlistened: true
    },
    false
  )
  const [color, setColor] = useState('')
  const { mainHeight, renderMain, renderSub } = useRenderGradientBg(color)
  const episodes = ObjectStore('episode').useMultiple(finalResults)
  return (
    <div className={'w-full min-h-full flex flex-col'}>
      <Header sub={renderSub} main={renderMain} height={mainHeight} onColor={c => setColor(c)} id={id} />

      {isFetchingEpisodes ? (
        <div className={'flex items-center justify-center w-full flex-1'}>
          <DotLoading />
        </div>
      ) : (
        <div className='p-8 pt-0 relative flex flex-col flex-1'>
          {episodes?.length ? (
            <div style={{ transform: 'translateZ(1px)' }}>
              <div className='flex select-none pb-2 items-center mb-3 font-medium font-size-13 border-bottom transparent-font'>
                <div className='w-16 text-lg leading-none text-center'>#</div>
                <div className='flex-1'>名称</div>
                <div className='w-24'></div>
                <div className='w-32'>发行日期</div>
                <div className='w-32'>时长</div>
              </div>
              <VirtualLoader
                paddingEnd={100}
                size={100}
                renderItem={idx => {
                  const item = episodes[idx]?.id
                  if (!item) return null
                  return <EpisodeItem id={item} isPlaying={currentPlaying === item} index={episodes.length - idx}></EpisodeItem>
                }}
                scrollElementRef={instance.scrollElementRef}
                scrollKey={scrollKey}
                count={episodes.length}
              ></VirtualLoader>
            </div>
          ) : (
            <EmptyList />
          )}
        </div>
      )}
    </div>
  )
})

const EpisodeItem = memo(({ id, index, isPlaying }: { id: number; index?: number; isPlaying?: boolean }) => {
  const episode = ObjectStore('episode').useValue(id)
  const instance = usePodcastInstance()
  const { ref, isIn } = useIsIn()
  if (!episode) return null
  const { name, releaseDate, duration, followed, thumbnail } = episode
  return (
    <ContextMenu ref={ref} content={setV => <PodcastMenu id={id} type={'episode'} onClose={() => setV(false)} />}>
      <div
        onDoubleClick={() => {
          instance.actionOps?.openEpisode(id)
        }}
        className={'flex select-none relative items-center group py-2 rounded-xl light-hover'}
      >
        <div className={'w-16 flex items-center justify-center primary-solid-font'}>
          {isIn ? (
            <Icon
              strokeWidth={8}
              onClick={e => {
                e.stopPropagation()
                if (isPlaying) {
                  instance.actionOps?.pause()
                } else {
                  instance.actionOps?.playEpisode(id)
                }
              }}
              className={'cursor-pointer opacity-50 hover:opacity-100'}
              name={isPlaying ? 'park-pause' : 'park-play-one'}
              theme={'filled'}
              size={18}
            />
          ) : isPlaying ? (
            <EpisodePlayingIcon />
          ) : (
            <span className={'opacity-50 font-size-12 font-bold'}>{index}</span>
          )}
        </div>
        <div className={'flex flex-1 items-center'}>
          {thumbnail && <img src={thumbnail} className={'size-11 mr-4 rounded-md'} />}
          <div className={'line-clamp-1 pr-6'}>{name}</div>
          {isIn && (
            <div onClick={e => e.stopPropagation()} className={'flex gap-4 shrink-0 items-center ml-auto transparent-font pr-8'}>
              <IconWithPopover
                align={'start'}
                placement={['right', 'left']}
                content={setV => <PodcastMenu id={id} type={'episode'} onClose={() => setV(false)} />}
                name={Icons.More}
                size={24}
              />
            </div>
          )}
        </div>
        <div className='w-24'>
          <Icon
            name={Icons.Like}
            theme={followed ? 'filled' : undefined}
            className={classnames(followed ? '!text-red-500' : 'transparent-font', 'w-fit cursor-pointer hover-primary-color')}
            size={20}
            onDoubleClick={e => e.stopPropagation()}
            onClick={e => {
              instance.dataOps?.follow?.(id, 'episode')
            }}
          />
        </div>
        <div className={'w-32 transparent-font font-size-12'}>{DateFormat.formatDate(releaseDate, true)}</div>
        <div className={'w-32 transparent-font font-size-12'}>{DateFormat.formatDuration(duration ?? 0)}</div>
      </div>
    </ContextMenu>
  )
})

import { AnimatePopover, Menu, WithBorder } from '@/components'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import usePodcastState from '@/core/components/podcast/hooks/usePodcastState'
import { useIsIn } from '@/hooks'
import { EmptyList, getImageMainColor, ImageWithBlur } from '@/core/components'
import ClearSearchButton from '../../common/ClearSearchButton'
import useRenderGradientBg from '../../common/useRenderGradientBg'

const Header = memo(
  ({
    id,
    main,
    onColor,
    height,
    sub
  }: {
    id?: number
    main: () => ReactNode
    sub: () => ReactNode
    height: string
    onColor: (v: string) => void
  }) => {
    const podcast = ObjectStore('podcast').useValue(id)
    const { thumbnail, name, artist } = podcast || {
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
    }, [podcast?.episodes, isPlaying, playlist])
    const instance = usePodcastInstance()
    const first = podcast?.episodes?.[0]
    const handlePlay = () => {
      if (playIconState.key === 'continue') {
        const target = playlist.list.find(i => podcast?.episodes.includes(i))
        if (target) {
          instance.actionOps?.playEpisode?.(target)
        }
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
    const menu = PodcastMenu.useMoveToMenu({ id, type: 'podcast' })
    const { setState: setFilter, state: filterState } = useEpisodeFilter(podcast?.episodes, id?.toString())
    return (
      <>
        <div style={{ minHeight: height }} className={'p-8 select-none gap-10 relative flex items-end'}>
          {main()}
          {thumbnail && (
            <ImageWithBlur
              onLoad={e => getImageMainColor(e, thumbnail).then(res => res && onColor(res))}
              className={'rounded-xl flex-shrink-0 bg-secondary size-64'}
              url={thumbnail}
            />
          )}
          <div className={'items-start gap-3 flex z-20 flex-col'}>
            <div>{t('podcast.Podcast')}</div>
            <div className={'font-bold text-6xl line-clamp-2'}>{name}</div>
            {artist && <div className='font-bold text-xl'>{artist}</div>}
          </div>
        </div>
        <div className={'relative px-8 py-6 select-none'}>
          {sub()}
          <div className='flex items-center gap-8' style={{ transform: 'translateZ(1px)' }}>
            {(podcast?.episodes.length ?? 0) > 0 && (
              <Icon
                name={playIconState.icon}
                strokeWidth={8}
                theme={'filled'}
                size={24}
                onClick={() => {
                  handlePlay()
                }}
                className='reverse-theme hover:scale-110 transition-transform cursor-pointer p-3 rounded-full'
              ></Icon>
            )}
            <Icon
              name={Icons.Like}
              theme={podcast?.followed ? 'filled' : undefined}
              onClick={() => {
                id && instance.dataOps?.follow?.(id, 'podcast')
              }}
              size={26}
              className={classnames(podcast?.followed ? 'text-red-500 cursor-pointer' : 'hover-active-button', '!transition-colors')}
            ></Icon>
            <AnimatePopover
              padding={6}
              positions={['bottom']}
              content={setV => (
                <WithBorder className={'py-1 min-w-56'}>
                  <Menu.NavigationMenu layout={menu?.(() => setV(false)) || []} />
                </WithBorder>
              )}
            >
              <Icon size={30} name={Icons.Create} className={'hover-active-button'}></Icon>
            </AnimatePopover>
            <ClearSearchButton
              query={filterState.query}
              onChange={v => {
                setFilter(s => ({ ...s, query: v }))
              }}
              size={24}
              width={200}
              debounce={0}
              className='hover-active-button'
            />
          </div>
        </div>
      </>
    )
  }
)
