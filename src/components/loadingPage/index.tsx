import { useAtomValue } from 'jotai'
import { initializedAtom } from '@/Initializer'
import { useEffect } from 'react'
export default () => {
  const initialized = useAtomValue(initializedAtom)
  useEffect(() => {
    const scene = document.body.querySelector('.scene') as HTMLDivElement | undefined
    if (scene) {
      if (initialized) {
        scene.style.display = 'none'
      } else {
        scene.style.display = 'grid'
      }
    }
  }, [initialized])
  return null
}
