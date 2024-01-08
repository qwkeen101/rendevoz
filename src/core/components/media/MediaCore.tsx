import { memo, useEffect, useRef, useState } from 'react'
import { useMediaInstance } from './hooks/useMediaInstance'
import { assignProperties } from '@/utils'
import useMediaState from './hooks/useMediaState'
import { Content } from '@/components'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import BaidudiskVideoPlayer from '@/core/components/media/players/BaidudiskVideoPlayer'
import WebVideoPlayer from '@/core/components/media/players/WebVideoPlayer'
import LocalVideoPlayer from '@/core/components/media/players/LocalVideoPlayer'
import './loading.css'
import { Colors } from '@/consts'
import ContextMenu from '@/components/contextMenu'
import MediaActionsMenu from '@/core/components/media/components/MediaActionsMenu'
import AudioPlayer from '@/core/components/media/players/AudioPlayer'
import { useTranslation } from 'react-i18next'

export const MEDIA_PLAYER_DEFAULT_BORDER_RADIUS = 12

const MediaCore = memo(() => {
  const instance = useMediaInstance()
  const [mediaState, setMediaState] = useMediaState()
  const { currentTime, mode } = mediaState

  const throttleUpdateLastViewTime = useThrottleFn(
    () => {
      if (currentTime) {
        instance.on?.({
          type: 'currentTimeChanged',
          currentTime: currentTime
        })
      }
    },
    { wait: 500 }
  )

  useEffect(() => {
    if (mediaState.loaded && !mediaState.paused) {
      instance.on?.({
        type: 'mediaStartPlay'
      })
    }
  }, [mediaState.loaded, mediaState.paused])
  useEffect(() => {
    throttleUpdateLastViewTime.run()
    setMediaState(s => (s.jumpTime ? { ...s, jumpTime: undefined } : s))
  }, [currentTime])

  assignProperties(instance, {
    actionOps: {
      pause: () => setMediaState(s => ({ ...s, paused: true })),
      play: () => setMediaState(s => ({ ...s, paused: false })),
      loop: () => setMediaState(s => ({ ...s, loop: true })),
      unloop: () => setMediaState(s => ({ ...s, loop: false })),
      jumpTo: t => setMediaState(s => ({ ...s, jumpTime: t }))
    }
  })

  const contextMenuRef = useRef()
  if (!mediaState.url) return null
  console.log(mediaState.mode)
  if (mediaState.mode === 'audio') {
    return <AudioPlayer />
  }
  return (
    <ContextMenu
      ref={contextMenuRef}
      enableContextMenu={mediaState.loaded}
      content={
        <MediaActionsMenu
          onClose={() => {
            contextMenuRef.current?.closeContextMenu?.()
          }}
        />
      }
    >
      <Content
        style={{
          width: '100%',
          paddingBottom: '56.25%',
          height: 0,
          borderRadius: mediaState.floated
            ? `0px 0px ${MEDIA_PLAYER_DEFAULT_BORDER_RADIUS}px ${MEDIA_PLAYER_DEFAULT_BORDER_RADIUS}px`
            : MEDIA_PLAYER_DEFAULT_BORDER_RADIUS,
          overflow: 'hidden'
        }}
      >
        {!mediaState.loaded && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 999 }}>
            <LoadingAnimation />
          </div>
        )}
        {mode === 'web' && <WebVideoPlayer />}
        {mode === 'video' && <LocalVideoPlayer />}
        {mode === 'baidudisk' && <BaidudiskVideoPlayer />}
      </Content>
    </ContextMenu>
  )
})

const LoadingAnimation = () => {
  const [dots, setDotsNum] = useState(0)
  const { t } = useTranslation()
  useEffect(() => {
    const interval = setInterval(() => {
      setDotsNum(s => {
        const next = s + 1
        return next > 3 ? 0 : next
      })
    }, 300)
    return () => {
      clearInterval(interval)
    }
  }, [])
  return (
    <div className="loading_center">
      <Content flex>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
      </Content>
      <div style={{ fontSize: 18, color: Colors.Font.Description, marginTop: 20 }}>
        {t('general.Loading')} {Array.from(Array(dots).keys()).map(i => `.`)}
      </div>
    </div>
  )
}

export default MediaCore
