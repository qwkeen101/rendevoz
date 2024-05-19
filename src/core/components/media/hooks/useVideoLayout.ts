import { atom, useAtom } from 'jotai'
import { RefObject, useLayoutEffect } from 'react'
import useMeasure from '@/hooks/utils/useMeasure'

export const MediaLayoutAtom = atom(false)

const useChangeMediaLayout = (containerRef: RefObject<HTMLElement>) => {
  const [, setVideoLayout] = useAtom(MediaLayoutAtom)
  const containerSize = useMeasure(containerRef)
  useLayoutEffect(() => {
    if (!containerSize.width) return
    if (containerSize.width <= 1000) {
      setVideoLayout(true)
    } else {
      setVideoLayout(false)
    }
  }, [containerSize.width])
  return containerSize.width || 0
}
export default useChangeMediaLayout
