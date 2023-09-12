import { atom, useAtom, useSetAtom } from 'jotai'
import { RefObject, useEffect, useLayoutEffect } from 'react'
import useMeasure from '@/hooks/utils/useMeasure'
import { useDebounceEffect } from '@/hooks'
import useVideoSidebarState from '@/core/video/hooks/useVideoSidebarState'

export const VideoLayoutAtom = atom<{
  allColumn: boolean
  rightColumn: boolean
}>({
  allColumn: false,
  rightColumn: false
})

const useChangeVideoLayout = (containerRef: RefObject<HTMLElement>, videoRef: RefObject<HTMLElement>) => {
  const [videoLayout, setVideoLayout] = useAtom(VideoLayoutAtom)
  const containerSize = useMeasure(containerRef)
  const videoSize = useMeasure(videoRef)
  const [sidebarState] = useVideoSidebarState()
  useLayoutEffect(() => {
    const { width: videoWidth } = videoSize
    const { width: containerWidth } = containerSize
    if (!videoWidth || !containerWidth) return
    console.log({
      containerWidth,
      videoWidth
    })
    if (videoWidth < 600) {
      const leftWidth = containerWidth - (sidebarState.showSubtitles ? sidebarState.subtitleBarRealtimeWidth : 0)
      if (leftWidth >= 660) {
        setVideoLayout({ allColumn: false, rightColumn: true })
      } else {
        setVideoLayout({ allColumn: true, rightColumn: true })
      }
      return
    } else {
      if (videoLayout.allColumn) {
        const leftWidth = containerWidth - (sidebarState.showSubtitles ? sidebarState.subtitleBarRealtimeWidth : 0)
        console.log(leftWidth)
        if (leftWidth >= 660) {
          setVideoLayout({ allColumn: false, rightColumn: true })
          return
        }
      }

      if (videoLayout.rightColumn) {
        const leftWidth =
          containerWidth -
          (sidebarState.showLabels || sidebarState.showChapters ? sidebarState.rightBarRealtimeWidth : 0) -
          (sidebarState.showSubtitles ? sidebarState.subtitleBarRealtimeWidth : 0)
        if (leftWidth >= 660) {
          setVideoLayout({ allColumn: false, rightColumn: false })
        }
      }
    }
  }, [containerSize, videoSize, sidebarState])
}
export default useChangeVideoLayout
