import { Content } from '@/components'
import { css } from '@emotion/css'
import { memo, useEffect, useState } from 'react'
import { IMediaChapter, XYPosition } from '~/typings'
import { useMediaInstance } from '../../hooks/useMediaInstance'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import useMediaState from '../../hooks/useMediaState'
import useMediaToolbarState from '../../hooks/useMediaToolbarState'
import { useRafFn } from '@/hooks'
import { Colors } from '@/consts'

interface MediaChapterProps {
  percent: number
  startTime: number
  endTime: number
  chapter?: IMediaChapter
  idx: number
}
const progressBgColor = 'rgba(255,255,255,0.2)'
const loadProgessBgColor = 'rgba(255,255,255,0.8)'
const hoverProgressBgColor = 'rgba(255,255,255,0.5)'


const progressBarPadding = css({
  position: 'absolute',
  width: '100%',
  height: 24,
  bottom: -8,
  zIndex: 30
})
const progressList = css({
  background: progressBgColor,
  height: '100%',
  transform: 'scaleY(0.6)',
  transition: 'transform 0.3s ease'
})
const MediaChapter = memo(({ percent, startTime, endTime, idx, chapter }: MediaChapterProps) => {
  const [chapterState, setChapterState] = useState<{
    thumbnailVisible: boolean
    thumbnailPosition?: XYPosition
    thumbnailUrl?: string
    hovering?: boolean
  }>({
    thumbnailVisible: false
  })
  const instance = useMediaInstance()
  const { hovering } = chapterState

  const [mediaState, setMediaState] = useMediaState()
  const [toolbarState, setToolbarState] = useMediaToolbarState()
  const { progressbarHovering } = mediaState

  const { currentHoverTime = 0, currentScrubberTime = 0, draggingScrubber } = toolbarState
  const realHovering = draggingScrubber ? currentScrubberTime >= startTime && currentScrubberTime <= endTime : hovering
  const realProgressBarHovering = progressbarHovering || draggingScrubber
  const hoverPercent =
    currentHoverTime > endTime ? 1 : currentHoverTime < startTime ? 0 : (currentHoverTime - startTime) / (endTime - startTime)

  const { run: debounceGetThumbnail } = useThrottleFn(
    async () => {
      const time = (endTime - startTime) * hoverPercent + startTime
      const data = await instance.imageOps?.captureImage(time)
      setToolbarState(g => ({ ...g, thumbnailUrl: data }))
    },
    { wait: 200 }
  )

  const realLoadPercent =
    currentScrubberTime < startTime ? 0 : currentScrubberTime > endTime ? 1 : (currentScrubberTime - startTime) / (endTime - startTime)
  useEffect(() => {
    if (toolbarState.currentHoveringChapterIdx !== undefined) {
      const hoverIdx = toolbarState.currentHoveringChapterIdx
      if (hoverIdx > idx) {
        setChapterState(s => ({ ...s, hoverPercent: 1 }))
      } else if (hoverIdx < idx) {
        setChapterState(s => ({ ...s, hoverPercent: 0 }))
      }
    }
  }, [toolbarState.currentHoveringChapterIdx])

  const rafPointerMove = useRafFn(e => {
    const markerBounding = instance.getMarkerContainer?.()?.getBoundingClientRect()
    if (markerBounding) {
      const containerBounding = markerBounding
      const { clientX } = e
      debounceGetThumbnail()
      setChapterState(s => ({
        ...s,
        hovering: true
      }))
      setMediaState(s => {
        if (s.progressbarHovering) {
          return s
        } else {
          return { ...s, progressbarHovering: true }
        }
      })
      setToolbarState(s => ({
        ...s,
        currentHoveringChapterIdx: idx,
        thumbnailPosition: {
          x: clientX,
          y: containerBounding.top
        },
        thumbnailChapterName: chapter?.name,
        currentHoverTime: ((e.clientX - containerBounding.left) / containerBounding.width) * (mediaState.totalTime || 0),
        thumbnailVisible: true
      }))
    }
  })

  if (hovering) {
    if (draggingScrubber && (currentScrubberTime > endTime || currentScrubberTime < startTime)) {
      setChapterState(s => ({ ...s, hovering: false }))
    }
    if (toolbarState.currentHoveringChapterIdx !== idx) {
      setChapterState(s => ({ ...s, hovering: false }))
    }
  }
  return (
    <div
      data-chapter-idx={idx}
      onPointerLeave={e => {
        rafPointerMove.cancel()
        if (e.relatedTarget instanceof Element) {
          if (e.relatedTarget.closest('[data-video-pin=true]')) {
            const pinChapterIdx = e.relatedTarget.getAttribute('data-pin-chapter-idx')
            if (pinChapterIdx) {
              if (Number(pinChapterIdx) !== idx) {
                setChapterState(s => ({ ...s, hovering: false }))
              }
              return
            } else {
              setChapterState(s => ({ ...s, hovering: false }))
            }

            return
          }
          if (e.relatedTarget.closest("[role='video-scrubber']")) {
            if (currentScrubberTime > startTime && currentScrubberTime < endTime) return
            else {
              setChapterState(s => ({ ...s, hovering: false }))
            }
            return
          }
          const closetChapter = e.relatedTarget.closest(`[data-chapter-idx='${idx}']`)
          if (closetChapter && Number(closetChapter?.getAttribute('data-chapter-idx')) !== idx) {
            setMediaState(s => ({ ...s, progressbarHovering: false }))
            setChapterState(s => ({ ...s, hovering: false }))
            setToolbarState(s => ({ ...s, thumbnailVisible: false }))
            return
          }
        }
        setToolbarState(s => ({ ...s, thumbnailVisible: false }))
        setMediaState(s => ({ ...s, progressbarHovering: false }))
        setChapterState(s => ({ ...s, hovering: false }))
      }}
      onClick={() => {
        const clickTime = hoverPercent * (endTime - startTime) + startTime
        instance.actionOps?.jumpTo(clickTime)
      }}
      onPointerMove={rafPointerMove}
      style={{
        width: `${percent * 100}%`,
        height: '100%',
        transition: 'all 0.2s ease',
        position: 'relative',
        cursor: 'pointer',
        transform: realHovering && percent !== 1 ? 'scaleY(1.6)' : undefined
      }}
    >
      <div className={progressBarPadding}></div>
      <Content
        className={progressList}
        style={{
          overflow: 'hidden',
          borderRadius: 16,
          transform: realProgressBarHovering ? 'none' : undefined,
          backgroundColor: mediaState.mode === 'audio' ? Colors.Background.ButtonHover : undefined,
          ...mediaState.styles?.progressStyle
        }}
      >
        <div
          className="load-progress"
          style={{
            transform: `scaleX(${realLoadPercent})`,
            background: mediaState.mode === 'audio' ? Colors.Background.ButtonActive : loadProgessBgColor
          }}
        ></div>
        <div
          className="hover-progress"
          style={{
            transform: `scaleX(${hoverPercent})`,
            background: mediaState.mode === 'audio' ? Colors.Background.Border : hoverProgressBgColor,
            opacity: realProgressBarHovering ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        ></div>
      </Content>
    </div>
  )
})

export default MediaChapter
