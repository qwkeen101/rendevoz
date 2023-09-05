import { Content, Icon } from '@/components'
import { useAssignVideoInstance, useVideoInstance, VideoInstanceAtom } from './hooks/useVideoInstance'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createStore, Provider } from 'jotai'
import VideoCore from './VideoCore'
import VideoBottomBar from './VideoBottomBar'
import useVideoToolbarState from './hooks/useVideoToolbarState'
import useVideoState, { VideoStateAtom } from './hooks/useVideoState'
import { useUpdateEffect } from '@/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import Colors from '@/consts/colors'
import { globalStore, MetaStore, ObjectStore } from '@/stores'
import VideoSidebar from './VideoSidebar'
import useVideoShortcut from './hooks/useVideoShortcut'
import { IVideoInstance } from '~/typings'
import { waitFor } from '@/utils/functions'
import VideoStatusBar from './VideoStatusBar'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import { createPortal } from 'react-dom'
import ClassName from '@/styles/classNames'
import { Rendevoz } from '../rendevoz'
import useMeasure from '@/hooks/utils/useMeasure'
import { Zindexes } from '@/consts'
import { VideoSidebarStateAtom } from './hooks/useVideoSidebarState'
import VideoSubtitleSidebar from '@/core/video/VideoSubtitleSidebar'
import { useLatest } from 'react-use'

