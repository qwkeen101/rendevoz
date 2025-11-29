import { useEffect, useRef, useState } from 'react'
import { useGetMediaState, useSelectMediaState, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { toast } from 'react-hot-toast'
import requestVideo from '@/api/components/objectImporter/baidudisk/requestVideo'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import Player from 'video.js/dist/types/player'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { assignProperties } from '@/utils'
import { captureVideoFrame } from '@/core/components/media/utils'
import loginBaidudisk from '@/api/components/objectImporter/baidudisk/loginBaidudisk'
import { useUnmount } from 'react-use'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import getBaidudiskSubtitles from '@/api/components/objectImporter/baidudisk/getBaidudiskSubtitles'
import useThrottleUpdateCurrentTime from '@/core/components/media/hooks/useThrottleUpdateCurrentTime'

const BaidudiskVideoPlayer = () => {
  const setMediaState = useSetMediaState()
  const [m3u8Source, setM3u8Source] = useState('')
  const get = useGetMediaState()
  const updateTime = useThrottleUpdateCurrentTime()
  const { url, muted, volume, loaded, speed, autoPlay, showSubtitle, subtitleUrl, paused, jumpTime } = useSelectMediaState(s => ({
    url: s.url,
    volume: s.volume,
    muted: s.muted,
    loaded: s.loaded,
    speed: s.speed,
    autoPlay: s.autoPlay,
    subtitleUrl: s.subtitleUrl,
    showSubtitle: s.showSubtitle,
    paused: s.paused,
    jumpTime: s.jumpTime
  }))
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
            const image = await captureVideoFrame(video, get().currentTime || 0, { width: 1600, height: 900 }, true)
            return image
          }
        }
      },
      getMediaContainer: () => {
        return videoContainerRef.current || undefined
      }
    })
  }
  useEffect(() => {
    if (player) {
      player.muted(muted)
      player.volume(volume)
    }
  }, [volume, loaded, muted])

  useEffect(() => {
    if (loaded) {
      player?.playbackRate(speed)
    }
  }, [speed, loaded])

  useEffect(() => {
    const bda = KeyvalueStore.getOne('baiduAccessToken')
    if (!bda) {
      loginBaidudisk()
      toast.error('身份验证已失效，请重新登录网盘后再打开')
    } else {
      const path = url.replace('baidudisk', '')
      if (!get().subtitleList?.length) {
        getBaidudiskSubtitles(path).then(res => {
          if (res) {
            setMediaState(s => ({ ...s, subtitleList: res, subtitleLang: res[0].lang }))
          }
        })
      }
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
        autoplay: get().autoPlay,
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
      player.on('loadeddata', () => {
        setMediaState(s => ({ ...s, loaded: true }))
      })

      player.on('timeupdate', () => {
        const currentTime = player.currentTime()
        if (currentTime !== undefined && currentTime >= 0) {
          updateTime(currentTime)
        }
      })
      player.on('durationchange', () => {
        const duration = player.duration()
        if (duration !== undefined && duration >= 0) {
          setMediaState(s => ({ ...s, totalTime: duration }))
        }
      })
      playerRef.current = player
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setMediaState(s => ({ ...s, loaded: false }))
    }
  }, [m3u8Source])

  useEffect(() => {
    if (loaded) {
      player?.autoplay(autoPlay)
    }
  }, [autoPlay, loaded])
  useUnmount(() => {
    playerRef.current?.dispose()
  })
  useEffect(() => {
    if (loaded && subtitleUrl && showSubtitle) {
      const track = document.createElement('track')
      track.src = subtitleUrl
      track.default = true
      track.kind = 'captions'
      createdTextTrackRef.current = track
      videoContainerRef.current?.querySelector('video')?.appendChild(track)
      return () => {
        createdTextTrackRef.current?.remove()
        createdTextTrackRef.current = undefined
      }
    }
  }, [subtitleUrl, loaded, showSubtitle])
  useEffect(() => {
    if (loaded) {
      if (paused) {
        player?.pause()
      } else {
        player?.play()
      }
    }
  }, [paused, loaded])

  useEffect(() => {
    const current = get()
    if (loaded && current.currentTime !== undefined && current.jumpTime === undefined && player) {
      player.currentTime(current.currentTime)
    }
  }, [loaded])

  useEffect(() => {
    if (loaded && jumpTime !== undefined && player) {
      player.currentTime(jumpTime)
    }
  }, [jumpTime, loaded])
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
