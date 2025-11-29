import usePodcastState from '@/core/components/podcast/hooks/usePodcastState'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import Audio from '@/core/components/media/wrappers/Audio'
import { ObjectStore } from '@/api/stores'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import { useMemo } from 'react'

export default () => {
  const [state, setState] = usePodcastState()
  const data = usePodcastData()
  const { list, current } = data.playlist
  const currentEpisode = ObjectStore('episode').useValue(state.focusEpisode)
  const podcast = ObjectStore('podcast').useValue(currentEpisode?.podcastId)
  const moreEpisodeIds = useMemo(() => {
    if (currentEpisode && podcast) {
      const idx = podcast?.episodes.findIndex(i => i === currentEpisode.id)
      if (idx >= 0) {
        let sliced = podcast.episodes.slice(idx - 6, idx).reverse()
        if (sliced.length < 6) {
          sliced = podcast.episodes.slice(idx + 1, idx + 7)
        }
        return sliced
      }
    }
    return []
  }, [currentEpisode, podcast])
  const moreEpisode = ObjectStore('episode').useMultiple(moreEpisodeIds)
  const instance = usePodcastInstance()
  return (
    <Audio
      mediaState={{
        name: currentEpisode?.name ?? '',
        thumbnail: currentEpisode?.thumbnail,
        description: currentEpisode?.description,
        url: currentEpisode?.enclosureURL,
        websiteUrl: currentEpisode?.itunesURL,
        state: {
          episodePlaylist: {
            items: list,
            current
          },
          follow: {
            onFollow: () => {
              if (currentEpisode) {
                instance.dataOps?.follow?.(currentEpisode.id, 'episode')
              }
            },
            followed: currentEpisode?.followed
          },
          releaseTime: currentEpisode?.releaseDate,
          moreEpisodes: moreEpisode.map(i => ({
            name: i.name || '',
            id: i.id,
            thumbnail: i.thumbnail,
            onNavigate: () => {
              instance.actionOps?.focusEpisode(i.id)
            }
          })),
          podcast: {
            name: podcast?.name ?? '',
            onNavigate: () => {
              if (podcast) {
                setState(s => ({ ...s, isFocusing: false }))
                instance.actionOps?.openPodcast(podcast.id)
              }
            }
          }
        },
        layout: {
          focusMode: {
            onClose: () => {
              setState(s => ({ ...s, isFocusing: false }))
            },
            style: {
              transform: state.isFocusing ? 'translateY(0px)' : 'translateY(100%)',
              transition: 'transform 0.3s ease'
            }
          }
        }
      }}
    />
  )
}
