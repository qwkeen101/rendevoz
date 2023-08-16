import { memo, useEffect, useRef, useState } from 'react'
import { useVideoInstance } from './hooks/useVideoInstance'
import { assignProperties } from '@/utils'
import useVideoState from './hooks/useVideoState'
import { Content } from '@/components'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import { ObjectStore } from '@/stores'
import { usePrevious, useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '../setting'
import { WebVTTParser } from 'webvtt-parser'
import { ipcRenderer } from 'electron'
interface VideoCoreProps {
  url?: string
}

const VideoCore = memo(({ url }: VideoCoreProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const instance = useVideoInstance()
  const [videoState, setVideoState] = useVideoState()
  const { loop, muted, paused, volume, currentTime, speed, subtitles, subtitleUrl, mode } = videoState
  const offscreenVideoRef = useRef<HTMLVideoElement>()
  const loopSetting = useSelectGlobalAtomValue(SettingAtom, s => s.video.loop)
  const autoPlaySetting = useSelectGlobalAtomValue(SettingAtom, s => s.video.autoPlay)
  const webviewRef = useRef<HTMLWebViewElement>()
  const webReady = useRef(false)
  const throttleUpdateLastViewTime = useThrottleFn(
    () => {
      videoState.videoId &&
        ObjectStore('video').updateOne({
          id: videoState.videoId,
          lastPlayedTime: currentTime
        })
    },
    { wait: 1000 }
  )
  const previousTime = usePrevious(currentTime)
  useEffect(() => {
    const webview = webviewRef.current
    if (webview) {
      const listener = event => {
        const { channel, args } = event
        console.log(args)
        if (channel === 'event') {
          const e = args[0]
          switch (e.type) {
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

  useEffect(() => {
    if (videoState.subtitleUrl) {
      fetch(videoState.subtitleUrl)
        .then(res => res.text())
        .then(r => {
          const parser = new WebVTTParser()
          const tree = parser.parse(r, 'metadata')
          setVideoState(s => ({ ...s, subtitles: tree.cues }))
        })
    }
  }, [videoState.subtitleUrl])

  useEffect(() => {
    setVideoState(s => ({ ...s, url }))
    if (url) {
      const video = document.createElement('video')
      video.src = url
      offscreenVideoRef.current = video
    }
  }, [url])
  useEffect(() => {
    if (mode === 'video') {
      const video = videoRef.current
      if (video) {
        if (paused) {
          video.pause()
        } else {
          video.play()
        }
      }
    } else {
      if (paused) {
        instance.pause?.()
      } else {
        instance.play?.()
      }
    }
  }, [paused])
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      console.log(volume)
      video.volume = volume ?? 0
    }
  }, [volume])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.playbackRate = speed
    }
  }, [speed])

  useEffect(() => {
    if (autoPlaySetting) {
      setVideoState(s => ({ ...s, paused: false }))
    }
    return () => {
      webReady.current = false
    }
  }, [])
  useEffect(() => {
    throttleUpdateLastViewTime.run()
    const previous = previousTime || 0

    if (currentTime !== undefined) {
      if (Math.abs(currentTime - previous) > 3) {
        console.log('jumped', instance)
        instance.jumpTo?.(currentTime)
      }
    }
  }, [currentTime])
  useEffect(() => {
    if (mode === 'web') {
      const web = webviewRef.current
      if (web && webReady.current) {
        assignProperties(instance, {
          pause: () => webReady.current && web.send('videoEvent', { type: 'stop' }),
          play: () => webReady.current && web.send('videoEvent', { type: 'play' }),
          jumpTo: t => {
            webReady.current && web.send('videoEvent', { type: 'jump', time: t })
          },
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
    } else {
      const video = videoRef.current
      if (video) {
        assignProperties(instance, {
          pause: () => setVideoState(s => ({ ...s, paused: true })),
          play: () => setVideoState(s => ({ ...s, paused: false })),
          loop: () => setVideoState(s => ({ ...s, loop: true })),
          unloop: () => setVideoState(s => ({ ...s, loop: false })),
          getUrl: () => url,
          jumpTo: t => (video.currentTime = t),
          getVideoElement: () => video,
          getOffscreenVideo: () => offscreenVideoRef.current,
          captureCurrentImage: () => {
            return new Promise(res => {
              if (currentTime) {
                instance.captureImage?.(currentTime, { width: 1600, height: 900 }).then(r => {
                  res(r)
                })
              }
            })
          }
        })
      }
    }
  })

  const biliUrl = 'https://www.bilibili.com/video/BV11B4y177kr'
  const youtubeUrl = 'https://www.youtube.com/embed/EFU-r9IWDd0'
  const biliembed = 'https://player.bilibili.com/player.html?bvid=BV1Gy4y1q79F&high_quality=1&danmaku=0'
  // useEffect(() => {
  //   fetch(biliUrl)
  //     .then(res => res.text())
  //     .then(html => {
  //       const videoInfo = html.match(/<script>window\.__INITIAL_STATE__=([\s\S]*?);/)
  //       if (!videoInfo) return
  //       const downloadInfo = html.match(
  //         /\<script\>window\.\_\_playinfo\_\_\=([\s\S]*?)\<\/script\>\<script\>window\.\_\_INITIAL\_STATE\_\_\=/
  //       )
  //       if (!downloadInfo) return
  //       const downloadData = JSON.parse(downloadInfo[1])
  //
  //       // worst quality
  //
  //       const quality = downloadData.data.accept_quality.pop()
  //
  //       const targetQualityVideoUrl = downloadData.data.dash.video.find(i => i.id === quality)?.baseUrl
  //
  //       if (targetQualityVideoUrl) {
  //         fetch(targetQualityVideoUrl, {
  //           referrer: '',
  //           headers: {
  //             bili: biliUrl
  //           },
  //           referrerPolicy: 'no-referrer'
  //         }).then(res => res.blob())
  //       }
  //     })
  // }, [])
  return mode === 'web' ? (
    <Content style={{ width: '100%', paddingBottom: '56.25%', height: 0 }}>
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
    </Content>
  ) : (
    <Content style={{ width: '100%', paddingBottom: '56.25%', height: 0 }}>
      <video
        ref={videoRef}
        src={url}
        loop={loopSetting}
        autoPlay={autoPlaySetting}
        muted={muted}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'clip',
          overflowClipMargin: 'content-box',
          objectFit: 'contain',
          borderRadius: videoState.floated ? '0px 0px 12px 12px' : 12
        }}
        onClick={() => {
          setVideoState(s => ({ ...s, paused: !s.paused }))
        }}
        onDurationChange={e => {
          const duration = e.currentTarget.duration
          setVideoState(s => ({ ...s, totalTime: duration }))
        }}
        onTimeUpdate={e => {
          const currTime = e.currentTarget.currentTime
          setVideoState(s => ({ ...s, currentTime: currTime }))
        }}
      >
        {subtitleUrl && videoState.showSubtitle !== false && <track src={subtitleUrl} kind="captions" default />}
      </video>
    </Content>
  )
})

export default VideoCore
