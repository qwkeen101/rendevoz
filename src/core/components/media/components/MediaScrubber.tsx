import Colors from '@/consts/colors'
import useMediaState from '../hooks/useMediaState'
import { MediaToolbarStateAtom } from '../hooks/useMediaToolbarState'
import { motion } from 'framer-motion'
import { useMediaInstance } from '../hooks/useMediaInstance'
import { memo, useRef, useState } from 'react'
import { useSetAtom } from 'jotai'
import useThrottleFn from '@/hooks/utils/useThrottleFn'

const MediaScrubber = memo(() => {
  const [mediaState, setMediaState] = useMediaState()
  const setToolbarState = useSetAtom(MediaToolbarStateAtom)
  const instance = useMediaInstance()
  const { totalTime = 0 } = mediaState
  const scrubberRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { run: debounceGetThumbnail } = useThrottleFn(
    (time: number) => {
      instance.imageOps?.captureImage?.(time).then(dataUrl => {
        if (dataUrl) {
          setToolbarState(g => ({ ...g, thumbnailUrl: dataUrl }))
        }
      })
    },
    { wait: 200 }
  )

  const handleShowThumbnail = (e: PointerEvent) => {
    const markerBounding = instance.getMarkerContainer?.()?.getBoundingClientRect()
    if (markerBounding) {
      const { clientX } = e
      if (clientX >= markerBounding.right || clientX <= markerBounding.left) return
      const x = Math.max(0, Math.min(markerBounding.left + markerBounding.width, clientX))
      const currTime = ((x - markerBounding.left) / markerBounding.width) * totalTime
      debounceGetThumbnail(currTime)
      const chapter = mediaState.sortedChapters?.findLastIndex(i => i.startTime < currTime)
      setToolbarState(s => ({
        ...s,
        currentHoveringChapterIdx: chapter,
        thumbnailPosition: {
          x,
          y: markerBounding.top
        },
        thumbnailChapterName: chapter !== undefined ? mediaState.sortedChapters?.[chapter]?.name : s.thumbnailChapterName,
        currentScrubberTime: currTime,
        currentHoverTime: currTime,
        thumbnailVisible: true
      }))
    }
  }
  return (
    <div
      ref={containerRef}
      style={{
        left: 0,
        position: 'absolute',
        top: '50%',
        transition: 'all 0.3s ease',
        width: '100%',
        opacity: mediaState.progressbarHovering || isDragging ? 1 : 0,
        pointerEvents: 'none',
        zIndex: 100
      }}
      role="video-scrubber"
    >
      <motion.div
        ref={scrubberRef}
        drag="x"
        onPointerMove={handleShowThumbnail}
        style={{
          height: 13,
          cursor: 'pointer',
          width: 13,
          background: mediaState.mode === 'audio' ? Colors.Font.Primary : Colors.Font.White,
          borderRadius: 999,
          pointerEvents: 'auto',
          position: 'absolute'
        }}
        whileHover={{
          scale: 1.2,
          x: isDragging ? undefined : '-50%'
        }}
        animate={{
          x: isDragging ? undefined : '-50%',
          y: '-50%',
          left: `${((mediaState.currentTime || 0) / totalTime) * 100}%`
        }}
        transition={{
          x: {
            duration: 0
          },
          left: {
            duration: 0
          },
          scale: {
            duration: 0.2
          }
        }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={e => {
          setIsDragging(true)
          setToolbarState(s => ({ ...s, draggingScrubber: true }))
        }}
        whileTap={{
          opacity: 0
        }}
        onDragEnd={() => {
          setIsDragging(false)
          setToolbarState(s => {
            if (s.currentScrubberTime !== undefined) {
              setMediaState(b => ({ ...b, currentTime: s.currentScrubberTime - 1.5, jumpTime: s.currentScrubberTime }))
            }
            return { ...s, draggingScrubber: false, thumbnailVisible: false }
          })
        }}
        onDrag={(e, info) => {
          handleShowThumbnail(e as PointerEvent)
        }}
        dragConstraints={containerRef}
      ></motion.div>
    </div>
  )
})

export default MediaScrubber
