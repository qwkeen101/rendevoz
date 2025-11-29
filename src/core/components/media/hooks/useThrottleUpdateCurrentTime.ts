import { useThrottleFn } from '@/hooks'
import { useSelectMediaState, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { useLayoutEffect } from 'react'

export default () => {
  const jumpTime = useSelectMediaState(s => s.jumpTime)
  const setMediaState = useSetMediaState()
  const instance = useMediaInstance()
  useLayoutEffect(() => {
    if (jumpTime) {
      throttle.cancel()
    }
  }, [jumpTime])
  const throttle = useThrottleFn(
    (time: number) => {
      setMediaState(s => ({ ...s, currentTime: time, jumpTime: undefined }))
      instance.on({ type: 'update', updater: curr => ({ ...curr, currentTime: time }) })
    },
    {
      wait: 1000
    }
  )
  return (t: number) => {
    throttle.run(t)
  }
}
