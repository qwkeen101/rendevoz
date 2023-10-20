import { ObjectStore } from '@/stores'
import { MediaStateAtom } from './hooks/useMediaState'
import { useSelectAtomValue } from '@/hooks'
import { Icon } from '@/components'
import { MediaToolbarStateAtom } from './hooks/useMediaToolbarState'
import { useSetAtom } from 'jotai'
import { useMediaInstance } from './hooks/useMediaInstance'
import { memo } from 'react'
import { Colors } from '@/consts'

const MediaProgressLabelPin = memo(({ labelId }: { labelId: number }) => {
  const labelType = useSelectAtomValue(MediaStateAtom, s => s.labelType)
  const mediaLabel = ObjectStore(labelType).useValue(labelId)
  const instance = useMediaInstance()
  const floated = useSelectAtomValue(MediaStateAtom, s => s.floated)
  const totalTime = useSelectAtomValue(MediaStateAtom, s => s.totalTime)
  const sortedChapters = useSelectAtomValue(MediaStateAtom, s => s.sortedChapters)
  const currentHoverLabelId = useSelectAtomValue(MediaToolbarStateAtom, s => s.currentHoverLabelId)
  const setToolbarState = useSetAtom(MediaToolbarStateAtom)
  if (!mediaLabel || !totalTime) return null

  const { time } = mediaLabel
  const currentChapterIdx = sortedChapters?.findLastIndex(i => i.startTime <= time)
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
            thumbnailLabelName: mediaLabel.name,
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
        // setToolbarState(s => ({ ...s, currentFocusLabelId: labelId }))
        instance.actionOps?.jumpTo(time)
      }}
      style={{
        position: 'absolute',
        bottom: 4,
        left: `${(time / totalTime) * 100}%`,
        zIndex: 50,
        transition: 'all 0.3s ease',
        transform: `translateX(-50%)`,
        cursor: 'pointer',
        opacity: currentHoverLabelId === labelId ? 0.2 : 1
      }}
    >
      <Icon name="park-pushpin" fill={Colors.Common.SelectColor} theme="filled" size={12} />
    </div>
  )
})

export default MediaProgressLabelPin
