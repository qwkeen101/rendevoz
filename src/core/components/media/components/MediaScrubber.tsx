import Colors from '@/consts/colors'
import useMediaState from '../hooks/useMediaState'
import { MediaToolbarStateAtom } from '../hooks/useMediaToolbarState'
import { useMediaInstance } from '../hooks/useMediaInstance'
import { memo, RefObject, useRef, useState } from 'react'
import { useSetAtom } from 'jotai'
import Draggable from 'react-draggable'
import { useSelectAtomValue } from '@/hooks'

const MediaScrubber = memo(({ parentRef }: { parentRef: RefObject<HTMLDivElement> }) => {
  const [mediaState, setMediaState] = useMediaState()
  const setToolbarState = useSetAtom(MediaToolbarStateAtom)
  const instance = useMediaInstance()
  const scrubberTime = useSelectAtomValue(MediaToolbarStateAtom, s => s.currentScrubberTime)
  instance.startDragScrubber = (t, e) => {
    const event = new MouseEvent('mousedown', e)
    scrubberRef.current?.dispatchEvent(event)
    setIsDragging(true)
    setToolbarState(s => ({ ...s, draggingScrubber: true, currentScrubberTime: t }))
  }
  const { totalTime = 0, currentTime = 0 } = mediaState
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const scrubberRef = useRef<HTMLElement>()
  const handleDragScrubber = (e: PointerEvent, drag?: boolean) => {
    const parentBounding = parentRef.current?.getBoundingClientRect()
    if (parentBounding) {
      const { clientX } = e
      let currTime = 0
      if (clientX >= parentBounding.right) {
        currTime = totalTime
      } else if (clientX <= parentBounding.left) {
        currTime = 0
      } else {
        const x = Math.max(0, Math.min(parentBounding.left + parentBounding.width, clientX))
        currTime = Math.min(1, (x - parentBounding.left) / parentBounding.width) * totalTime
      }
      setToolbarState(s => ({
        ...s,
        currentScrubberTime: drag ? currTime : s.currentScrubberTime,
        currentHoverTime: currTime
      }))
    }
  }
  const invisibleScrubber = isDragging === false && mediaState.progressbarHovering === false
  return (
    <div
      ref={containerRef}
      style={{
        left: 0,
        position: 'absolute',
        top: '50%',
        transition: 'opacity 0.2s ease',
        width: '100%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        zIndex: 100
      }}
      role='video-scrubber'
    >
      <Draggable
        axis={'x'}
        position={{
          y: 0,
          x: ((scrubberTime ?? currentTime) / totalTime) * (containerRef.current?.clientWidth ?? 0)
        }}
        onStart={e => {
          setIsDragging(true)
          setToolbarState(s => ({ ...s, draggingScrubber: true, currentScrubberTime: currentTime }))
        }}
        onStop={() => {
          setIsDragging(false)
          setToolbarState(s => {
            if (s.currentScrubberTime !== undefined) {
              setMediaState(b => ({ ...b, currentTime: s.currentScrubberTime, jumpTime: s.currentScrubberTime }))
            }
            return { ...s, draggingScrubber: false, currentScrubberTime: undefined }
          })
        }}
        nodeRef={scrubberRef}
        onDrag={e => {
          handleDragScrubber(e as PointerEvent, true)
        }}
        bounds={'parent'}
      >
        <div
          ref={scrubberRef}
          style={{
            pointerEvents: 'auto',
            width: 1,
            height: 1
          }}
          onPointerMove={() => {
            setMediaState(s => ({ ...s, progressbarHovering: true }))
          }}
          onPointerLeave={() => {
            setMediaState(s => ({ ...s, progressbarHovering: false }))
          }}
        >
          <div
            className={'hover:scale-[1.2] transition-transform -translate-y-1/2 -translate-x-1/2'}
            style={{
              height: 13,
              cursor: 'pointer',
              width: 13,
              background: mediaState.mode === 'audio' ? Colors.Font.PrimaryNoOpacity : Colors.Font.WhiteNoOpacity,
              borderRadius: 999,
              '--tw-scale-x': invisibleScrubber ? 0 : isDragging ? 1.2 : undefined,
              '--tw-scale-y': invisibleScrubber ? 0 : isDragging ? 1.2 : undefined
            }}
          ></div>
        </div>
      </Draggable>
    </div>
  )
})

export default MediaScrubber
