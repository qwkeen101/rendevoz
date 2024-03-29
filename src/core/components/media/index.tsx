import { Content, Icon } from '@/components'
import { useAssignMediaInstance, useMediaInstance, MediaInstanceAtom } from './hooks/useMediaInstance'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createStore, Provider, useAtomValue } from 'jotai'
import MediaCore from './MediaCore'
import MediaBottomBar from './MediaBottomBar'
import useMediaToolbarState from './hooks/useMediaToolbarState'
import useMediaState, { DEFAULT_MEDIA_STATE, IMediaState, MediaStateAtom } from './hooks/useMediaState'
import { useUpdateEffect } from '@/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import Colors from '@/consts/colors'
import MediaSidebar from './components/sidebar/MediaSidebar'
import useMediaShortcut from './hooks/useMediaShortcut'
import { IMediaInstance } from '~/typings'
import { waitFor } from '@/utils/functions'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import { createPortal } from 'react-dom'
import ClassName from '@/styles/classNames'
import { Rendevoz } from '../../rendevoz'
import { Zindexes } from '@/consts'
import { useLatest } from 'react-use'
import useChangeVideoLayout, { MediaLayoutAtom } from '@/core/components/media/hooks/useVideoLayout'
import { IMediaEvent } from '~/typings/components/media/event'
import MediaTranscriber from '@/core/components/media/components/MediaTranscriber'
import { TabTitle } from '@/core/rendevoz/components'
import MediaToolbar from '@/core/components/media/components/MediaToolbar'
import _ from 'lodash'
import QuickLabelPopover from '@/core/components/media/components/QuickLabelPopover'
import MediaClipper from '@/core/components/media/components/MediaClipper'
export interface MediaProps {
  onInstanceInitialized?: (instance: Partial<IMediaInstance>) => void
  onlyCore?: boolean
  mediaState?: IMediaState
  onMediaStateChange?: (state: IMediaState) => void
  on?: (e: IMediaEvent) => Promise<any>
  disableTabTitle?: boolean
}
const MediaInner = ({ onInstanceInitialized, onlyCore, on, disableTabTitle = true }: MediaProps) => {
  const [playIconVisible, setPlayIconVisible] = useState(false)
  const [, setToolbarState] = useMediaToolbarState()
  const [mediaState, setMediaState] = useMediaState()

  const outerContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const instance = useMediaInstance()
  instance.on = on
  const showIcon = mediaState.mode === 'video' && playIconVisible && mediaState.loaded
  const mediaLayout = useAtomValue(MediaLayoutAtom)
  const audioMode = mediaState.mode === 'audio'
  useChangeVideoLayout(outerContainerRef)

  const columnLayout = mediaLayout
  const getPopIcon = () => {
    if (mediaState.jumpIndicator) {
      if (mediaState.jumpIndicator === 'back') {
        return 'park-double-left'
      } else {
        return 'park-double-right'
      }
    }
    if (mediaState.volumeIndicator) {
      if (mediaState.volumeIndicator === 'down') {
        return 'park-volume-down'
      } else {
        return 'park-volume-up'
      }
    }
    if (mediaState.paused) {
      return 'park-pause'
    } else {
      return 'park-play-one'
    }
  }

  useUpdateEffect(() => {
    setPlayIconVisible(true)
  }, [mediaState.paused])

  useEffect(() => {
    if (mediaState.fullScreen) {
      const c = containerRef.current
      if (c) {
        c.requestFullscreen()
        return () => {
          document.exitFullscreen()
        }
      }
    }
  }, [mediaState.fullScreen])
  useEffect(() => {
    if (mediaState.jumpIndicator || mediaState.volumeIndicator) {
      setPlayIconVisible(true)
    }
  }, [mediaState.jumpIndicator, mediaState.volumeIndicator])
  useEffect(() => {
    const { muted, loop, volume, totalPlayedTime, totalTime, currentTime } = mediaState
    instance.on?.({ type: 'externalStateChange', state: { muted, loop, totalTime, currentTime, totalPlayedTime, volume } })
  }, [mediaState.muted, mediaState.volume, mediaState.loop, mediaState.currentTime, mediaState.totalPlayedTime, mediaState.totalTime])
  useMediaShortcut(outerContainerRef)
  useAssignMediaInstance(containerRef)
  const latestVideoLoaded = useLatest(mediaState.loaded)

  useEffect(() => {
    waitFor(
      () => {
        return latestVideoLoaded.current
      },
      () => {
        onInstanceInitialized?.(instance)
      },
      {
        timeout: 15000
      }
    )
  }, [])
  const lastMovedRef = useRef(0)
  const renderCore = () => {
    return (
      <Content
        tabIndex={0}
        ref={ref => {
          containerRef.current = ref
          if (mediaState.floated) {
            outerContainerRef.current = ref
          }
        }}
        style={{
          height: 'fit-content'
        }}
        fullWidth
        onPointerMove={e => {
          lastMovedRef.current = Date.now()
          if (mediaState.fullScreen) {
            setTimeout(() => {
              const n = Date.now()
              if (n - lastMovedRef.current > 1400) {
                setToolbarState(s => ({ ...s, visible: false }))
              }
            }, 1500)
          }
          setToolbarState(s => {
            if (s.visible) return s
            else return { ...s, visible: true }
          })
        }}
        onPointerLeave={e => {
          setToolbarState(s => ({ ...s, visible: false }))
        }}
      >
        <QuickLabelPopover />
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
                if (mediaState.jumpIndicator || mediaState.volumeIndicator) {
                  setMediaState(s => ({
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
        <MediaCore url={mediaState.url} />
        {mediaState.mode !== 'web' && mediaState.mode !== 'audio' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0
            }}
          >
            <MediaBottomBar />
          </div>
        )}
      </Content>
    )
  }
  const renderFloated = () => {
    return createPortal(
      <ResizeAndDrag
        lockAspectRatio={mediaState.mode === 'audio' ? false : true}
        dragHandleClassName="video-drag-handle"
        minWidth={385}
        default={{
          width: mediaState.mode === 'audio' ? 400 : 800,
          height: 'auto',
          x: 200,
          y: 200
        }}
        style={{
          zIndex: Zindexes.VideoFloatWindow,
          boxShadow: Colors.Background.BoxShadow,
          borderRadius: 12,
          background: Colors.Background.Secondary
        }}
        onResizeStop={(e, dir, element) => {
          element.style.height = 'auto'
        }}
      >
        {mediaState.mode !== 'audio' && (
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
                {mediaState.name}
              </div>
            </Content>
            <Icon
              containerStyle={{ paddingLeft: 10 }}
              style={{ cursor: 'pointer' }}
              name="park-close"
              onClick={() => setMediaState(s => ({ ...s, floated: false }))}
            />
          </Content>
        )}
        {mediaState.mode === 'audio' && (
          <Icon
            containerStyle={{ position: 'absolute', top: 10, right: 10 }}
            style={{ cursor: 'pointer', zIndex: 20 }}
            name="park-close"
            onClick={() => setMediaState(s => ({ ...s, floated: false }))}
          />
        )}
        {renderCore()}
      </ResizeAndDrag>,
      document.body
    )
  }

  if (onlyCore) {
    return renderCore()
  }
  return (
    <Content fullWidth fullHeight ref={outerContainerRef}>
      <MediaTranscriber />
      <MediaClipper />
      {!disableTabTitle && <TabTitle title={mediaState.name} icon={<Icon name={'park-video'} />} />}
      <Content
        style={{
          margin: mediaState.mode !== 'audio' ? undefined : '0 auto',
          width: '100%',
          height: '100%',
          flexDirection: columnLayout ? 'column' : 'row',
          justifyContent: columnLayout && !audioMode ? 'unset' : 'center',
          alignItems: 'center',
          overflowY: 'auto'
        }}
        tabIndex={0}
        fullHeight
        flex
      >
        <Content
          style={{
            width: '100%',
            height: columnLayout ? 'fit-content' : '100%',
            overflowY: columnLayout ? undefined : 'auto',
            padding: '24px 24px 12px',
            display: 'flex'
          }}
        >
          <Content
            flex
            centered
            column
            gap={10}
            style={{
              width: '100%',
              maxWidth: 'calc((100vh - 260px) * (1/0.6))',
              minWidth: 'calc(250px * (1 / 0.5625))',
              height: 'fit-content',
              margin: audioMode ? 'auto' : '0 auto'
            }}
          >
            {mediaState.floated ? renderFloated() : renderCore()}
            {!audioMode && <div style={{ fontWeight: 500, fontSize: 18, width: '100%', lineHeight: 1.4 }}>{mediaState.name}</div>}
            {!audioMode && <MediaToolbar />}
          </Content>
        </Content>
        <MediaSidebar />
      </Content>
    </Content>
  )
}

const transformUrl = (
  url?: string,
  options?: {
    autoPlay?: boolean
    startTime?: number
  }
) => {
  if (!url) return url
  if (url.startsWith('rendefile') || url.startsWith('file')) return url
  if (url.includes('bilibili')) {
    try {
      const u = new URL(url)
      const params = u.searchParams
      const bvId = u.pathname.split('/')[2]
      const p = params.get('p')
      return `https://www.bilibili.com/blackboard/player.html?hasMuteButton=1&bvid=${bvId}&autoplay=${options?.autoPlay ? '1' : '0'}&t=${
        options?.startTime ? options.startTime : ''
      }${p ? `&p=${p}` : ''}`
    } catch (e) {
      return e
    }
  }
  if (url.includes('youtube')) {
    const U = new URL(url)
    const videoId = U.searchParams.get('v')
    if (!videoId) return url
    return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=${options?.autoPlay ? '1' : '0'}&start=${
      options?.startTime ? parseInt(`${options.startTime}`) : '0'
    }`
  }
  if (url.startsWith('baidudisk')) return url
  return url
}

const Media = (props: MediaProps) => {
  const getMediaMode = (url?: string): IMediaState['mode'] => {
    if (!url) return 'video'
    if (url.startsWith('rendefile') || url.startsWith('file')) {
      return 'video'
    }
    if (url.startsWith('baidudisk')) {
      return 'baidudisk'
    }
    if (url.includes('youtube.com') || url.includes('bilibili.com')) {
      return 'web'
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return 'web'
    }
    return 'video'
  }
  const store = useMemo(() => {
    const store = createStore()
    const {
      url,
      thumbnail,
      labels,
      labelType,
      lastPlayedTime,
      name,
      isPinned,
      description,
      mode,
      subtitleLang,
      subtitleMode = 'list',
      toolbar,
      subtitleList,
      volume,
      subtitleFollow,
      collectionName,
      metaId,
      layout,
      styles,
      autoPlay,
      currentTime
    } = props.mediaState || {}
    store.set(MediaInstanceAtom, {})
    console.log(subtitleList, subtitleLang, DEFAULT_MEDIA_STATE)
    const u = transformUrl(url, {
      autoPlay,
      startTime: currentTime ?? lastPlayedTime
    })
    console.log(u)
    store.set(MediaStateAtom, {
      ..._.merge({}, DEFAULT_MEDIA_STATE, {
        thumbnail,
        isPinned,
        collectionName,
        styles,
        jumpTime: lastPlayedTime,
        labels,
        subtitleMode,
        autoPlay,
        toolbar,
        volume,
        labelType,
        name,
        metaId,
        description,
        subtitleLang,
        subtitleList,
        subtitleFollow,
        layout
      }),
      url: transformUrl(url, {
        autoPlay,
        startTime: currentTime ?? lastPlayedTime
      }),
      mode: mode || getMediaMode(url)
    })
    return store
  }, [])

  useEffect(() => {
    if (!props.mediaState) return
    const currentState = store.get(MediaStateAtom)
    const {
      url,
      labels = [],
      labelType,
      thumbnail,
      name,
      description,
      isPinned,
      subtitleLang,
      subtitleList,
      mode,
      volume,
      subtitleMode = 'list',
      chapters = [],
      subtitleFollow,
      metaId,
      onlyCore,
      layout,
      collectionName,
      autoPlay,
      toolbar,
      styles
    } = props.mediaState
    console.log(props.mediaState, currentState)
    store.set(MediaStateAtom, {
      ...currentState,
      url: transformUrl(url),
      isPinned,
      metaId,
      subtitleMode,
      autoPlay,
      styles,
      onlyCore,
      toolbar,
      collectionName,
      subtitleLang: subtitleLang || currentState.subtitleLang,
      subtitleList: subtitleList || currentState.subtitleList,
      subtitleFollow,
      layout,
      chapters,
      mode: mode || getMediaMode(url),
      sortedChapters: (props.mediaState.chapters || currentState.chapters)?.slice().sort((b, a) => b.startTime - a.startTime) || [],
      labelType,
      labels,
      thumbnail,
      name,
      description
    })
  }, [props.mediaState])
  useEffect(() => {
    const currentState = store.get(MediaStateAtom)
    store.set(MediaStateAtom, {
      ...currentState,
      currentTime: props.mediaState?.currentTime,
      totalTime: props.mediaState?.totalTime,
      subtitles: [],
      subtitleList: props.mediaState?.subtitleList,
      subtitleLang: props.mediaState?.subtitleLang
    })
  }, [props.mediaState?.url])
  return (
    <Provider store={store}>
      <MediaInner {...props} />
    </Provider>
  )
}

export default Media
