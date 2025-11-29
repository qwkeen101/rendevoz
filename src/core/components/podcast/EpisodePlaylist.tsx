import { ObjectStore } from '@/api/stores'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import formatReleaseDate from '@/core/components/podcast/utils/formatReleaseDate'
import { useNorepeatNavigate } from '@/hooks'
import ContextMenu from '@/components/contextMenu'
import PodcastMenu from '@/core/components/podcast/menu/PodcastMenu'
import { useMemo, useRef } from 'react'
import EpisodePlayingIcon from '@/core/components/podcast/components/EpisodePlayingIcon'
import { useTranslation } from 'react-i18next'
import ImageTitleItem from '@/core/components/common/ImageTitleItem'
import { css } from '@emotion/css'
import { useElementScrollRestore } from '@/components'
export default () => {
  const list = usePodcastData().playlist.list
  const { t } = useTranslation()
  const playlist = list
  const ref = useRef<HTMLDivElement>(null)
  useElementScrollRestore({
    elementRef: ref,
    direction: 'horizontal',
    elementKey: 'podcast-dashboard-episode-list'
  })
  if (!playlist.length) return null
  return (
    <>
      <div className={'w-fit font-bold text-2xl mt-8 mb-5'}>
        <div>{t('podcast.Playlist')}</div>
      </div>
      <div ref={ref} className={'no-scrollbar overflow-x-auto flex gap-5 -mr-7 pr-7 snap-x shrink-0 snap-mandatory'}>
        {playlist.map(i => (
          <Item id={i} key={i} />
        ))}
      </div>
    </>
  )
}

const Item = ({ id }: { id: number }) => {
  const episode = ObjectStore('episode').useValue(id)
  const playlist = usePodcastData().playlist
  const isPlaying = playlist.current === id
  const navigate = useNorepeatNavigate()
  if (!episode) return null
  let name = ''
  let result = <></>
  if (!episode.currentTime) {
  } else if (episode.duration) {
    name = (
      <span>
        {normalizeSecondsToTime(episode.currentTime)} / {normalizeSecondsToTime(episode.duration)}
      </span>
    )
  }
  if (episode.releaseDate && !(episode.duration && episode.currentTime)) {
    result = (
      <div className={'flex gap-1'}>
        {name}
        {name && <span>·</span>}
        <span>{formatReleaseDate(episode.releaseDate)}</span>
      </div>
    )
  } else {
    result = name
  }
  return (
    <ContextMenu content={setV => <PodcastMenu onClose={() => setV(false)} id={episode.id} type="episode" />}>
      <ImageTitleItem
        onClick={() => {
          navigate(`/episode/${episode.id}`)
        }}
        description={episode.description}
        descriptionClassName={'font-size-11 mt-0.5'}
        imageStyle={{ aspectRatio: 1 }}
        className={'snap-start !rounded-xl shrink-0 !w-72 !h-72'}
        id={`${episode.id}`}
        image={episode.thumbnail}
        aboveTitle={
          <div className={'text-white gap-1.5 flex font-size-11 mb-1'}>
            {isPlaying && (
              <EpisodePlayingIcon
                className={css({
                  marginBottom: '0.4em',
                  span: {
                    background: 'white !important'
                  }
                })}
              />
            )}
            {result}
          </div>
        }
        titleStyle={{ fontSize: '1rem' }}
        title={episode.name}
      />
    </ContextMenu>
  )
}
