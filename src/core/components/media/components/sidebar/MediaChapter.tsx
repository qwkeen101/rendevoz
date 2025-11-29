import { css } from '@emotion/css'
import { CSSProperties, memo, useEffect, useRef, useState } from 'react'
import { IMediaChapter, XYPosition } from '~/typings'
import { useMediaInstance } from '../../hooks/useMediaInstance'
import useMediaState from '../../hooks/useMediaState'
import useMediaToolbarState from '../../hooks/useMediaToolbarState'
import { useRafFn } from '@/hooks'
import { Colors } from '@/consts'
import classNames from 'classnames'

interface MediaChapterProps {
  percent: number
  startTime: number
  endTime: number
  chapter?: IMediaChapter
  loadBg?: string
  progressStyle?: CSSProperties
  idx: number
}
const progressBgColor = 'rgba(255,255,255,0.1)'
const loadProgessBgColor = 'linear-gradient(to right, rgba(251, 196, 36, 0.15), rgba(251, 196, 36, 1))'

const progressBarPadding = css({
  position: 'absolute',
  width: '100%',
  height: 24,
  bottom: -8,
  zIndex: 30
})

const barClass = 'absolute left-0 bottom-0 w-full h-full origin-top-left'
const MediaChapter = memo(({ startTime, endTime, progressStyle, loadBg }: MediaChapterProps) => {
  const instance = useMediaInstance()

  const [mediaState, setMediaState] = useMediaState()
  const [toolbarState, setToolbarState] = useMediaToolbarState()
  const { progressbarHovering, currentTime } = mediaState

  const { currentHoverTime = 0, currentScrubberTime = 0, draggingScrubber } = toolbarState
  console.log({
    currentScrubberTime,
    currentTime
  })
  const hoverPercent =
    currentHoverTime > endTime ? 1 : currentHoverTime < startTime ? 0 : (currentHoverTime - startTime) / (endTime - startTime)
  const loadTime = (draggingScrubber ? currentScrubberTime ?? currentTime : currentTime) ?? 0
  const loadPercent = !endTime ? 0 : loadTime < startTime ? 0 : loadTime > endTime ? 1 : (loadTime - startTime) / (endTime - startTime)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafPointerMove = useRafFn((e: PointerEvent) => {
    const { clientX } = e
    const container = containerRef.current
    if (container) {
      const bounding = container.getBoundingClientRect()
      const offset = clientX - bounding.left
      if (offset >= 0) {
        console.log(offset)
        const ratio = offset / bounding.width
        setToolbarState(s => ({ ...s, currentHoverTime: (endTime - startTime) * ratio }))
      }
    }
  })

  return (
    <div
      onClick={() => {
        const clickTime = hoverPercent * (endTime - startTime) + startTime
        instance.actionOps?.jumpTo(clickTime)
      }}
      onPointerEnter={() => setMediaState(s => ({ ...s, progressbarHovering: true }))}
      onPointerLeave={() => setMediaState(s => ({ ...s, progressbarHovering: false }))}
      onPointerDown={e => {
        const clickTime = hoverPercent * (endTime - startTime) + startTime
        instance.startDragScrubber?.(clickTime, e)
      }}
      ref={containerRef}
      onPointerMove={rafPointerMove}
      className='w-full h-full group relative cursor-pointer'
    >
      <div className={progressBarPadding}></div>
      <div
        className={'scale-y-90 group-hover:scale-y-150 transition-transform h-full'}
        style={{
          overflow: 'hidden',
          backgroundColor: mediaState.mode === 'audio' ? Colors.Background.ButtonHover : progressBgColor,
          ...progressStyle,
          ...mediaState.styles?.progressStyle
        }}
      >
        <div
          className={barClass}
          style={{
            transform: `scaleX(${loadPercent})`,
            background: loadBg ?? loadProgessBgColor,
            borderTopRightRadius: 999,
            borderBottomRightRadius: 999
          }}
        ></div>
      </div>
    </div>
  )
})

export default MediaChapter
