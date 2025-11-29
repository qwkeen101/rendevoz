import { memo, useEffect, useState } from 'react'
import { Content, Icon } from '@/components'
import { IEpisode } from '@/core/components/feed/components/podcast/types'
import usePodcastState from '@/core/components/feed/components/podcast/usePodcastState'
import Audio from '@/core/components/media/wrappers/Audio'
import EpisodeHeaderExtra from '@/core/components/feed/components/podcast/EpisodeHeaderExtra'
import { ObjectStore } from '@/api/stores'
import toast from 'react-hot-toast'
import usePodcastInstance from '@/core/components/feed/components/podcast/usePodcastInstance'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'
import { pushNumberIntoUnrepeatableArray } from '@/utils'
import { useParams } from 'react-router-dom'

export default memo(() => {
  const { id: paramsId } = useParams()
  const id = paramsId ? Number(paramsId) : undefined
  const episode = ObjectStore('episode').useValue(id)
  const podcastState = usePodcastState()[0]
  const inlistEpisodes = podcastState.inlistEpisodes
  const instance = usePodcastInstance()
  const playlist = usePodcastData().playlist
  const isPlaying = podcastState.isPlaying && playlist.current === id
  const currentPodcast = ObjectStore('podcast').useValue(episode?.podcastId)
  useEffect(() => {
    if (episode && !episode.description && episode.itunesURL) {
      const url = episode.itunesURL
      fetch(url)
        .then(i => i.text())
        .then(text => {
          const page = new DOMParser().parseFromString(text, 'text/html')
          const data = page.querySelector('#shoebox-media-api-cache-amp-podcasts')
          if (data) {
            try {
              const parsed = JSON.parse(data.innerHTML)
              const res = JSON.parse(Object.values(parsed)[0])
              const details = res.d[0].attributes as {
                releaseDateTime: Date
                assetUrl: string
                description: { standard: string }
                durationInMilliseconds: number
                name: string
              }
              ObjectStore('episode').updateOne({
                id,
                enclosureURL: details.assetUrl,
                releaseDate: new Date(details.releaseDateTime).getTime(),
                duration: details.durationInMilliseconds / 1000,
                description: details.description.standard
              })
            } catch (e) {
              toast.error('Failed to fetch episode details!')
              console.error(e)
            }
          }
        })
    }
  }, [episode?.id])
  useEffect(() => {
    if (id) {
      usePodcastData.updateData(curr => ({
        ...curr,
        recentlyViewedEpisodes: pushNumberIntoUnrepeatableArray(id, curr.recentlyViewedEpisodes)
      }))
    }
  }, [id])
  return (
    <div className={'grow overflow-hidden'}>
      <Audio
        on={e => {
          if (id) {
            if (e.type === 'audioPlayButtonClicked') {
              if (isPlaying) {
                instance.actionOps?.pause?.()
              } else {
                instance.actionOps?.playEpisode?.(id)
              }
            }
            if (e.type === 'jump') {
              instance.actionOps?.jumpToEpisodeTime?.(id, e.time)
            }
            if (e.type === 'episodeStarred') {
              instance.dataOps?.star?.(id, 'episode')
            }
            if (e.type === 'episodeFollowed') {
              instance.dataOps?.follow?.(id, 'episode')
            }
          }
        }}
        mediaState={{
          muted: true,
          name: episode?.name,
          url: episode?.enclosureURL,
          releaseDate: episode?.releaseDate,
          thumbnail: episode?.thumbnail,
          totalTime: episode?.duration,
          description: episode?.description,
          state: {
            followed: episode?.followed,
            starred: episode?.starred,
            isPlaying
          },
          layout: {
            episodeMode: true,
            audioHeaderExtra: <EpisodeHeaderExtra id={episode?.id} podcast={currentPodcast} episodes={inlistEpisodes} />
          }
        }}
      />
    </div>
  )
})
