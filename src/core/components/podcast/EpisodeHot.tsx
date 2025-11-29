import usePodcastState from '@/core/components/feed/components/podcast/usePodcastState'
import { useEffect } from 'react'
import PodcastList from '@/core/components/feed/components/podcast/PodcastList'
import usePodcastInstance from '@/core/components/feed/components/podcast/usePodcastInstance'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'

export default () => {
  const episodes = usePodcastData().dashboard?.episodes ?? []
  const instance = usePodcastInstance()
  useEffect(() => {
    usePodcastState.apis.fetchHotAndEpisodes({
      hot: false
    })
  }, [])
  return (
    <PodcastList
      items={episodes}
      onClick={i => {
        instance.actionOps?.openItunesEpisode?.(i)
      }}
    />
  )
}