export interface VideoProps {
  videoId: number
  onInstanceInitialized?: (instance: Partial<IVideoInstance>) => void
  onlyCore?: boolean
}
const VideoInner = ({ videoId, onInstanceInitialized, onlyCore }: VideoProps) => {
  const [playIconVisible, setPlayIconVisible] = useState(false)
  const [, setToolbarState] = useVideoToolbarState()
  const [videoState, setVideoState] = useVideoState()
  const outerContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width = 0 } = useMeasure(outerContainerRef)
  const instance = useVideoInstance()
  const videoMeta = MetaStore.useObjectToMetaValue(videoId)
  const smallMode = width < 1000 || videoState.floated
  const showIcon = playIconVisible && videoState.loaded
  const getPopIcon = () => {
    if (videoState.jumpIndicator) {
      if (videoState.jumpIndicator === 'back') {
        return 'park-double-left'
      } else {
        return 'park-double-right'
      }
    }
    if (videoState.volumeIndicator) {
      if (videoState.volumeIndicator === 'down') {
        return 'park-volume-down'
      } else {
        return 'park-volume-up'
      }
    }
    if (videoState.paused) {
      return 'park-pause'
    } else {
      return 'park-play-one'
    }
  }

  useUpdateEffect(() => {
    setPlayIconVisible(true)
  }, [videoState.paused])

  useEffect(() => {
    if (videoState.jumpIndicator || videoState.volumeIndicator) {
      setPlayIconVisible(true)
    }
  }, [videoState.jumpIndicator, videoState.volumeIndicator])

  useVideoShortcut(outerContainerRef)

  useAssignVideoInstance(videoId, containerRef)
  const latestVideoLoaded = useLatest(videoState.loaded)
  useEffect(() => {
    waitFor(
      () => {
        console.log(latestVideoLoaded.current)
        return latestVideoLoaded.current
      },
      () => {
        console.log('success load')
        onInstanceInitialized?.(instance)
      },
      {
        timeout: 15000
      }
    )
  }, [])

  if (onlyCore) {
    return (
      <Content
        tabIndex={0}
        ref={ref => {
          containerRef.current = ref
          outerContainerRef.current = ref
        }}
        fullHeight
        fullWidth
        onPointerMove={e => {
          setToolbarState(s => {
            if (s.visible) return s
            else return { ...s, visible: true }
          })
        }}
        onPointerLeave={e => {
          setToolbarState(s => ({ ...s, visible: false }))
        }}
      >
        <AnimatePresence>
          {showIcon && (
            <motion.div
              initial={{ opacity: 0.8, scale: 1, x: '-50%', y: '-50%' }}
              animate={{ opacity: 0, scale: 1.3, x: '-50%', y: '-50%' }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                zIndex: 9999,
                transform: 'translateX(-50%); translateY(-50%)'
              }}
              transition={{ duration: 0.6 }}
              onAnimationComplete={() => {
                setPlayIconVisible(false)
                if (videoState.jumpIndicator || videoState.volumeIndicator) {
                  setVideoState(s => ({
                    ...s,
                    jumpIndicator: undefined,
                    volumeIndicator: undefined
                  }))
                }
              }}
            >
              <Icon
                fill={Colors.Font.White}
                size={40}
                theme="filled"
                containerStyle={{
                  background: 'rgba(0,0,0,0.36)',
                  borderRadius: 999,
                  padding: 14
                }}
                name={getPopIcon()}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <VideoCore url={videoState.url} />
        {videoState.mode !== 'web' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0
            }}
          >
            <VideoBottomBar />
          </div>
        )}
      </Content>
    )
  }
  return (
    <Content
      style={{
        maxWidth: smallMode ? undefined : 1730,
        margin: 'auto',
        width: '100%',
        overflowY: 'auto',
        height: '100%',
        flexDirection: smallMode ? 'column' : 'row',
        padding: '24px 32px',
        justifyContent: smallMode ? 'flex-start' : 'center',
        alignItems: smallMode ? 'center' : undefined
      }}
      tabIndex={0}
      gap={smallMode ? 0 : 30}
      fullHeight
      flex
      ref={outerContainerRef}
    >
      {!smallMode && <VideoSubtitleSidebar small={!!smallMode} />}
      <Content
        flex
        column
        auto
        style={{
          width: smallMode ? '100%' : 0,
          flexGrow: smallMode ? 0 : 1,
          maxWidth: 1200
        }}
      >
        {videoState.floated ? (
          createPortal(
            <ResizeAndDrag
              lockAspectRatio={true}
              dragHandleClassName="video-drag-handle"
              minWidth={385}
              default={{
                width: 800,
                height: 'auto',
                x: 200,
                y: 200
              }}
              style={{
                zIndex: Zindexes.VideoFloatWindow
              }}
              onResizeStop={(e, dir, element) => {
                element.style.height = 'auto'
              }}
            >
              <Content
                flex
                justifyContent="space-between"
                className={ClassName.Background.pseudoBlubBackground}
                style={{
                  borderRadius: '4px 4px 0px 0px',
                  cursor: 'grab',
                  padding: '6px 12px'
                }}
              >
                <Content flex gap={10} style={{ flexShrink: 1, flexGrow: 1 }} className="video-drag-handle">
                  <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('video')} />
                  <div style={{ width: '100%', userSelect: 'none' }} className={ClassName.ellipsisFont(1)}>
                    {videoMeta?.name}
                  </div>
                </Content>
                <Icon
                  containerStyle={{ paddingLeft: 10 }}
                  style={{ cursor: 'pointer' }}
                  name="park-close"
                  onClick={() => setVideoState(s => ({ ...s, floated: false }))}
                />
              </Content>
              <Content
                ref={containerRef}
                flex
                style={{ height: 'fit-content' }}
                fullWidth
                onPointerMove={e => {
                  setToolbarState(s => {
                    if (s.visible) return s
                    else return { ...s, visible: true }
                  })
                }}
                onPointerLeave={e => {
                  setToolbarState(s => ({ ...s, visible: false }))
                }}
              >
                <AnimatePresence>
                  {showIcon && (
                    <motion.div
                      initial={{ opacity: 0.8, scale: 1, x: '-50%', y: '-50%' }}
                      animate={{ opacity: 0, scale: 1.3, x: '-50%', y: '-50%' }}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        zIndex: 9999,
                        transform: 'translateX(-50%); translateY(-50%)'
                      }}
                      transition={{ duration: 0.6 }}
                      onAnimationComplete={() => {
                        setPlayIconVisible(false)
                        if (videoState.jumpIndicator || videoState.volumeIndicator) {
                          setVideoState(s => ({
                            ...s,
                            jumpIndicator: undefined,
                            volumeIndicator: undefined
                          }))
                        }
                      }}
                    >
                      <Icon
                        fill={Colors.Font.White}
                        size={40}
                        theme="filled"
                        containerStyle={{
                          background: 'rgba(0,0,0,0.36)',
                          borderRadius: 999,
                          padding: 14
                        }}
                        name={getPopIcon()}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <VideoCore url={videoState.url}></VideoCore>
                {videoState.mode !== 'web' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0
                    }}
                  >
                    <VideoBottomBar />
                  </div>
                )}
              </Content>
            </ResizeAndDrag>,
            document.body
          )
        ) : (
          <Content
            flex
            ref={containerRef}
            style={{ height: 'fit-content' }}
            fullWidth
            onPointerMove={e => {
              setToolbarState(s => {
                if (s.visible) return s
                else return { ...s, visible: true }
              })
            }}
            onPointerLeave={e => {
              setToolbarState(s => ({ ...s, visible: false }))
            }}
          >
            <AnimatePresence>
              {showIcon && (
                <motion.div
                  initial={{ opacity: 0.8, scale: 1, x: '-50%', y: '-50%' }}
                  animate={{ opacity: 0, scale: 1.3, x: '-50%', y: '-50%' }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    zIndex: 9999,
                    transform: 'translateX(-50%); translateY(-50%)'
                  }}
                  transition={{ duration: 0.6 }}
                  onAnimationComplete={() => {
                    setPlayIconVisible(false)
                    if (videoState.jumpIndicator || videoState.volumeIndicator) {
                      setVideoState(s => ({
                        ...s,
                        jumpIndicator: undefined,
                        volumeIndicator: undefined
                      }))
                    }
                  }}
                >
                  <Icon
                    fill={Colors.Font.White}
                    size={40}
                    theme="filled"
                    containerStyle={{
                      background: 'rgba(0,0,0,0.36)',
                      borderRadius: 999,
                      padding: 14
                    }}
                    name={getPopIcon()}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <VideoCore url={videoState.url}></VideoCore>
            {videoState.mode !== 'web' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0
                }}
              >
                <VideoBottomBar />
              </div>
            )}
          </Content>
        )}
        <VideoStatusBar />
      </Content>
      {smallMode && <VideoSubtitleSidebar small={true} />}
      <VideoSidebar width={smallMode ? '100%' : 420} />
    </Content>
  )
}

