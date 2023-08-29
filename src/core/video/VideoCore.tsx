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
import BaidudiskVideoPlayer from '@/core/video/players/BaidudiskVideoPlayer'
import WebVideoPlayer from '@/core/video/players/WebVideoPlayer'
import LocalVideoPlayer from '@/core/video/players/LocalVideoPlayer'
import './loading.css'
import { Colors } from '@/consts'

interface VideoCoreProps {
  url?: string
}

const VideoCore = memo(({ url }: VideoCoreProps) => {
  const instance = useVideoInstance()
  const [videoState, setVideoState] = useVideoState()
  const { currentTime, mode } = videoState

  const autoPlaySetting = useSelectGlobalAtomValue(SettingAtom, s => s.video.autoPlay)

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
    if (autoPlaySetting) {
      setVideoState(s => ({ ...s, autoPlay: autoPlaySetting, paused: false }))
    }
  }, [autoPlaySetting])

  useEffect(() => {
    throttleUpdateLastViewTime.run()
    setVideoState(s => ({...s, jumpTime: undefined}))
  }, [currentTime])

  assignProperties(instance, {
    pause: () => setVideoState(s => ({ ...s, paused: true })),
    play: () => setVideoState(s => ({ ...s, paused: false })),
    loop: () => setVideoState(s => ({ ...s, loop: true })),
    unloop: () => setVideoState(s => ({ ...s, loop: false })),
    getUrl: () => url,
    jumpTo: t => setVideoState(s => ({ ...s, jumpTime: t })),
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
  if (!url) return null
  return (
    <Content
      style={{
        width: '100%',
        paddingBottom: '56.25%',
        height: 0,
        borderRadius: videoState.floated ? '0px 0px 12px 12px' : 12,
        overflow: 'hidden'
      }}
    >
      {!videoState.loaded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 999 }}>
          <LoadingAnimation />
        </div>
      )}
      {mode === 'web' && <WebVideoPlayer url={url} />}
      {mode === 'video' && <LocalVideoPlayer url={url} />}
      {mode === 'baidudisk' && <BaidudiskVideoPlayer url={url} />}
    </Content>
  )
})

const LoadingAnimation = () => {
  const [dots, setDotsNum] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setDotsNum(s => {
        const next = s + 1
        return next > 3 ? 0 : next
      })
    }, 300)
    return () => {
      clearInterval(interval)
    }
  }, [])
  return (
    <div className="loading_center">
      <Content flex>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
        <div className="loading_wave"></div>
      </Content>
      <div style={{ fontSize: 18, color: Colors.Font.Description, marginTop: 20 }}>
        Loading video {Array.from(Array(dots).keys()).map(i => `.`)}
      </div>
    </div>
  )
}

export default VideoCore
