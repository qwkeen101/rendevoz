import { AnimatePopover, Content } from '@/components'
import { css } from '@emotion/css'
import { useState } from 'react'
import { XYPosition } from '~/typings'
import { captureVideoFrame, getVideoSnap } from './utils'
import { useVideoInstance } from './hooks/useVideoInstance'
import { useDebounceFn } from '@/hooks'
import { intervalToDuration } from 'date-fns'
import FontSize from '@/consts/font'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import useVideoState from './hooks/useVideoState'
import Colors from '@/consts/colors'

interface VideoChapterProps {
  percent: number
  loadPercent: number
  startTime: number
  endTime: number
}
const progressBgColor = 'rgba(255,255,255,0.2)'
const previewProgressBgColor = 'rgba(255,255,255,0.3)'
const loadProgessBgColor = 'rgba(255,255,255,0.8)'
const hoverProgressBgColor = 'rgba(255,255,255,0.5)'
const zeroPad = (num: number) => String(num).padStart(2, '0')

const progressBarPadding = css({
  position: 'absolute',
  width: '100%',
  height: 36,
  bottom: -12,
  zIndex: 30
})
const progressList = css({
  background: progressBgColor,
  height: '100%',
  transform: 'scaleY(0.6)',
  transition: 'transform 0.3s ease'
})
const VideoChapter = ({ percent, loadPercent, startTime, endTime }: VideoChapterProps) => {
  const [chapterState, setChapterState] = useState<{
    hoverPercent: number
    thumbnailVisible: boolean
    thumbnailPosition?: XYPosition
    thumbnailUrl?: string
    hovering?: boolean
  }>({
    hoverPercent: 0,
    thumbnailVisible: false
  })
  const instance = useVideoInstance()
  const { hoverPercent, thumbnailVisible, thumbnailPosition, thumbnailUrl, hovering } = chapterState
  const [videoState, setVideoState] = useVideoState()
  const { progressbarHovering } = videoState
  const { run: debounceGetThumbnail } = useThrottleFn(
    async () => {
      const videoEle = instance.getOffscreenVideo?.()
      if (videoEle) {
        const time = (endTime - startTime) * hoverPercent
        const data = await captureVideoFrame(videoEle, time)
        setChapterState(g => ({ ...g, thumbnailUrl: data }))
      }
    },
    { wait: 200 }
  )
  const currentHoverTime = intervalToDuration({ start: 0, end: (hoverPercent * (endTime - startTime) + startTime) * 1000 })

  return (
    <div
      onPointerLeave={e => {
        setVideoState(s => ({ ...s, progressbarHovering: false }))
        setChapterState(s => ({ ...s, thumbnailVisible: false, hovering: false }))
      }}
      onClick={() => {
        instance.jumpTo?.(hoverPercent * (endTime - startTime) + startTime)
      }}
      onPointerMove={e => {
        const containerBounding = e.currentTarget.getBoundingClientRect()
        const { clientX, clientY } = e
        const hoverPercent = (clientX - containerBounding.left) / containerBounding.width
        debounceGetThumbnail()
        setChapterState(s => ({
          ...s,
          hoverPercent,
          thumbnailVisible: true,
          hovering: true,
          thumbnailPosition: {
            x: clientX,
            y: containerBounding.y
          }
        }))
        setVideoState(s => {
          if (s.progressbarHovering) {
            return s
          } else {
            return { ...s, progressbarHovering: true }
          }
        })
      }}
      style={{
        width: `${percent * 100}%`,
        height: '100%',
        transition: 'all 0.2s ease',
        position: 'relative',
        cursor: 'pointer',
        transform: hovering && percent !== 1 ? 'scaleY(1.8)' : undefined
      }}
    >
      <div className={progressBarPadding}></div>
      <Content
        className={progressList}
        style={{
          transform: progressbarHovering ? 'none' : undefined
        }}
      >
        <div
          className="load-progress"
          style={{
            transform: `scaleX(${loadPercent})`,
            background: loadProgessBgColor
          }}
        ></div>
        <div
          className="hover-progress"
          style={{
            transform: `scaleX(${hoverPercent})`,
            background: hoverProgressBgColor,
            opacity: videoState.progressbarHovering ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        ></div>
      </Content>
      <AnimatePopover
        backdropFilter={false}
        containerStyle={{
          pointerEvents: 'none'
        }}
        content={
          <Content flex column alignItems="center">
            <img width={220} src={thumbnailUrl} style={{ borderRadius: 10 }} />
            <div
              style={{ fontSize: FontSize['12px'], textShadow: '0 0 4px rgba(0,0,0,0.75)', padding: '5px 9px', color: Colors.Font.White }}
            >{`${currentHoverTime.hours ? zeroPad(currentHoverTime.minutes || 0) : currentHoverTime.minutes}:${zeroPad(
              currentHoverTime.seconds || 0
            )}`}</div>
          </Content>
        }
        visible={thumbnailVisible}
        position={{
          left: thumbnailPosition?.x,
          top: thumbnailPosition?.y
        }}
        positions={['top']}
      ></AnimatePopover>
    </div>
  )
}

export default VideoChapter
