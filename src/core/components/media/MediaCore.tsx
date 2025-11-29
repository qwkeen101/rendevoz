import { CSSProperties, memo } from 'react'
import { useMediaInstance } from './hooks/useMediaInstance'
import { assignProperties } from '@/utils'
import useMediaState from './hooks/useMediaState'
import { DotLoading } from '@/components'
import BaidudiskVideoPlayer from '@/core/components/media/players/BaidudiskVideoPlayer'
import WebVideoPlayer from '@/core/components/media/players/WebVideoPlayer'
import LocalVideoPlayer from '@/core/components/media/players/LocalVideoPlayer'
import ContextMenu from '@/components/contextMenu'
import AudioPlayer from '@/core/components/media/players/AudioPlayer'
import MediaMoreMenu from '@/core/components/media/components/MediaMoreMenu'
import PodcastBottomController from '@/core/components/media/components/PodcastBottomController'
import PodcastRightPanel from '../podcast/components/PodcastRightPanel'
import EpisodePageContent from '../podcast/components/EpisodePageContent'

const MediaCore = memo(({ className, style }: { className?: string; style?: CSSProperties }) => {
  const instance = useMediaInstance()
  const [mediaState, setMediaState] = useMediaState()
  const { mode, fullScreen, cinemaMode, focus } = mediaState

  assignProperties(instance, {
    getMediaState: () => mediaState,
    actionOps: {
      autoPlay: () => {
        setMediaState(s => ({ ...s, autoPlay: true }))
      },
      stopAutoPlay: () => {
        setMediaState(s => ({ ...s, autoPlay: false }))
      },
      pause: () => setMediaState(s => ({ ...s, paused: true })),
      play: () => setMediaState(s => ({ ...s, paused: false })),
      loop: () => setMediaState(s => ({ ...s, loop: true })),
      unloop: () => setMediaState(s => ({ ...s, loop: false })),
      jumpTo: t => {
        setMediaState(s => ({ ...s, jumpTime: t }))
        instance.on?.({
          type: 'jump',
          time: t
        })
      },
      fullScreen: () => {
        setMediaState(s => ({ ...s, fullScreen: !s.fullScreen }))
      }
    }
  })

  if (mediaState.layout?.episode?.pageContainerRef) {
    return (
      <>
        <PodcastBottomController />
        <PodcastRightPanel parentRef={mediaState.layout.episode.pageContainerRef} />
      </>
    )
  }
  if (mediaState.layout?.episode?.sidebar) {
    return (
      <>
        <EpisodePageContent />
      </>
    )
  }
  if (mediaState.mode === 'audio') {
    return <AudioPlayer />
  }

  return (
    <ContextMenu
      enableContextMenu={mediaState.loaded}
      content={setV => (
        <MediaMoreMenu
          onClose={() => {
            setV(false)
          }}
        />
      )}
    >
      <div
        className={className}
        style={{
          aspectRatio: '16 / 9',
          width: '100%',
          maxHeight: 'calc(100vh - 200px)',
          position: fullScreen ? 'unset' : 'relative',
          overflow: 'hidden',
          inset: 0,
          ...style
        }}
      >
        {!mediaState.loaded && (
          <div className={'absolute inset-0 flex items-center justify-center'} style={{ zIndex: 999, borderRadius: 'inherit' }}>
            <DotLoading />
          </div>
        )}
        <div
          style={{
            opacity: mediaState.loaded ? 1 : 0
          }}
        >
          {mode === 'web' && <WebVideoPlayer />}
          {mode === 'video' && <LocalVideoPlayer />}
          {mode === 'baidudisk' && <BaidudiskVideoPlayer />}
        </div>
      </div>
    </ContextMenu>
  )
})

export default MediaCore
