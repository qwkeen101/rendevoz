import { Content, Icon } from '@/components'
import { VideoInstanceAtom, useAssignVideoInstance, useVideoInstance } from './hooks/useVideoInstance'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Provider, createStore } from 'jotai'
import VideoCore from './VideoCore'
import VideoBottomBar from './VideoBottomBar'
import useVideoToolbarState from './hooks/useVideoToolbarState'
import useVideoState, { VideoStateAtom } from './hooks/useVideoState'
import { useUpdateEffect } from '@/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import Colors from '@/consts/colors'
import { MetaStore, ObjectStore, globalStore } from '@/stores'
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

export interface VideoProps {
  videoId: number
  onInstanceInitialized?: (instance: Partial<IVideoInstance>) => void
}
const VideoInner = ({ videoId, onInstanceInitialized }: VideoProps) => {
  const [playIconVisible, setPlayIconVisible] = useState(false)
  const [, setToolbarState] = useVideoToolbarState()
  const [videoState, setVideoState] = useVideoState()
  const outerContainerRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width = 0 } = useMeasure(outerContainerRef)
  const instance = useVideoInstance()
  const videoMeta = MetaStore.useObjectToMetaValue(videoId)
  const smallMode = width < 1000 || videoState.floated
  useUpdateEffect(() => {
    setPlayIconVisible(true)
  }, [videoState.paused])

  useEffect(() => {
    if (videoState.jumpIndicator) {
      setPlayIconVisible(true)
    }
  }, [videoState.jumpIndicator])

  useVideoShortcut()

  useAssignVideoInstance(videoId, containerRef)

  useEffect(() => {
    waitFor(
      () => Object.keys(instance).length > 0,
      () => onInstanceInitialized?.(instance)
    )
  }, [])
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
      gap={smallMode ? 0 : 30}
      fullHeight
      flex
      ref={outerContainerRef}
    >
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
                style={{ borderRadius: '8px 8px 0px 0px', cursor: 'grab', padding: '6px 12px' }}
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
                  {playIconVisible && (
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
                        if (videoState.jumpIndicator) {
                          setVideoState(s => ({ ...s, jumpIndicator: undefined }))
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
                        name={
                          videoState.jumpIndicator === 'back'
                            ? 'park-double-left'
                            : videoState.jumpIndicator === 'forward'
                            ? 'park-double-right'
                            : videoState.paused
                            ? 'park-pause'
                            : 'park-play-one'
                        }
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <VideoCore url={videoState.url}></VideoCore>
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
              {playIconVisible && (
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
                    if (videoState.jumpIndicator) {
                      setVideoState(s => ({ ...s, jumpIndicator: undefined }))
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
                    name={
                      videoState.jumpIndicator === 'back'
                        ? 'park-double-left'
                        : videoState.jumpIndicator === 'forward'
                        ? 'park-double-right'
                        : videoState.paused
                        ? 'park-pause'
                        : 'park-play-one'
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <VideoCore url={videoState.url}></VideoCore>
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
          </Content>
        )}
        <VideoStatusBar />
      </Content>
      <VideoSidebar width={smallMode ? '100%' : 420} />
    </Content>
  )
}

export const Video = (props: VideoProps) => {
  const { videoId } = props
  const videoAtom = ObjectStore('video').createAtom(videoId)

  const store = useMemo(() => {
    const store = createStore()
    store.set(VideoInstanceAtom, {})
    const action = async () => {
      const video = (await ObjectStore('video').getOneById(videoId)) || (await ObjectStore('video').addOne({ id: videoId }))
      store.set(VideoStateAtom, {
        ...store.get(VideoStateAtom),
        ...video,
        videoId,
        url: video.videoUrl,
        currentTime: video.lastPlayedTime || 0
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
      store.set(VideoStateAtom, {
        ...store.get(VideoStateAtom),
        ...data,
        videoId,
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
