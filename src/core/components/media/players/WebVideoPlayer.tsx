import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import useMediaState, { MediaStateAtom } from '@/core/components/media/hooks/useMediaState'
import { assignProperties } from '@/utils'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import youtubeCaptionScrapper, { YoutubeCaptionParser } from '@/core/components/media/utils/youtubeCaptionScrapper'
const WebVideoPlayer = () => {
  const webviewRef = useRef<HTMLWebViewElement>()
  const webReady = useRef(false)
  const [mediaState, setMediaState] = useMediaState()
  const instance = useMediaInstance()
  const { paused, url } = mediaState
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
              setMediaState(s => ({ ...s, currentTime: e.time }))
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
    if (url.includes('youtube')) {
      youtubeCaptionScrapper(url.split('embed/')[1]).then(res => {
        console.log(res)
        res.forEach(async i => {
          const text = await fetch(i.baseUrl).then(res => res.text())
          const data = YoutubeCaptionParser(text)
          console.log(i.name.simpleText)
          setMediaState(s => ({
            ...s,
            subtitleLang: i.name.simpleText,
            subtitleList: [
              ...(s.subtitleList || []),
              {
                lang: i.name.simpleText,
                value: data
              }
            ]
          }))
        })
      })
    }
  }, [url])
  useEffect(() => {
    if (mediaState.loaded && web && webReady.current) {
      if (paused) {
        web.send('videoEvent', { type: 'stop' })
      } else {
        web.send('videoEvent', { type: 'play' })
      }
    }
  }, [paused, mediaState.loaded])
  useEffect(() => {
    if (mediaState.loaded && mediaState.autoPlay && webReady.current) {
      web.send('videoEvent', { type: 'play' })
    }
  }, [mediaState.loaded, mediaState.autoPlay])
  useEffect(() => {
    if (mediaState.jumpTime !== undefined && mediaState.loaded && web) {
      if (Math.abs(mediaState.jumpTime - (mediaState.currentTime || 0)) > 1) {
        web.send('videoEvent', { type: 'jump', time: mediaState.jumpTime })
      }
    }
  }, [mediaState.jumpTime, mediaState.loaded])
  useEffect(() => {
    if (mediaState.currentTime !== undefined && mediaState.loaded && web) {
      web.send('videoEvent', { type: 'jump', time: mediaState.currentTime })
    }
  }, [mediaState.loaded])
  if (mediaState.loaded && web) {
    assignProperties(instance, {
      imageOps: {
        ...instance.imageOps,
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
      },
      getMediaContainer: () => webviewRef.current
    })
  }
  return (
    <webview
      ref={webviewRef}
      sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
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
