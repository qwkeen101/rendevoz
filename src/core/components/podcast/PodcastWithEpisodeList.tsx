import { IItunesPodcast } from '@/core/components/feed/utils/service/podcasts'
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from 'react'
import { Content, Icon, IconWithPopover, useElementScrollRestore, useVirtualizer } from '@/components'
import usePodcastState from '@/core/components/feed/components/podcast/usePodcastState'
import Id from '@/utils/id'
import PodcastHeader from '@/core/components/feed/components/podcast/PodcastHeader'
import { DateFormat, pushNumberIntoUnrepeatableArray } from '@/utils'
import { ObjectStore } from '@/api/stores'
import updatePodcastInfo from '@/core/components/feed/components/podcast/services/podcastServices'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'
import { useNavigate, useParams } from 'react-router-dom'

import formatReleaseDate from '@/core/components/feed/components/podcast/utils/formatReleaseDate'
import { formatDuration } from 'date-fns'
import formatEpisodeDuration from '@/core/components/feed/components/podcast/utils/formatEpisodeDuration'
import EpisodePlayingIcon from '@/core/components/feed/components/podcast/components/EpisodePlayingIcon'
import PodcastMenu from '@/core/components/feed/components/podcast/menu/PodcastMenu'
import ContextMenu from '@/components/contextMenu'
import useEpisodeIsMeta from '@/core/components/feed/components/podcast/hooks/useEpisodeIsMeta'

export default () => {
  const { id: paramsId } = useParams()
  const id = paramsId ? Number(paramsId) : undefined
  const podcast = ObjectStore('podcast').useValue(id)
  const [state, setState] = usePodcastState()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLElement>(null)
  const [isFetchingEpisodes, setIsFetching] = useState(false)
  useEffect(() => {
    if (podcast && id) {
      if (!podcast.description) {
        updatePodcastInfo.fetchDescription(id)
      }
      if (!podcast.episodes.length) {
        setIsFetching(true)
        updatePodcastInfo.fetchEpisodes(id).finally(() => setIsFetching(false))
      }
    }
  }, [podcast?.id])

  useEffect(() => {
    if (id) {
      ObjectStore('podcast').updateOne({ id, viewAt: Date.now() })
      usePodcastData.updateData(curr => ({
        ...curr,
        recentlyViewedPodcasts: pushNumberIntoUnrepeatableArray(id, curr.recentlyViewedPodcasts)
      }))
    }
  }, [id])
  const pos = useElementScrollRestore({
    elementKey: 'podcast-episode-list',
    elementRef: containerRef,
    disable: true
  })
  const scrollMargin = (containerRef.current?.querySelector('#episode-list') as HTMLElement | undefined)?.offsetTop ?? 0
  const virtualizer = useVirtualizer({
    getScrollElement: () => containerRef.current,
    estimateSize: () => 110,
    overscan: 10,
    initialOffset: pos ? pos - 11 : 0,
    getItemKey: i => podcast?.episodes[i],
    count: podcast?.episodes.length ?? 0,
    scrollMargin
  })
  const items = virtualizer.getVirtualItems()
  return (
    <Content ref={containerRef} flex fullWidth column style={{ overflowY: 'auto' }} fullHeight>
      <div className={'max-w-7xl mx-auto w-full @container'}>
        <PodcastHeader id={id} />
        <div className={'px-6 mb-2'}>
          <div className={'text-2xl font-semibold pt-6 border-top'}>单集</div>
          {(podcast?.episodes.length ?? 0) > 0 ? <div className={'transparent-font text-sm'}>{podcast?.episodes.length ?? 0}集</div> : null}
        </div>
        <div id={'episode-list'} className={'p-3 pt-0 pb-40 flex flex-col'}>
          {isFetchingEpisodes ? (
            <div className={'flex flex-col gap-2'}>
              {[1, 2, 3, 4].map(i => (
                <EpisodeSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className={'w-full relative'} style={{ height: virtualizer.getTotalSize() }}>
              <div
                className={'absolute top-0 left-0 w-full'}
                style={{
                  transform: `translateY(${(items[0]?.start ?? 0) - scrollMargin}px)`
                }}
              >
                {items.map((i, idx) => {
                  const item = podcast?.episodes[i.index]
                  if (!item) return null
                  return (
                    <EpisodeItem
                      key={item}
                      id={item}
                      idx={i.index}
                      ref={virtualizer.measureElement}
                      onClick={() => {
                        navigate(`/episode/${item}`)
                        setState(s => ({
                          ...s,
                          currentEpisode: item,
                          inlistEpisodes: podcast?.episodes,
                          currentPage: 'episodePlayer'
                        }))
                      }}
                    ></EpisodeItem>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Content>
  )
}

const EpisodeSkeleton = () => {
  return (
    <div className={'animate-pulse gap-2 w-full flex flex-col button !p-2'}>
      <div
        style={{
          maxWidth: 'max(10%, 100px)'
        }}
        className={'w-full h-2 rounded-sm bg-gray-200 dark:bg-gray-700'}
      ></div>
      <div
        style={{
          maxWidth: 'max(40%, 250px)'
        }}
        className={'w-full h-2.5 rounded-sm bg-gray-200 dark:bg-gray-700'}
      ></div>
      <div className={'w-full h-2 rounded-sm bg-gray-200 dark:bg-gray-700'}></div>
      <div className={'w-full h-2 rounded-sm bg-gray-200 dark:bg-gray-700'}></div>
      <div className={'w-full h-2 rounded-sm bg-gray-200 dark:bg-gray-700'}></div>
    </div>
  )
}
const EpisodeItem = memo(
  forwardRef(({ id, onClick, idx }: { id: number; onClick: VoidFunction; idx: number }, ref) => {
    const episode = ObjectStore('episode').useValue(id)
    const isPlaying = usePodcastData().playlist.current === id
    const isMeta = useEpisodeIsMeta(id)
    if (!episode) return null
    const { name, description, releaseDate, duration } = episode

    return (
      <>
        {idx > 0 && <div className={'border-top w-full'}></div>}
        <ContextMenu ref={ref} content={setV => <PodcastMenu id={id} type={'episode'} onClose={() => setV(false)} />}>
          <div data-index={idx} className={'flex gap-2 !rounded-none !px-3 button !py-3'}>
            <Content flex column onClick={onClick} className={'gap-y-0.5 flex-1'}>
              <div className={'transparent-font leading-none flex gap-1 font-medium text-xs'}>
                {isPlaying && <EpisodePlayingIcon className={'mr-1'} />}
                <span>{formatReleaseDate(releaseDate)}</span>
                <span>·</span>
                <span>{formatEpisodeDuration(duration)}</span>
                {isMeta && <Icon className={'ml-1'} name={'park-share-one'} />}
              </div>
              <div className={'line-clamp-1 font-medium mt-0.5'}>{name}</div>
              <div className={'transparent-font text-sm line-clamp-3'}>{description}</div>
            </Content>
            <div>
              <IconWithPopover
                align={'start'}
                placement={['right', 'left']}
                className={'icon-18 !p-1 transparent-font'}
                content={setV => <PodcastMenu id={id} type={'episode'} onClose={() => setV(false)} />}
                name={'park-more'}
              />
            </div>
          </div>
        </ContextMenu>
      </>
    )
  })
)
