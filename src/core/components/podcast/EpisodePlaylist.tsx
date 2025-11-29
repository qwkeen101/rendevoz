import { ObjectStore } from '@/api/stores'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import formatReleaseDate from '@/core/components/feed/components/podcast/utils/formatReleaseDate'
import useNorepeatNavigate from '@/core/components/feed/components/podcast/useNorepeatNavigate'
import ContextMenu from '@/components/contextMenu'
import PodcastMenu from '@/core/components/feed/components/podcast/menu/PodcastMenu'
import { useMemo } from 'react'
import EpisodePlayingIcon from '@/core/components/feed/components/podcast/components/EpisodePlayingIcon'
export default () => {
  const list = usePodcastData().playlist.list
  const playlist = useMemo(() => list, [list.length])
  if (!playlist.length) return null
  return (
    <>
      <div className={'w-fit text-2xl flex items-center pl-1.5 mt-4 gap-2'}>
        <div>Playlist</div>
      </div>
      <div className={'no-scrollbar overflow-x-auto flex gap-5 -mr-6 pt-3 pr-6 pl-1.5 scroll-pl-1.5 snap-x shrink-0 snap-mandatory'}>
        {playlist.map(i => (
          <Item id={i} key={i} />
        ))}
      </div>
    </>
  )
}

const Item = ({ id }: { id: number }) => {
  const episode = ObjectStore('episode').useValue(id)
  const podcast = ObjectStore('podcast').useValue(episode?.podcastId)
  const navigate = useNorepeatNavigate()
  const playlist = usePodcastData().playlist
  const isPlaying = playlist.current === id
  if (!episode) return null
  let name = <span>Newly added</span>
  let result = <></>
  if (!episode.currentTime) {
  } else if (episode.duration) {
    name = (
      <span>
        {normalizeSecondsToTime(episode.currentTime)}/{normalizeSecondsToTime(episode.duration)}
      </span>
    )
  }
  if (episode.releaseDate) {
    result = (
      <div className={'flex gap-1'}>
        {name}
        <span>·</span>
        <span>{formatReleaseDate(episode.releaseDate)}</span>
      </div>
    )
  } else {
    result = name
  }
  return (
    <ContextMenu content={setV => <PodcastMenu onClose={() => setV(false)} id={episode.id} type="episode" />}>
      <div className={'flex flex-col snap-start gap-2 shrink-0'}>
        {episode.thumbnail && (
          <img
            onClick={() => navigate(`/episode/${episode.id}`)}
            src={episode.thumbnail}
            className={'object-cover cursor-pointer mb-1 hover:scale-[1.01] transition-transform rounded-md w-[240px] h-[240px] shadow-lg'}
          />
        )}
        <div className={'max-w-[240px] flex flex-col gap-1'}>
          <div className={'flex gap-1 items-baseline'}>
            {isPlaying && <EpisodePlayingIcon />}
            <div className={'transparent-font text-xs font-mono font-medium'}>{result}</div>
          </div>
          <div className={'line-clamp-2 hover:underline cursor-pointer text-base'} onClick={() => navigate(`/episode/${episode.id}`)}>
            {episode.name}
          </div>
          {podcast && (
            <div className={'select-color-font hover:underline cursor-pointer text-sm'} onClick={() => navigate(`/podcast/${podcast.id}`)}>
              {podcast.name}
            </div>
          )}
        </div>
      </div>
    </ContextMenu>
  )
}
