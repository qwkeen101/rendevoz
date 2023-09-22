import { PlayerCommonProps } from '@/core/video/players/types'
import { useEffect, useRef, useState } from 'react'
import useVideoState from '@/core/video/hooks/useVideoState'
import { toast } from 'react-hot-toast'
import requestVideo from '@/components/fileImporter/baidudisk/requestVideo'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import Player from 'video.js/dist/types/player'
import { useVideoInstance } from '@/core/video/hooks/useVideoInstance'
import { assignProperties } from '@/utils'
import { captureVideoFrame } from '@/core/video/utils'
import loginBaidudisk from '@/components/fileImporter/baidudisk/loginBaidudisk'
import { useUnmount } from 'react-use'

const BaidudiskVideoPlayer = ({ url }: PlayerCommonProps) => {
  const [videoState, setVideoState] = useVideoState()
  const [m3u8Source, setM3u8Source] = useState('')
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player>()
  const instance = useVideoInstance()
  const player = playerRef.current
  const createdTextTrackRef = useRef<HTMLTrackElement>()
  if (player) {
    assignProperties(instance, {
      captureCurrentImage: async () => {
        const video = videoContainerRef.current?.querySelector('video')
        if (video) {
          const image = await captureVideoFrame(video, videoState.currentTime || 0, { width: 1600, height: 900 }, true)
          return image
        }
      }
    })
  }
  useEffect(() => {
    if (player) {
      player.volume(videoState.volume)
    }
  }, [videoState.volume, videoState.loaded])

  useEffect(() => {
    if (videoState.loaded) {
      player?.playbackRate(videoState.speed)
    }
  }, [videoState.speed, videoState.loaded])

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
        autoplay: videoState.autoPlay,
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
      setVideoState(s => ({ ...s, loaded: true }))
      player.on('timeupdate', () => {
        const currentTime = player.currentTime()
        if (currentTime !== undefined && currentTime >= 0) {
          setVideoState(s => ({ ...s, currentTime }))
        }
      })
      player.on('durationchange', () => {
        const duration = player.duration()
        if (duration !== undefined && duration >= 0) {
          setVideoState(s => ({ ...s, totalTime: duration }))
        }
      })
      playerRef.current = player
      player.addTextTrack()
    } else {
      setVideoState(s => ({ ...s, loaded: false }))
    }
  }, [m3u8Source])

  useEffect(() => {
    if (videoState.loaded) {
      player?.autoplay(videoState.autoPlay)
    }
  }, [videoState.autoPlay, videoState.loaded])
  useUnmount(() => {
    player?.dispose()
  })
  useEffect(() => {
    if (videoState.loaded && videoState.subtitleUrl && videoState.showSubtitle) {
      const track = document.createElement('track')
      track.src = videoState.subtitleUrl
      track.default = true
      track.kind = 'captions'
      createdTextTrackRef.current = track
      videoContainerRef.current?.querySelector('video')?.appendChild(track)
    }
    if (videoState.showSubtitle === false && createdTextTrackRef.current) {
      createdTextTrackRef.current?.remove()
      createdTextTrackRef.current = undefined
    }
  }, [videoState.subtitleUrl, videoState.loaded, videoState.showSubtitle])
  useEffect(() => {
    if (videoState.loaded) {
      if (videoState.paused) {
        player?.pause()
      } else {
        player?.play()
      }
    }
  }, [videoState.paused, videoState.loaded])

  useEffect(() => {
    console.log(videoState.jumpTime, videoState.currentTime)
    if (videoState.loaded && videoState.jumpTime !== undefined && player) {
      if (Math.abs(videoState.jumpTime - (videoState.currentTime || 0)) > 1) {
        console.log(videoState.jumpTime, videoState.currentTime)
        player.currentTime(videoState.jumpTime)
      }
    }
  }, [videoState.jumpTime, videoState.loaded])
  return (
    <div
      onClick={() => {
        setVideoState(s => ({ ...s, paused: !s.paused }))
      }}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      ref={videoContainerRef}
    ></div>
  )
}

export default BaidudiskVideoPlayer
