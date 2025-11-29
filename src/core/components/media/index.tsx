import { Icon } from '@/components'
import { useAssignMediaInstance, useMediaInstance, MediaInstanceAtom } from './hooks/useMediaInstance'
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createStore, Provider } from 'jotai'
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
import { useLatest } from 'react-use'
import { IMediaEvent } from '~/typings/components/media/event'
import _, { omitBy, pick } from 'lodash'
import QuickLabelPopover from '@/core/components/media/components/QuickLabelPopover'
import MediaDetailsRenderer from '@/core/components/media/components/MediaDetailsRenderer'
import PageConfigContext from '@/core/components/PageConfigContext'
import useMeasure from '@/hooks/utils/useMeasure'
import MediaHeader from '@/core/components/media/components/MediaHeader'
import FocusAudioPage from '@/core/components/media/components/focus/FocusAudioPage'
import FocusVideoPage from '@/core/components/media/components/focus/FocusVideoPage'
import useYoutubeSubtitles from '@/core/components/media/hooks/useYoutubeSubtitles'
import FocusVideoBody from './components/focus/video/FocusVideoBody'
export interface MediaProps {
  onInstanceInitialized?: (instance: Partial<IMediaInstance>) => void
  onlyCore?: boolean
  mediaState?: IMediaState
  onMediaStateChange?: (state: IMediaState) => void
  on?: (e: IMediaEvent) => Promise<any>
}
const MediaInner = ({ onInstanceInitialized, onlyCore, on }: MediaProps) => {
  const [playIconVisible, setPlayIconVisible] = useState(false)
  const [, setToolbarState] = useMediaToolbarState()
  const [mediaState, setMediaState] = useMediaState()
  const { paused, mode, loaded, fullScreen, jumpIndicator, volumeIndicator, volume, muted, totalTime, columnLayout, url } = mediaState
  useYoutubeSubtitles(url)
  const outerContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const instance = useMediaInstance()
  instance.on = on || (() => {})
  const showIcon = mode === 'video' && playIconVisible && loaded
  const fullSize = mediaState.layout?.fullSize
  const audioMode = mode === 'audio'
  const containerSize = useMeasure(outerContainerRef)
  useLayoutEffect(() => {
    if (!containerSize.width) return
    if (containerSize.width <= 1000) {
      setMediaState(s => ({ ...s, columnLayout: true }))
    } else {
      setMediaState(s => ({ ...s, columnLayout: false }))
    }
  }, [containerSize.width])
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
  }, [paused])

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
  }, [fullScreen])
  useEffect(() => {
    if (mediaState.jumpIndicator || mediaState.volumeIndicator) {
      setPlayIconVisible(true)
    }
  }, [jumpIndicator, volumeIndicator])
  useEffect(() => {
    const { muted, loop, volume, totalTime, currentTime, paused } = mediaState
    instance.on?.({
      type: 'externalStateChange',
      state: { muted, loop, totalTime, currentTime, volume, paused }
    })
  }, [muted, volume, mediaState.loop, totalTime, paused])
  useMediaShortcut(outerContainerRef)
  useAssignMediaInstance(containerRef)
  const latestMediaState = useLatest(mediaState)

  useEffect(() => {
    waitFor(
      () => {
        const m = latestMediaState.current
        if (m.layout?.episodeMode) return true
        return !!(m.loaded && instance.actionOps)
      },
      () => {
        onInstanceInitialized?.(instance)
      },
      {
        timeout: 9999999
      }
    )
  }, [])
  const lastMovedRef = useRef(0)
  const renderCore = () => {
    const MEDIA_PLAYER_DEFAULT_BORDER_RADIUS = 12
    const borderRadius = mediaState.styles?.videoBorderRadius ?? MEDIA_PLAYER_DEFAULT_BORDER_RADIUS
    return (
      <div
        tabIndex={0}
        ref={containerRef}
        className={'w-full max-h-full relative'}
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
        }}
        style={{ borderRadius, overflow: 'hidden' }}
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
                theme='filled'
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
        {mediaState.focus?.visible ? null : <MediaCore />}
        {mode !== 'audio' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              opacity: loaded ? 1 : 0
            }}
          >
            <MediaBottomBar />
          </div>
        )}
      </div>
    )
  }

  if (onlyCore) {
    return renderCore()
  }
  if (mediaState.layout?.focusMode) {
    if (mode === 'audio') {
      return (
        <>
          <QuickLabelPopover />
          <FocusAudioPage />
        </>
      )
    }
    return (
      <>
        <QuickLabelPopover />
        <FocusVideoPage />
      </>
    )
  }
  if (mediaState.layout?.episode) {
    return (
      <>
        <QuickLabelPopover />
        <MediaCore />
      </>
    )
  }
  return (
    <>
      <div ref={outerContainerRef} className={'relative w-full h-full flex'}>
        <div className={'w-full flex flex-1 justify-center @container overflow-y-auto'}>
          <div
            style={{
              width: fullSize ? '100%' : audioMode ? '64rem' : '100%',
              maxWidth: audioMode || columnLayout || fullSize ? undefined : 'calc((100cqh - 240px) * (16 / 9))'
            }}
            className={'flex h-max flex-col relative gap-5 max-w-full flex-shrink p-8'}
          >
            {renderCore()}
            <MediaDetailsRenderer />
          </div>
        </div>
        <MediaSidebar />
      </div>
      <FocusVideoPage />
    </>
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
    let videoId = U.searchParams.get('v')
    if (!videoId) {
      const splitted = url.split('/')
      const embeded = splitted.findIndex(i => i === 'embed')
      videoId = splitted[embeded + 1]
    }
    if (!videoId) return url
    return `https://www.youtube.com/embed/${videoId}?rel=0&controls=0&cc_load_policy=3&autoplay=1&start=${options?.startTime ? parseInt(`${options.startTime}`) : '0'}`
  }
  if (url.startsWith('baidudisk')) return url
  return url
}
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
const mergableProps: (keyof IMediaState)[] = [
  'exam',
  'websiteUrl',
  'aiChat',
  'aiSummary',
  'onlyCore',
  'thumbnail',
  'releaseDate',
  'name',
  'description',
  'mode',
  'chapters',
  'autoPlay',
  'isPinned',
  'toolbar',
  'subtitleLang',
  'subtitleMode',
  'subtitleList',
  'subtitleFollow',
  'collectionName',
  'metaId',
  'layout',
  'styles',
  'state',
  'labelFolders',
  'labelSortMode',
  'labelPriority',
  'labelScrollOffset',
  'labelFilter',
  'labels',
  'labelType'
]

