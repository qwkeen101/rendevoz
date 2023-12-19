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
import { useSelectAtomValue } from '@/hooks'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'

const IMG = 'https://i.ytimg.com/vi/-N-ij9aPGVY/hqdefault.jpg?s…AFwAcABBg==&rs=AOn4CLADUEmOZGoF82oTlcqi2FQFxks28g'

export default () => {
  const [mediaState, setMediaState] = useMediaState()
  const audioRef = useRef<HTMLAudioElement>(null)
  const { loaded, paused, currentTime = 0, totalTime = 0, jumpTime, volume = 0, speed = 1 } = mediaState
  const a = audioRef.current
  const columnLayout = useAtomValue(MediaLayoutAtom)
  const sidebarOpen = useMediaSidebarState()[0].rightBarVisible
  const instance = useMediaInstance()
  assignProperties(instance, {
    getAudioFile: async () => {
      const res = await fetch(mediaState.url).then(res => res.blob())
      return res
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
  const [ref, { width }] = useMeasure()
  const columnMode = width < 800
  const floated = mediaState.floated
  return (
    <Content
      flex
      alignItems={'center'}
      justifyContent={'center'}
      style={{ margin: 'auto' }}
      gap={columnMode ? 16 : 40}
      ref={ref}
      column={columnMode}
    >
      {!floated &&
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
      <Content flex column style={{ width: '100%', maxWidth: columnLayout ? '100%' : 800, padding: floated ? '12px 16px 4px' : 0 }}>
        <div
          className={'video-drag-handle'}
          style={{
            fontWeight: 600,
            fontSize: floated ? 14 : columnMode ? 18 : 30,
            marginBottom: floated ? 20 : 0,
            cursor: floated ? 'grab' : 'unset',
            width: 'fit-content'
          }}
        >
          {mediaState.name}
        </div>
        {!floated && !(columnLayout && sidebarOpen) && (
          <div className={ClassName.ellipsisFont(5)} style={{ fontSize: 14, color: Colors.Font.Transparent }}>
            {mediaState.description}
          </div>
        )}
        <div style={{ width: '100%', marginTop: 25 }}>
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
