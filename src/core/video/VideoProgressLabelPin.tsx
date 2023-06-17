import { ObjectStore } from '@/stores'
import { VideoStateAtom } from './hooks/useVideoState'
import { useSelectAtomValue } from '@/hooks'
import { Icon } from '@/components'
import { VideoToolbarStateAtom } from './hooks/useVideoToolbarState'
import { useSetAtom } from 'jotai'
import { useVideoInstance } from './hooks/useVideoInstance'
import { memo } from 'react'
import { DraggableElement, DraggingElement } from '../global'
import { VideoSidebarStateAtom } from './hooks/useVideoSidebarState'

const VideoProgressLabelPin = memo(({ labelId }: { labelId: number }) => {
  const videoLabel = ObjectStore('videoLabel').useValue(labelId)
  const instance = useVideoInstance()
  const floated = useSelectAtomValue(VideoStateAtom, s => s.floated)
  const totalTime = useSelectAtomValue(VideoStateAtom, s => s.totalTime)
  const sortedChapters = useSelectAtomValue(VideoStateAtom, s => s.sortedChapters)
  const currentHoverLabelId = useSelectAtomValue(VideoToolbarStateAtom, s => s.currentHoverLabelId)
  const sidebarLabelsVisible = useSelectAtomValue(VideoSidebarStateAtom, s => s.showLabels)
  const setToolbarState = useSetAtom(VideoToolbarStateAtom)
  if (!videoLabel || !totalTime) return null

  const { videoTime } = videoLabel
  const currentChapterIdx = sortedChapters?.findLastIndex(i => i.startTime <= videoTime)
  return (
    <div
      data-video-pin
      data-pin-chapter-idx={currentChapterIdx}
      onPointerMove={e => {
        e.currentTarget.style.opacity = '0.2'
        const markerBounding = instance.getMarkerContainer?.()?.getBoundingClientRect()
        if (markerBounding) {
          setToolbarState(s => ({
            ...s,
            thumbnailPosition: {
              x: e.clientX,
              y: markerBounding.top
            },
            currentHoverTime: ((e.clientX - markerBounding.left) / markerBounding.width) * totalTime,
            thumbnailLabelName: videoLabel.name,
            thumbnailVisible: true
          }))
        }
      }}
      onPointerLeave={e => {
        setToolbarState(s => ({
          ...s,
          thumbnailLabelName: undefined,
          thumbnailVisible: false
        }))
        e.currentTarget.style.removeProperty('opacity')
      }}
      onClick={e => {
        e.stopPropagation()
        setToolbarState(s => ({ ...s, currentFocusLabelId: labelId }))
        if (floated || !sidebarLabelsVisible) {
          instance.jumpTo?.(videoTime)
        }
      }}
      style={{
        position: 'absolute',
        paddingBottom: 18,
        bottom: -12,
        left: `${(videoTime / totalTime) * 100}%`,
        zIndex: 50,
        transition: 'all 0.3s ease',
        transform: `translateX(-50%)`,
        cursor: 'pointer',
        opacity: currentHoverLabelId === labelId ? 0.2 : 1
      }}
    >
      <DraggableElement
        hoverElement={<DraggingElement text="Drop to add video label"></DraggingElement>}
        draggingDetails={{
          type: 'videoLabel',
          id: labelId,
          videoTime: videoLabel.videoTime
        }}
      >
        <Icon name="park-pushpin" fill="#FFE7A0" theme="filled" size={12} />
      </DraggableElement>
    </div>
  )
})

export default VideoProgressLabelPin
