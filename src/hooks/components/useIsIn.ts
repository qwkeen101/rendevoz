import { useEffect, useRef, useState } from 'react'

const useIsIn = () => {
  const [isIn, setIsIn] = useState(false)
  const ref = useRef<HTMLElement>()
  useEffect(() => {
    const pointerHandler = (e: PointerEvent) => {
      if (e.type === 'pointerenter') {
        setIsIn(true)
      } else {
        setIsIn(false)
      }
    }
    const container = ref.current
    if (container) {
      container.addEventListener('pointerenter', pointerHandler)
      container.addEventListener('pointerleave', pointerHandler)
      return () => {
        container.removeEventListener('pointerenter', pointerHandler)
        container.removeEventListener('pointerleave', pointerHandler)
      }
    }
  })
  return {
    ref,
    isIn
  }
}

export default useIsIn
