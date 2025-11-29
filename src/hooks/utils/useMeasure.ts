import { useLayoutEffect, useState } from 'react'

export default (ref: React.RefObject<HTMLElement>) => {
  const [bounds, setBounds] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  function onResize([entry]) {
    setBounds({
      width: entry.borderBoxSize[0].inlineSize,
      height: entry.borderBoxSize[0].blockSize
    })
  }
  useLayoutEffect(() => {
    const observer = new ResizeObserver(onResize)
    const element = ref.current
    if (element) {
      setBounds({ width: element.offsetWidth, height: element.offsetHeight })
      observer.observe(element)
    }
    return () => {
      observer.disconnect()
    }
  }, [ref.current])
  return bounds
}
