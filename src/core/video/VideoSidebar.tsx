import { Content } from '@/components'
import VideoChapterController from './VideoChapterController'
import VideoLabelController from './VideoLabelController'
import { memo, useRef } from 'react'
import useVideoSidebarState from './hooks/useVideoSidebarState'

const VideoSidebar = memo(({ width }: { width: number | string }) => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [sidebarState, setSidebarState] = useVideoSidebarState()
  return sidebarState.showChapters || sidebarState.showLabels ? (
    <Content column ref={sidebarRef} gap={20} flex style={{ width, maxWidth: 1200, height: '100%' }}>
      {sidebarState.showChapters && <VideoChapterController />}
      {sidebarState.showLabels && <VideoLabelController />}
    </Content>
  ) : null
})

export default VideoSidebar