const Media = (props: MediaProps) => {
  const pageConfig = useContext(PageConfigContext)
  const defaultOpenSidebar = pageConfig.defaultOpenSidebar !== false
  const store = useMemo(() => {
    const store = createStore()
    const { subtitleMode, url, mode, defaultActiveSidebar, autoPlay, currentTime, defaultSidebarVisible } = props.mediaState || {}
    store.set(MediaInstanceAtom, {})
    const outerState = (props.mediaState || {}) as IMediaState
    store.set(MediaStateAtom, {
      ..._.mergeWith(
        {},
        DEFAULT_MEDIA_STATE,
        omitBy(pick(outerState, mergableProps), v => v === undefined),
        {
          jumpTime: currentTime,
          subtitleMode: subtitleMode ?? 'list'
        }
      ),
      url: transformUrl(url, {
        autoPlay,
        startTime: currentTime
      }),
      mode: mode || getMediaMode(url),
      sidebarActive: defaultActiveSidebar ?? DEFAULT_MEDIA_STATE.sidebarActive,
      sidebarVisible: defaultOpenSidebar ? defaultSidebarVisible ?? false : false
    })
    return store
  }, [])
  useLayoutEffect(() => {
    if (!props.mediaState) return
    const currentState = store.get(MediaStateAtom)
    const shouldMerge = pickValues(mergableProps, props.mediaState)
    console.log(currentState, shouldMerge)
    const { url, mode, autoPlay, currentTime } = props.mediaState
    store.set(MediaStateAtom, {
      ...currentState,
      ...shouldMerge,
      subtitleLang: shouldMerge.subtitleLang || currentState.subtitleLang,
      subtitleList: shouldMerge.subtitleList || currentState.subtitleList,
      url: transformUrl(url, {
        autoPlay
      }),
      mode: mode || getMediaMode(url),
      sortedChapters: (props.mediaState.chapters || currentState.chapters)?.slice().sort((b, a) => b.startTime - a.startTime) || []
    })
  }, [props.mediaState])
  useEffect(() => {
    const currentState = store.get(MediaStateAtom)
    store.set(MediaStateAtom, {
      ...currentState,
      currentTime: props.mediaState?.currentTime,
      totalTime: props.mediaState?.totalTime,
      subtitles: [],
      loaded: false,
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

function pickValues<T extends object>(keys: (keyof T)[], object: T): Partial<T> {
  return keys.reduce((acc, key) => {
    acc[key] = key in object ? object[key] : undefined
    return acc
  }, {} as Partial<T>)
}

export default Media
