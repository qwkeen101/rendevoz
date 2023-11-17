import { PlayerCommonProps } from '@/core/components/media/players/types'
import { useEffect, useRef, useState } from 'react'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import { toast } from 'react-hot-toast'
import requestVideo from '@/components/fileImporter/baidudisk/requestVideo'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import Player from 'video.js/dist/types/player'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { assignProperties } from '@/utils'
import { captureVideoFrame } from '@/core/components/media/utils'
import loginBaidudisk from '@/components/fileImporter/baidudisk/loginBaidudisk'
import { useUnmount } from 'react-use'

const BaidudiskVideoPlayer = () => {
  const [mediaState, setMediaState] = useMediaState()
  const [m3u8Source, setM3u8Source] = useState('')
  const { url } = mediaState
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player>()
  const instance = useMediaInstance()
  const player = playerRef.current
  const createdTextTrackRef = useRef<HTMLTrackElement>()
  if (player) {
    assignProperties(instance, {
      imageOps: {
        captureCurrentImage: async () => {
          const video = videoContainerRef.current?.querySelector('video')
          if (video) {
            const image = await captureVideoFrame(video, mediaState.currentTime || 0, { width: 1600, height: 900 }, true)
            return image
          }
        }
      }
    })
  }
  useEffect(() => {
    if (player) {
      player.volume(mediaState.volume)
    }
  }, [mediaState.volume, mediaState.loaded])

  useEffect(() => {
    if (mediaState.loaded) {
      player?.playbackRate(mediaState.speed)
    }
  }, [mediaState.speed, mediaState.loaded])

  useEffect(() => {
    const bda = localStorage.getItem('bda')
    if (!bda) {
      loginBaidudisk()
      toast.error('身份验证已失效，请重新登录网盘后再打开')
    } else {
      const path = url.replace('baidudisk', '')
      requestVideo(path).then(res => {
        setM3u8Source(res.data)
      })
    }
  }, [url])

  useEffect(() => {
    if (m3u8Source && videoContainerRef.current) {
      const videoEle = document.createElement('video-js')
      videoEle.classList.add('vjs-big-play-centered')
      videoContainerRef.current.appendChild(videoEle)
      const blob = new Blob([m3u8Source], { type: 'application/x-mpegURL' })
      const url = URL.createObjectURL(blob)
      const player = videojs(videoEle, {
        autoplay: mediaState.autoPlay,
        controls: false,
        fluid: true,
        aspectRatio: '16:9',
        sources: [
          {
            src: url,
            type: 'application/x-mpegURL'
          }
        ]
      })
      setMediaState(s => ({ ...s, loaded: true }))
      player.on('timeupdate', () => {
        const currentTime = player.currentTime()
        if (currentTime !== undefined && currentTime >= 0) {
          setMediaState(s => ({ ...s, currentTime }))
        }
      })
      player.on('durationchange', () => {
        const duration = player.duration()
        if (duration !== undefined && duration >= 0) {
          setMediaState(s => ({ ...s, totalTime: duration }))
        }
      })
      playerRef.current = player
      player.addTextTrack()
    } else {
      setMediaState(s => ({ ...s, loaded: false }))
    }
  }, [m3u8Source])

  useEffect(() => {
    if (mediaState.loaded) {
      player?.autoplay(mediaState.autoPlay)
    }
  }, [mediaState.autoPlay, mediaState.loaded])
  useUnmount(() => {
    player?.dispose()
  })
  useEffect(() => {
    console.log(mediaState.subtitleUrl)
    if (mediaState.loaded && mediaState.subtitleUrl && mediaState.showSubtitle) {
      const track = document.createElement('track')
      track.src = mediaState.subtitleUrl
      track.default = true
      track.kind = 'captions'
      createdTextTrackRef.current = track
      videoContainerRef.current?.querySelector('video')?.appendChild(track)
      return () => {
        createdTextTrackRef.current?.remove()
        createdTextTrackRef.current = undefined
      }
    }
  }, [mediaState.subtitleUrl, mediaState.loaded, mediaState.showSubtitle])
  useEffect(() => {
    if (mediaState.loaded) {
      if (mediaState.paused) {
        player?.pause()
      } else {
        player?.play()
      }
    }
  }, [mediaState.paused, mediaState.loaded])

  useEffect(() => {
    if (mediaState.loaded && mediaState.jumpTime !== undefined && player) {
      if (Math.abs(mediaState.jumpTime - (mediaState.currentTime || 0)) > 1) {
        player.currentTime(mediaState.jumpTime)
      }
    }
  }, [mediaState.jumpTime, mediaState.loaded])
  return (
    <div
      onClick={() => {
        setMediaState(s => ({ ...s, paused: !s.paused }))
      }}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      ref={videoContainerRef}
    ></div>
  )
}

export default BaidudiskVideoPlayer
