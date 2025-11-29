// unmounted audio
import { useRef, useState } from 'react'
import Audio from '@/core/components/media/wrappers/Audio'
import usePodcastInstance from '@/core/components/feed/components/podcast/usePodcastInstance'
import { assignProperties, waitFor } from '@/utils'
import { ObjectStore } from '@/api/stores'
import { IMediaInstance } from '~/typings'
import usePodcastState from '@/core/components/feed/components/podcast/usePodcastState'
import useNorepeatNavigate from '@/core/components/feed/components/podcast/useNorepeatNavigate'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'

export default () => {
  const podcastData = usePodcastData()
  const { playlist } = podcastData
  const { list, current } = playlist
  const instance = usePodcastInstance()
  const audioInstanceRef = useRef<IMediaInstance>()
  const navigate = useNorepeatNavigate()
  assignProperties(instance, {
    actionOps: {
      ...instance.actionOps,
      queueEpisode: id => {
        if (list.includes(id)) {
          usePodcastData.updateData(curr => ({ ...curr, playlist: { ...curr.playlist, list: curr.playlist.list.filter(i => i !== id) } }))
        } else {
          usePodcastData.updateData(curr => ({ ...curr, playlist: { ...curr.playlist, list: [id, ...curr.playlist.list] } }))
        }
      },
      jumpToEpisodeTime: (e, t) => {
        instance.actionOps?.playEpisode?.(e)
        waitFor(
          () => !!audioInstanceRef.current,
          () => {
            audioInstanceRef.current?.actionOps?.jumpTo(t)
          }
        )
      },
      pause: () => {
        waitFor(
          () => !!audioInstanceRef.current,
          () => {
            audioInstanceRef.current?.actionOps?.pause()
          }
        )
      },
      playEpisode: episode => {
        const id = typeof episode === 'number' ? episode : episode?.id
        if (!id) return
        usePodcastData.updateData(s => ({
          ...s,
          playlist: { current: id, list: [id, ...s.playlist.list.filter(i => i !== id)] }
        }))
        waitFor(
          () => !!audioInstanceRef.current,
          async () => {
            console.log('yea')
            const episode = await ObjectStore('episode').fetchOneById(id)
            console.log(episode)
            if (episode?.currentTime !== undefined) {
              audioInstanceRef.current?.setMediaState?.(s => ({ ...s, currentTime: episode.currentTime }))
            }
            audioInstanceRef.current?.actionOps?.autoPlay?.()
            audioInstanceRef.current?.actionOps?.play()
          },
          {
            timeout: 999999
          }
        )
      }
    }
  })
  const currentPlayingEpisode = ObjectStore('episode').useValue(current)
  if (currentPlayingEpisode) {
    return (
      <Audio
        on={e => {
          if (e.type === 'playEpisode') {
            instance.actionOps?.playEpisode?.(e.id)
          }
          if (e.type === 'viewEpisode' && currentPlayingEpisode) {
            navigate(`/episode/${currentPlayingEpisode.id}`)
          }
          if (e.type === 'currentTimeChanged') {
            ObjectStore('episode').updateOne({ id: currentPlayingEpisode!.id, currentTime: e.currentTime })
          }
          if (e.type === 'externalStateChange') {
            if (usePodcastState.getState().isPlaying !== !e.state.paused) {
              usePodcastState.setState(curr => ({ ...curr, isPlaying: !e.state.paused }))
            }
          }
          if (e.type === 'playlistChange') {
            if (currentPlayingEpisode?.id) {
              e.list = [currentPlayingEpisode.id, ...e.list]
            }
            usePodcastData.updateData(s => ({ ...s, playlist: { ...s.playlist, list: e.list } }))
          }
        }}
        onInstanceInitialized={i => (audioInstanceRef.current = i)}
        mediaState={{
          layout: {
            floatBarMode: true,
            audioHeader: false,
            floatbarPlaylist: list.filter(i => i !== currentPlayingEpisode.id)
          },
          currentTime: currentPlayingEpisode.currentTime,
          name: currentPlayingEpisode.name,
          url: currentPlayingEpisode.enclosureURL,
          releaseDate: currentPlayingEpisode.releaseDate,
          thumbnail: currentPlayingEpisode.thumbnail,
          description: currentPlayingEpisode.description
        }}
      />
    )
  }
}
