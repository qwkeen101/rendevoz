import useVideoState from '@/core/video/hooks/useVideoState'
import { useEffect, useRef } from 'react'
import { useVideoInstance } from '@/core/video/hooks/useVideoInstance'
import { assignProperties } from '@/utils'

const LocalVideoPlayer = ({ url }: { url: string }) => {
  const [videoState, setVideoState] = useVideoState()
  const ref = useRef<HTMLVideoElement>(null)
  const offscreenVideoRef = useRef<HTMLVideoElement>()
  const instance = useVideoInstance()
  const { paused, speed, loaded, volume, jumpTime } = videoState
  const v = ref.current
  useEffect(() => {
    setVideoState(s => ({ ...s, url }))
    if (url) {
      const video = document.createElement('video')
      video.src = url
      offscreenVideoRef.current = video
      assignProperties(instance, {
        getOffscreenVideo: () => video
      })
    }
  }, [url])
  useEffect(() => {
    if (v) {
      if (paused) {
        v.pause()
      } else {
        v.play()
      }
    }
  }, [paused, loaded])

  useEffect(() => {
    if (loaded && v && jumpTime) {
      v.currentTime = jumpTime
    }
  }, [loaded, jumpTime])
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
  return (
    <video
      ref={ref}
      src={url}
      loop={videoState.loop}
      autoPlay={videoState.autoPlay}
      muted={videoState.muted}
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
        setVideoState(s => ({ ...s, paused: !s.paused }))
      }}
      onDurationChange={e => {
        const duration = e.currentTarget.duration
        setVideoState(s => ({ ...s, totalTime: duration }))
      }}
      onTimeUpdate={e => {
        const currTime = e.currentTarget.currentTime
        setVideoState(s => ({ ...s, currentTime: currTime }))
      }}
      onLoadedData={() => {
        setVideoState(s => ({ ...s, loaded: true }))
      }}
    >
      {videoState.subtitleUrl && videoState.showSubtitle !== false && <track src={videoState.subtitleUrl} kind="captions" default />}
    </video>
  )
}

export default LocalVideoPlayer
