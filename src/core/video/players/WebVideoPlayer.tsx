import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import useVideoState, { VideoStateAtom } from '@/core/video/hooks/useVideoState'
import { assignProperties } from '@/utils'
import { useVideoInstance } from '@/core/video/hooks/useVideoInstance'

const WebVideoPlayer = ({ url }: { url: string }) => {
  const webviewRef = useRef<HTMLWebViewElement>()
  const webReady = useRef(false)
  const [videoState, setVideoState] = useVideoState()
  const instance = useVideoInstance()
  const { paused, currentTime } = videoState
  useEffect(() => {
    const webview = webviewRef.current
    if (webview) {
      const listener = event => {
        const { channel, args } = event
        if (channel === 'event') {
          const e = args[0]
          switch (e.type) {
            case 'loaded':
              setVideoState(s => ({ ...s, loaded: true }))
              break
            case 'timeUpdate': {
              setVideoState(s => ({ ...s, currentTime: e.time }))
              break
            }
            case 'play': {
              setVideoState(s => ({ ...s, paused: false }))
              break
            }
            case 'pause': {
              setVideoState(s => ({ ...s, paused: true }))
              break
            }
            case 'durationChange': {
              setVideoState(s => ({ ...s, totalTime: e.duration }))
              break
            }
          }
        }
      }
      const readyListener = () => {
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
  const web = webviewRef.current

  useEffect(() => {
    if (videoState.loaded && web && webReady.current) {
      if (paused) {
        web.send('videoEvent', { type: 'stop' })
      } else {
        web.send('videoEvent', { type: 'play' })
      }
    }
  }, [paused, videoState.loaded])

  useEffect(() => {
    if (videoState.jumpTime !== undefined && videoState.loaded && web) {
      if (Math.abs(videoState.jumpTime - (videoState.currentTime || 0)) > 1) {
        web.send('videoEvent', { type: 'jump', time: videoState.jumpTime })
      }
    }
  }, [videoState.jumpTime, videoState.loaded])
  if (videoState.loaded && web) {
    assignProperties(instance, {
      captureCurrentImage: () => {
        webReady.current && web.send('videoEvent', { type: 'captureSnapshot' })
        return new Promise(res => {
          const handler = e => {
            const { channel, args } = e
            if (channel === 'event' && args[0].type === 'captureImage') {
              res(args[0].url)
              web.removeEventListener('ipc-message', handler)
            }
          }
          web.addEventListener('ipc-message', handler)
        })
      }
    })
  }
  return (
    <webview
      ref={webviewRef}
      webpreferences="video"
      src={url}
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
}

export default WebVideoPlayer
