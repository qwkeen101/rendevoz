import { Content } from '@/components'
import VideoChapterController from './VideoChapterController'
import VideoLabelController from './VideoLabelController'
import { memo, useRef, useState } from 'react'
import useVideoSidebarState from './hooks/useVideoSidebarState'
import { Resizable } from 're-resizable'

const VideoSidebar = memo(({ width }: { width: number | string }) => {
  const [sidebarState, setSidebarState] = useVideoSidebarState()
  const [innerWidth, setInnerWidth] = useState(420)
  return sidebarState.showChapters || sidebarState.showLabels ? (
    <Resizable
      size={{
        height: width === '100%' ? 0 : '100%',
        width: width === '100%' ? width : innerWidth
      }}
      onResizeStop={(event, direction, elementRef, delta) => {
        const width = elementRef.clientWidth
        setInnerWidth(width)
      }}
      maxWidth={1200}
      enable={
        width === '100%'
          ? {}
          : {
              left: true
            }
      }
      minHeight={width === '100%' ? 300 : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: width === '100%' ? 1 : undefined }}
    >
      {sidebarState.showChapters && <VideoChapterController />}
      {sidebarState.showLabels && <VideoLabelController />}
    </Resizable>
  ) : null
})

export default VideoSidebar
