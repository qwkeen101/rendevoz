import { RefObject, useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { useBlocker, useNavigation, useNavigationType } from 'react-router-dom'
import { useDebounceFn, useMemoizedFn } from '@/hooks'

type Direction = 'vertical' | 'horizontal'
type ScrollAttribute = 'scrollTop' | 'scrollLeft'
const DIRECTION: { [direction in Direction]: ScrollAttribute } = {
  vertical: 'scrollTop',
  horizontal: 'scrollLeft'
}

const STORAGE_KEY = `position-storage`

const useElementScrollRestore = ({
  elementRef,
  direction = 'vertical',
  elementKey,
  disable
}: {
  elementRef?: RefObject<HTMLElement | undefined>
  direction?: Direction
  elementKey: string
  disable?: boolean
}) => {
  const navigation = useNavigation()
  const navigationType = useNavigationType()
  const scrollAttribute = DIRECTION[direction]
  const updatePositions = () => {
    const element = elementRef?.current
    if (!element) return
    updatePosition(elementKey, element[scrollAttribute])
  }
  useEffect(() => {
    const ele = elementRef?.current
    if (ele) {
      ele.addEventListener('scrollend', updatePositions)
      return () => ele.removeEventListener('scrollend', updatePositions)
    }
  })
  const position = useMemo(() => {
    if (navigationType !== 'POP') {
      return undefined
    }
    const positions = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as any
    const stored = positions[elementKey] as number | undefined
    return stored
  }, [navigation.state, navigationType, elementKey])
  useLayoutEffect(() => {
    if (!elementRef) return
    const element = elementRef.current
    if (element) {
      if (navigation.state === 'idle' && navigationType === 'POP' && !disable) {
        if (element) {
          try {
            if (typeof position === 'number') {
              element[scrollAttribute] = position
            }
          } catch (error: unknown) {
            console.error(error)
            sessionStorage.removeItem(STORAGE_KEY)
          }
        }
      }
    }
  }, [navigationType, navigation.state, elementRef, elementKey, disable])

  return position
}

const updatePosition = (key: string, pos: number) => {
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
    [key]: pos
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newPositions))
}

useElementScrollRestore.updatePosition = updatePosition
export default useElementScrollRestore as typeof useElementScrollRestore & {
  updatePosition: typeof updatePosition
}
