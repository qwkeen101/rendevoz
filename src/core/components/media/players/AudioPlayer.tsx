import useMediaState from '@/core/components/media/hooks/useMediaState'
import { Content, Icon } from '@/components'
import { useEffect, useRef } from 'react'
import MediaBottomBar from '@/core/components/media/MediaBottomBar'
import { Colors } from '@/consts'
import { assignProperties } from '@/utils'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { useMeasure } from 'react-use'
import MediaToolbar from '@/core/components/media/components/MediaToolbar'
import { useAtomValue } from 'jotai'
import { MediaLayoutAtom } from '@/core/components/media/hooks/useVideoLayout'
import { ClassName } from 'rendevoz'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'

export default () => {
  const [mediaState, setMediaState] = useMediaState()
  const audioRef = useRef<HTMLAudioElement>(null)
  const { loaded, paused, currentTime = 0, totalTime = 0, jumpTime, volume = 0, speed = 1 } = mediaState
  const a = audioRef.current
  const columnLayout = useAtomValue(MediaLayoutAtom)
  const sidebarOpen = useMediaSidebarState()[0].rightBarVisible
  const instance = useMediaInstance()
  const containerRef = useRef<HTMLElement>(null)
  const [ref, { width }] = useMeasure()
  assignProperties(instance, {
    getAudioFile: async () => {
      const res = await fetch(mediaState.url).then(res => res.blob())
      return res
    },
    getMediaContainer: () => {
      return containerRef.current || undefined
    }
  })
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
      if (jumpTime) {
        if (a) {
          a.currentTime = jumpTime
          setMediaState(s => ({ ...s, jumpTime: undefined }))
        }
      }
    }
  }, [loaded, jumpTime])
  useEffect(() => {
    if (a && loaded) {
      a.currentTime = currentTime
    }
  }, [loaded])
  useEffect(() => {
    if (a && loaded) {
      if (mediaState.autoPlay) {
        a.play()
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
  }, [mediaState.url])
  useEffect(() => {
    if (a) {
      a.playbackRate = speed
    }
  }, [speed, loaded])

  const columnMode = width < 800
  const floated = mediaState.floated
  return (
    <Content
      flex
      alignItems={'center'}
      justifyContent={'center'}
      style={{ margin: 'auto', ...mediaState.styles?.playerStyle }}
      gap={columnMode ? 16 : 40}
      ref={ref}
      column={columnMode}
    >
      {!floated &&
        mediaState.layout?.showAudioThumbnail !== false &&
        !(columnLayout && sidebarOpen) &&
        (mediaState.thumbnail ? (
          <img
            src={mediaState.thumbnail}
            height={columnMode ? 200 : 300}
            width={columnMode ? 200 : 300}
            style={{ objectFit: 'cover', borderRadius: floated ? 4 : 24 }}
          />
        ) : (
          <Content
            flex
            centered
            style={{
              background: Colors.Background.RadialGradient,
              color: Colors.Font.Tertiary,
              padding: 60,
              borderRadius: 24
            }}
          >
            <Icon size={120} name={'park-music'} theme={'filled'} />
          </Content>
        ))}
      <Content flex column gap={4} style={{ width: '100%', maxWidth: columnLayout ? '100%' : 800, padding: floated ? '16px 24px 0px 16px' : 0 }}>
        <div
          className={'video-drag-handle'}
          style={{
            fontWeight: 600,
            fontSize: floated ? 14 : columnMode ? 18 : 30,
            cursor: floated ? 'grab' : 'unset',
            width: 'fit-content',
            ...mediaState.styles?.titleStyle
          }}
        >
          <div className={floated ? 'ellipsis-font-1' : undefined}>{mediaState.name}</div>
        </div>
        {!floated && !(columnLayout && sidebarOpen) && mediaState.layout?.showDescription !== false && (
          <div
            className={mediaState.styles?.descriptionEllispsis ? ClassName.ellipsisFont(mediaState.styles.descriptionEllispsis) : undefined}
            style={{
              fontSize: 14,
              flex: '1',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: Colors.Font.Transparent,
              ...mediaState.styles?.descriptionStyle
            }}
          >
            {mediaState.description}
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', marginTop: mediaState.layout?.showProgressPins ? 25 : 16 }}>
          <MediaBottomBar />
        </div>

        {!floated && mediaState.onlyCore !== true && <MediaToolbar />}
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
            setMediaState(s => ({ ...s, currentTime: e.currentTarget.currentTime }))
          }}
          onDurationChange={e => {
            setMediaState(s => ({ ...s, totalTime: e.currentTarget.duration }))
          }}
          ref={audioRef}
          src={mediaState.url}
        />
      </Content>
    </Content>
  )
}
