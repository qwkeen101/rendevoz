import { RefObject, useEffect, useRef, useState } from 'react'

const useIsIn = (outerRef?: RefObject<HTMLElement>) => {
  const [isIn, setIsIn] = useState(false)
  const ref = outerRef || useRef<HTMLElement>(null)
  useEffect(() => {
    const pointerHandler = (e: PointerEvent) => {
      if (e.type === 'pointermove' || e.type === 'pointerenter') {
        !isIn && setIsIn(true)
      } else {
        setIsIn(false)
      }
    }
    const container = ref.current
    if (container) {
      container.addEventListener('pointerenter', pointerHandler)
      container.addEventListener('pointerleave', pointerHandler)
      container.addEventListener('pointermove', pointerHandler)
      return () => {
        container.removeEventListener('pointerenter', pointerHandler)
        container.removeEventListener('pointerleave', pointerHandler)
        container.removeEventListener('pointermove', pointerHandler)
      }
    }
  })
  return {
    ref,
    isIn
  }
}

export default useIsIn
