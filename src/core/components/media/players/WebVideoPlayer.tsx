import { memo, useEffect, useRef } from 'react'
import { useGetMediaState, useSelectMediaState, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { assignProperties } from '@/utils'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import useThrottleUpdateCurrentTime from '@/core/components/media/hooks/useThrottleUpdateCurrentTime'

const WebVideoPlayer = memo(() => {
  const webviewRef = useRef<HTMLWebViewElement>()
  const webReady = useRef(false)
  const setMediaState = useSetMediaState()
  const instance = useMediaInstance()
  const get = useGetMediaState()
  const updateTime = useThrottleUpdateCurrentTime()
  const { paused, url, loaded, autoPlay, jumpTime, speed, volume, muted } = useSelectMediaState(s => ({
    paused: s.paused,
    url: s.url,
    muted: s.muted,
    loaded: s.loaded,
    speed: s.speed,
    autoPlay: s.autoPlay,
    volume: s.volume,
    jumpTime: s.jumpTime
  }))
  useEffect(() => {
    const webview = webviewRef.current
    if (webview) {
      const listener = event => {
        const { channel, args } = event
        if (channel === 'event') {
          const e = args[0]
          switch (e.type) {
            case 'loaded':
              setMediaState(s => ({ ...s, loaded: true }))
              break
            case 'timeUpdate': {
              updateTime(e.time)
              break
            }
            case 'play': {
              setMediaState(s => ({ ...s, paused: false }))
              break
            }
            case 'pause': {
              setMediaState(s => ({ ...s, paused: true }))
              break
            }
            case 'durationChange': {
              setMediaState(s => ({ ...s, totalTime: e.duration }))
              break
            }
          }
        }
      }
      const readyListener = () => {
        if (webReady.current === false) {
          setMediaState(s => ({ ...s, loaded: true }))
        }
        webReady.current = true
      }
      const destoryListener = () => {
        webReady.current = false
      }
      webview.addEventListener('ipc-message', listener)
      webview.addEventListener('dom-ready', readyListener)
      webview.addEventListener('destroyed', destoryListener)
      return () => {
        webview.removeEventListener('ipc-message', listener)
        webview.removeEventListener('dom-ready', readyListener)
        webview.removeEventListener('destroyed', destoryListener)
      }
    }
  })

  useEffect(() => {
    return () => {
      setMediaState(s => ({ ...s, loaded: false, jumpTime: s.currentTime }))
    }
  }, [])

  const web = webviewRef.current

  useEffect(() => {
    if (loaded && web && webReady.current) {
      if (paused) {
        web.send('videoEvent', { type: 'stop' })
      } else {
        web.send('videoEvent', { type: 'play' })
      }
    }
  }, [paused, loaded])

  useEffect(() => {
    if (loaded && web && webReady.current) {
      if (volume !== undefined) {
        web.send('videoEvent', { type: 'volume', volume: volume })
      }
    }
  }, [volume, loaded])

  useEffect(() => {
    if (loaded && web && webReady.current) {
      if (muted !== undefined) {
        web.send('videoEvent', { type: 'mute', muted })
      }
    }
  }, [muted, loaded])

  useEffect(() => {
    if (loaded && web && webReady.current && speed !== undefined) {
      web.send('videoEvent', { type: 'speed', speed })
    }
  }, [loaded, speed])

  useEffect(() => {
    if (loaded && webReady.current) {
      if (autoPlay) {
        web.send('videoEvent', { type: 'play' })
      }
    }
  }, [loaded, autoPlay])
  useEffect(() => {
    if (jumpTime !== undefined && loaded && web) {
      web.send('videoEvent', { type: 'jump', time: jumpTime })
    }
  }, [jumpTime, loaded])
  useEffect(() => {
    if (get().currentTime !== undefined && loaded && web) {
      web.send('videoEvent', { type: 'jump', time: get().currentTime })
    }
  }, [loaded])
  if (loaded && web) {
    assignProperties(instance, {
      imageOps: {
        ...instance.imageOps,
        captureCurrentImage: () => {
          webReady.current && web.send('videoEvent', { type: 'captureSnapshot' })
          return new Promise(res => {
            const handler = e => {
              const { channel, args } = e
              if (channel === 'event' && args[0].type === 'captureImage') {
                console.log(args[0].url)
                if (args[0].url?.replace('data:,', '')?.length) {
                  res(args[0].url)
                } else {
                  res('')
                }
                web.removeEventListener('ipc-message', handler)
              }
            }
            web.addEventListener('ipc-message', handler)
          })
        }
      },
      getMediaContainer: () => webviewRef.current
    })
  }
  return (
    <webview
      ref={webviewRef}
      sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts'
      webpreferences='video'
      src={url}
      disablewebsecurity={true}
      httpreferrer={'https://www.youtube.com'}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    ></webview>
  )
})

export default WebVideoPlayer
