import { memo, useEffect, useRef } from 'react'
import { useVideoInstance } from './hooks/useVideoInstance'
import { assignProperties } from '@/utils'
import useVideoState from './hooks/useVideoState'
import { Content } from '@/components'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import { ObjectStore } from '@/stores'
import { useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '../setting'

interface VideoCoreProps {
  url?: string
}

const VideoCore = memo(({ url }: VideoCoreProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const instance = useVideoInstance()
  const [videoState, setVideoState] = useVideoState()
  const { loop, muted, paused, volume, currentTime, speed } = videoState
  const offscreenVideoRef = useRef<HTMLVideoElement>()
  const loopSetting = useSelectGlobalAtomValue(SettingAtom, s => s.video.loop)
  const autoPlaySetting = useSelectGlobalAtomValue(SettingAtom, s => s.video.autoPlay)
  const webviewRef = useRef<HTMLWebViewElement>()
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
  useEffect(() => {
    const webview = webviewRef.current
    if (webview) {
      webview.addEventListener('load-commit', () => {
        console.log('finish')
        webview.insertCSS(
          'html body *:not(video) { position: absolute !important; top: -100000px; width: 0px !important; height: 0px !important; overflow: visible !important; background: transparent !important;} html body { overflow: hidden; background: transparent !important}'
        )
        webview.insertCSS(
          'video {position: fixed !important; width: 100vw !important; height: 100vh !important; top: 0px !important; left: 0px !important; z-index: 9999999 !important;object-fit: contain !important;background: #0f0f0f !important;}'
        )
      })
    }
  }, [])
  useEffect(() => {
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
        getOffscreenVideo: () => offscreenVideoRef.current
      })
    }
  })
  useEffect(() => {
    setVideoState(s => ({ ...s, url }))
    if (url) {
      const video = document.createElement('video')
      video.src = url
      offscreenVideoRef.current = video
    }
  }, [url])
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      if (paused) {
        video.pause()
      } else {
        video.play()
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
    throttleUpdateLastViewTime.run()
    if (currentTime !== undefined && videoRef.current?.currentTime !== undefined) {
      if (Math.abs(currentTime - videoRef.current.currentTime) > 3) {
        videoRef.current.currentTime = currentTime
      }
    }
  }, [currentTime])

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
  }, [])
  return (
    // <webview
    //   ref={webviewRef}
    //   src="https://www.bilibili.com/video/BV1UL4y1F7zk/?vd_source=352adb6d14f9a406216668a504da3cf6"
    //   style={{
    //     width: '100%',
    //     height: 900,
    //     pointerEvents: 'none'
    //   }}
    // ></webview>
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
      />
    </Content>
  )
})

export default VideoCore
