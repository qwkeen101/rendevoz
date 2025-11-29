import { useGetMediaState, useSelectMediaState, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { memo, useEffect, useRef } from 'react'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { assignProperties } from '@/utils'
import { captureVideoFrame } from '@/core/components/media/utils'
import useThrottleUpdateCurrentTime from '@/core/components/media/hooks/useThrottleUpdateCurrentTime'

const LocalVideoPlayer = memo(() => {
  const setMediaState = useSetMediaState()
  const ref = useRef<HTMLVideoElement>(null)
  const instance = useMediaInstance()
  const get = useGetMediaState()
  const updateTime = useThrottleUpdateCurrentTime()
  const { paused, speed, loaded, volume, jumpTime, url, autoPlay, loop, muted, showSubtitle, subtitleUrl } = useSelectMediaState(s => ({
    paused: s.paused,
    speed: s.speed,
    loaded: s.loaded,
    volume: s.volume,
    jumpTime: s.jumpTime,
    url: s.url,
    autoPlay: s.autoPlay,
    loop: s.loop,
    muted: s.muted,
    subtitleUrl: s.subtitleUrl,
    showSubtitle: s.showSubtitle
  }))
  const v = ref.current
  useEffect(() => {
    setMediaState(s => ({ ...s, url }))
  }, [url])

  assignProperties(instance, {
    getMediaContainer: () => {
      return ref.current || undefined
    },
    imageOps: {
      captureCurrentImage: async () => {
        return ref.current ? await captureVideoFrame(ref.current, get().currentTime || 0, { width: 1600, height: 900 }, true) : undefined
      }
    }
  })
  useEffect(() => {
    if (v && loaded) {
      if (paused) {
        v.pause()
      } else {
        v.play()
      }
    }
  }, [paused, loaded])

  useEffect(() => {
    if (loaded && v && jumpTime !== undefined) {
      v.currentTime = jumpTime
    }
  }, [loaded, jumpTime])
  useEffect(() => {
    const currentTime = get().currentTime
    if (loaded && v && currentTime !== undefined) {
      v.currentTime = currentTime
    }
  }, [loaded])
  useEffect(() => {
    if (loaded && v && volume !== undefined) {
      v.volume = volume
    }
  }, [loaded, volume])

  useEffect(() => {
    if (loaded && v && speed !== undefined) {
      v.playbackRate = speed
    }
  }, [loaded, speed])

  useEffect(() => {
    if (loaded && autoPlay && v) {
      v.play()
    }
  }, [loaded, autoPlay])
  return (
    <video
      ref={ref}
      src={url}
      loop={loop}
      muted={muted}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'clip',
        overflowClipMargin: 'content-box',
        objectFit: 'contain'
      }}
      onClick={() => {
        setMediaState(s => ({ ...s, paused: !s.paused }))
      }}
      onDurationChange={e => {
        const duration = e.currentTarget.duration
        if (duration) {
          setTimeout(() => {
            setMediaState(s => ({ ...s, totalTime: duration }))
          })
        }
      }}
      onTimeUpdate={e => {
        updateTime(e.currentTarget.currentTime)
      }}
      onLoad={() => {
        setMediaState(s => ({ ...s, loaded: true }))
      }}
    >
      {subtitleUrl && showSubtitle !== false && <track src={subtitleUrl} kind="captions" default />}
    </video>
  )
})

export default LocalVideoPlayer
