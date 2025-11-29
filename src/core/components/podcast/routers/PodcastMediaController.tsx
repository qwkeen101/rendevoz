// unmounted audio
import { useEffect, useMemo, useRef, useState } from 'react'
import Audio from '@/core/components/media/wrappers/Audio'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import { assignProperties, waitFor } from '@/utils'
import { ObjectStore } from '@/api/stores'
import { IMediaInstance } from '~/typings'
import usePodcastState from '@/core/components/podcast/hooks/usePodcastState'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'

export default () => {
  const podcastData = usePodcastData()
  const { playlist } = podcastData
  const { list, current } = playlist
  const instance = usePodcastInstance()
  const audioInstanceRef = useRef<IMediaInstance>()

  assignProperties(instance, {
    actionOps: {
      ...instance.actionOps,
      queueEpisode: id => {
        if (list.includes(id)) {
          if (playlist.current === id) {
            instance.actionOps?.pause?.()
            audioInstanceRef.current?.actionOps?.stopAutoPlay?.()
          }
          usePodcastData.updateData(curr => ({
            ...curr,
            playlist: {
              ...curr.playlist,
              current: curr.playlist.current === id ? curr.playlist.list.filter(i => i !== id)[0] : curr.playlist.current,
              list: curr.playlist.list.filter(i => i !== id)
            }
          }))
        } else {
          usePodcastData.updateData(curr => ({
            ...curr,
            playlist: { ...curr.playlist, list: [id, ...curr.playlist.list], current: curr.playlist.current || id }
          }))
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
        console.log('playing')
        usePodcastData.updateData(s => ({
          ...s,
          history: [{ id, date: Date.now() }, ...(s.history?.filter(i => i.id !== id) || [])],
          playlist: { current: id, list: s.playlist.list.includes(id) ? s.playlist.list : [id, ...s.playlist.list] }
        }))
        waitFor(
          () => !!audioInstanceRef.current,
          async () => {
            const episode = await ObjectStore('episode').fetchOneById(id)
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
  const currentPlayingPodcast = ObjectStore('podcast').useValue(currentPlayingEpisode?.podcastId)
  useEffect(() => {
    if (currentPlayingPodcast && currentPlayingEpisode) {
      if (currentPlayingPodcast.episodes.includes(currentPlayingEpisode.id)) {
        ObjectStore('podcast').updateOne({ id: currentPlayingPodcast.id, lastPlayedEpisode: currentPlayingEpisode.id })
      }
    }
  }, [currentPlayingPodcast?.id, currentPlayingEpisode?.id])
  const navigateState = useMemo(() => {
    if (list.length && current && list.length > 1) {
      const idx = list.findIndex(i => i === current)
      const prev = idx === 0 ? list.length - 1 : idx - 1
      const next = idx === list.length - 1 ? 0 : idx + 1
      const prevItem = list[prev]
      const nextItem = list[next]
      return {
        prev: prevItem === nextItem ? undefined : prevItem,
        next: nextItem
      }
    }
  }, [list, current])
  if (currentPlayingEpisode) {
    return (
      <Audio
        on={e => {
          console.log(e)
          if (e.type === 'playEpisode') {
            instance.actionOps?.playEpisode?.(e.id)
          }
          if (e.type === 'pauseEpisode') {
            instance.actionOps?.pause?.()
          }
          if (e.type === 'currentTimeChanged') {
            ObjectStore('episode').updateOne({ id: currentPlayingEpisode!.id, currentTime: e.currentTime })
          }
          if (e.type === 'onNavigate') {
            if (e.direction === 'next' && navigateState?.next) {
              instance.actionOps?.playEpisode?.(navigateState.next)
            }
            if (e.direction === 'prev' && navigateState?.prev) {
              instance.actionOps?.playEpisode?.(navigateState.prev)
            }
          }
          if (e.type === 'externalStateChange') {
            if (usePodcastState.getState().isPlaying !== !e.state.paused) {
              usePodcastState.setState(curr => ({ ...curr, isPlaying: !e.state.paused }))
            }
          }
          if (e.type === 'playlistChange') {
            usePodcastData.updateData(s => ({ ...s, playlist: { ...s.playlist, list: e.list } }))
          }
        }}
        onInstanceInitialized={i => (audioInstanceRef.current = i)}
        mediaState={{
          layout: {
            audioHeader: false,
            episode: {
              pageContainerRef: instance.bodyRef
            }
          },
          state: {
            episodeId: currentPlayingEpisode.id,
            podcastId: currentPlayingEpisode.podcastId
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
