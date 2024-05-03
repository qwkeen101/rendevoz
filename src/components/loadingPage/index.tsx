import { useEffect } from 'react'
import GlobalStates from '@/api/global/states'
export default () => {
  const initialized = GlobalStates.useValue('initialized')
  const loadingState = GlobalStates.useValue('loading')
  useEffect(() => {
    const scene = document.body.querySelector('.scene') as HTMLDivElement | undefined
    if (scene) {
      if (initialized) {
        scene.style.display = 'none'
      } else {
        scene.style.display = 'flex'
      }
    }
  }, [initialized])
  useEffect(() => {
    const scene = document.body.querySelector('.scene') as HTMLDivElement | undefined
    if (scene) {
      const message = scene.querySelector('#message')
      if (message && loadingState.currentState) {
        message.replaceChildren(loadingState.currentState)
      }
    }
  }, [loadingState.currentState])
  return null
}
