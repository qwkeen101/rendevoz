import { useGetMediaState, useSelectMediaState, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { memo, useEffect, useRef } from 'react'
import PlayerHeader from '@/core/components/media/players/PlayerHeader'
import useThrottleUpdateCurrentTime from '@/core/components/media/hooks/useThrottleUpdateCurrentTime'
export default memo(({ coreMode = false }: { coreMode?: boolean }) => {
  const setMediaState = useSetMediaState()
  const get = useGetMediaState()
  const audioRef = useRef<HTMLAudioElement>(null)
  const updateTime = useThrottleUpdateCurrentTime()
  const {
    loaded,
    paused,
    jumpTime,
    volume = 0,
    speed = 1,
    muted,
    url,
    autoPlay,
    styles,
    layout
  } = useSelectMediaState(s => ({
    loaded: s.loaded,
    paused: s.paused,
    layout: s.layout,
    url: s.url,
    styles: s.styles,
    speed: s.speed,
    volume: s.volume,
    muted: s.muted,
    autoPlay: s.autoPlay,
    jumpTime: s.jumpTime
  }))
  const a = audioRef.current
  useEffect(() => {
    if (loaded) {
      if (a && muted !== undefined) {
        a.muted = muted
      }
    }
  }, [loaded, muted])
  useEffect(() => {
    if (loaded) {
      if (paused) {
        audioRef.current?.pause()
      } else {
        audioRef.current?.play()
      }
    }
  }, [loaded, paused])

  useEffect(() => {
    if (loaded) {
      if (jumpTime !== undefined) {
        if (a) {
          a.currentTime = jumpTime
          setMediaState(s => ({ ...s, jumpTime: undefined }))
        }
      }
    }
  }, [loaded, jumpTime])
  useEffect(() => {
    if (a && loaded) {
      const current = get().currentTime
      if (current) {
        a.currentTime = current
      }
    }
  }, [loaded])
  useEffect(() => {
    if (a) {
      a.volume = volume
    }
  }, [volume, loaded])
  useEffect(() => {
    setMediaState(s => ({ ...s, loaded: false }))
  }, [url])
  useEffect(() => {
    if (a) {
      a.playbackRate = speed
    }
  }, [speed, loaded])

  if (coreMode) {
    return (
      <audio
        onLoadedData={() => {
          setMediaState(s => ({ ...s, loaded: true }))
        }}
        onPlay={() => {
          setMediaState(s => ({ ...s, paused: false }))
        }}
        onPause={() => {
          setMediaState(s => ({ ...s, paused: true }))
        }}
        onTimeUpdate={e => {
          updateTime(e.currentTarget.currentTime)
        }}
        onDurationChange={e => {
          setMediaState(s => ({
            ...s,
            totalTime: e.currentTarget.duration
          }))
        }}
        autoPlay={autoPlay}
        ref={audioRef}
        src={url}
      />
    )
  }
  if (layout?.audioHeaderMode) {
    return (
      <>
        <PlayerHeader />
        <audio
          onLoadedData={() => {
            setMediaState(s => ({ ...s, loaded: true }))
          }}
          onPlay={() => {
            setMediaState(s => ({ ...s, paused: false }))
          }}
          onPause={() => {
            setMediaState(s => ({ ...s, paused: true }))
          }}
          autoPlay={autoPlay}
          onTimeUpdate={e => {
            updateTime(e.currentTarget.currentTime)
          }}
          onDurationChange={e => {
            setMediaState(s => ({
              ...s,
              totalTime: e.currentTarget.duration
            }))
          }}
          ref={audioRef}
          src={url}
        />
      </>
    )
  }
  return (
    <div className={'flex flex-col @container'} style={styles?.playerStyle}>
      {layout?.audioHeader !== false && <PlayerHeader />}
      {layout?.episodeMode !== true && (
        <audio
          onLoadedData={() => {
            setMediaState(s => ({ ...s, loaded: true }))
          }}
          onPlay={() => {
            setMediaState(s => ({ ...s, paused: false }))
          }}
          onPause={() => {
            setMediaState(s => ({ ...s, paused: true }))
          }}
          autoPlay={autoPlay}
          onTimeUpdate={e => {
            updateTime(e.currentTarget.currentTime)
          }}
          onDurationChange={e => {
            setMediaState(s => ({
              ...s,
              totalTime: e.currentTarget.duration
            }))
          }}
          ref={audioRef}
          src={url}
        />
      )}
    </div>
  )
})
