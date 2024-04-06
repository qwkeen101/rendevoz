import useMediaState from '@/core/components/media/hooks/useMediaState'
import { useEffect, useRef } from 'react'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { assignProperties } from '@/utils'
import { captureVideoFrame } from '@/core/components/media/utils'
import audioBufferToWav from '@/core/components/media/players/audioBufferToWav'

const LocalVideoPlayer = () => {
  const [mediaState, setMediaState] = useMediaState()
  const ref = useRef<HTMLVideoElement>(null)
  const instance = useMediaInstance()
  const { paused, speed, loaded, volume, jumpTime, url } = mediaState
  const v = ref.current
  useEffect(() => {
    setMediaState(s => ({ ...s, url }))
  }, [url])

  assignProperties(instance, {
    getAudioFile: async () => {
      const res = await fetch(mediaState.url).then(res => res.arrayBuffer())
      const audioCtx = new AudioContext()
      const audio = await audioCtx.decodeAudioData(res)
      const blob = audioBufferToWav(audio)
      return new Blob([blob], { type: 'audio/wav' })
    },
    getMediaContainer: () => {
      return ref.current || undefined
    },
    imageOps: {
      captureCurrentImage: async () => {
        return ref.current && (await captureVideoFrame(ref.current, mediaState.currentTime || 0, { width: 1600, height: 900 }, true))
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
    if (loaded && v && mediaState.currentTime !== undefined) {
      v.currentTime = mediaState.currentTime
    }
  }, [loaded])
  useEffect(() => {
    if (loaded && v) {
      v.volume = volume
    }
  }, [loaded, volume])

  useEffect(() => {
    if (loaded && v) {
      v.playbackRate = speed
    }
  }, [loaded, speed])

  useEffect(() => {
    if (loaded && mediaState.autoPlay && v) {
      v.play()
    }
  }, [loaded, mediaState.autoPlay])
  return (
    <video
      ref={ref}
      src={url}
      loop={mediaState.loop}
      muted={mediaState.muted}
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
        const currTime = e.currentTarget.currentTime
        setTimeout(() => {
          setMediaState(s => ({ ...s, currentTime: currTime }))
        })
      }}
      onLoad={() => {
        console.log('load')
        setMediaState(s => ({ ...s, loaded: true }))
      }}
      onLoadedData={() => {
        console.log('load')
        setMediaState(s => ({ ...s, loaded: true }))
      }}
    >
      {mediaState.subtitleUrl && mediaState.showSubtitle !== false && <track src={mediaState.subtitleUrl} kind="captions" default />}
    </video>
  )
}

export default LocalVideoPlayer
