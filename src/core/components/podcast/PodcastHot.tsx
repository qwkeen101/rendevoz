import usePodcastState from '@/core/components/feed/components/podcast/usePodcastState'
import { useEffect } from 'react'
import PodcastList from '@/core/components/feed/components/podcast/PodcastList'
import usePodcastInstance from '@/core/components/feed/components/podcast/usePodcastInstance'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'

export default () => {
  const podcasts = usePodcastData().dashboard?.hot || []
  const instance = usePodcastInstance()
  useEffect(() => {
    usePodcastState.apis.fetchHotAndEpisodes({
      episodes: false
    })
  }, [])
  return (
    <PodcastList
      items={podcasts}
      onClick={i => {
        instance.actionOps?.openItunesPodcast?.(i)
      }}
    />
  )
}