const transformUrl = (url?: string) => {
  if (!url) return url
  if (url.startsWith('rendefile') || url.startsWith('file')) return url
  if (url.includes('bilibili')) return url
  if (url.includes('youtube')) {
    const U = new URL(url)
    const videoId = U.searchParams.get('v')
    if (!videoId) return url
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.startsWith('baidudisk')) return url
}
export const Video = (props: VideoProps) => {
  const { videoId } = props
  const videoAtom = ObjectStore('video').createAtom(videoId)

  const store = useMemo(() => {
    const store = createStore()
    store.set(VideoInstanceAtom, {})
    const action = async () => {
      const video = (await ObjectStore('video').getOneById(videoId)) || (await ObjectStore('video').addOne({ id: videoId }))
      console.log(video)
      store.set(VideoStateAtom, {
        ...store.get(VideoStateAtom),
        ...video,
        videoId,
        url: transformUrl(video.videoUrl),
        mode:
          video.videoUrl?.startsWith('rendefile') || video.videoUrl?.startsWith('file')
            ? 'video'
            : video.videoUrl?.startsWith('baidudisk')
            ? 'baidudisk'
            : 'web',
        jumpTime: video.lastPlayedTime || undefined
      })
      store.set(VideoSidebarStateAtom, {
        ...store.get(VideoSidebarStateAtom),
        showLabels: !!video.labels?.length,
        showChapters: !!video.chapters?.length
      })
    }
    action()
    return store
  }, [])

  useEffect(() => {
    const unsub = globalStore.sub(videoAtom, () => {
      const data = globalStore.get(videoAtom)
      const currentVideoState = store.get(VideoStateAtom)
      store.set(VideoStateAtom, {
        ...currentVideoState,
        ...data,
        volume: currentVideoState.volume,
        videoId,
        url: transformUrl(data?.videoUrl),
        mode:
          data?.videoUrl?.startsWith('rendefile') || data?.videoUrl?.startsWith('file')
            ? 'video'
            : data?.videoUrl?.startsWith('baidudisk')
            ? 'baidudisk'
            : 'web',
        sortedChapters: data?.chapters?.slice().sort((b, a) => b.startTime - a.startTime) || []
      })
    })
    return () => {
      const volume = store.get(VideoStateAtom).volume
      ObjectStore('video').updateOne({ id: videoId, volume })
      unsub()
    }
  }, [])
  return (
    <Provider store={store}>
      <VideoInner {...props} />
    </Provider>
  )
}
