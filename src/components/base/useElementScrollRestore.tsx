import { RefObject, useCallback, useEffect, useLayoutEffect } from 'react'
import { useNavigation } from 'react-router-dom'
import { useMemoizedFn } from '@/hooks'

type Direction = 'vertical' | 'horizontal'
type ScrollAttribute = 'scrollTop' | 'scrollLeft'
const DIRECTION: { [direction in Direction]: ScrollAttribute } = {
  vertical: 'scrollTop',
  horizontal: 'scrollLeft'
}

export default ({
  elementRef,
  direction = 'vertical',
  elementKey
}: {
  elementRef: RefObject<HTMLElement | undefined>
  direction?: Direction
  elementKey: string
  onScrollRestored: (offset: number) => void
}) => {
  const STORAGE_KEY = `position-storage`
  const navigation = useNavigation()
  const scrollAttribute = DIRECTION[direction]

  const updatePositions = useMemoizedFn(() => {
    const element = elementRef.current
    console.log(element)
    if (!element) return
    let positions = {}
    try {
      const rawPositions = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')
      if (typeof rawPositions === 'object' && rawPositions !== null) {
        positions = rawPositions
      }
    } catch (error) {
      console.warn(`Error parsing scroll positions from sessionStorage:`, error)
    }
    const newPositions = {
      ...positions,
      [elementKey]: element[scrollAttribute]
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newPositions))
  })
  useEffect(() => {
    console.log(navigation)
    if (navigation.state === 'idle') {
      const element = elementRef.current
      if (element) {
        try {
          const positions = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as any
          const stored = positions[elementKey]
          console.log(stored, positions)
          if (typeof stored === 'number') {
            element[scrollAttribute] = stored
          }
        } catch (error: unknown) {
          console.error(error)
          sessionStorage.removeItem(STORAGE_KEY)
        }
      }
    }
  }, [navigation.state, elementRef])

  useEffect(() => {
    elementRef.current?.addEventListener('scroll', updatePositions)
    window.addEventListener('pagehide', updatePositions)
    return () => {
      window.removeEventListener('pagehide', updatePositions)
      elementRef.current?.removeEventListener('scroll', updatePositions)
    }
  }, [])
  return null
}
