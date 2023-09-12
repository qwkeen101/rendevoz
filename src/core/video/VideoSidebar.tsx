import { Content } from '@/components'
import VideoChapterController from './VideoChapterController'
import VideoLabelController from './VideoLabelController'
import { memo, useRef, useState } from 'react'
import useVideoSidebarState from './hooks/useVideoSidebarState'
import { Resizable } from 're-resizable'

const VideoSidebar = memo(({ width }: { width: number | string }) => {
  const [sidebarState, setSidebarState] = useVideoSidebarState()
  return sidebarState.showChapters || sidebarState.showLabels ? (
    <Resizable
      size={{
        height: width === '100%' ? 0 : '100%',
        width: width === '100%' ? width : sidebarState.rightBarWidth
      }}
      onResizeStop={(event, direction, elementRef, delta) => {
        const width = elementRef.clientWidth
        setSidebarState(s => ({ ...s, rightBarWidth: width }))
      }}
      onResize={(event, direction, elementRef) => {
        setSidebarState(s => ({ ...s, rightBarRealtimeWidth: elementRef.clientWidth }))
      }}
      maxWidth={width === '100%' ? undefined : 800}
      enable={
        width === '100%'
          ? {}
          : {
              left: true
            }
      }
      // minHeight={width === '100%' ? 300 : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: width === '100%' ? 2 : undefined
      }}
    >
      {sidebarState.showChapters && <VideoChapterController />}
      {sidebarState.showLabels && <VideoLabelController />}
    </Resizable>
  ) : null
})

export default VideoSidebar
