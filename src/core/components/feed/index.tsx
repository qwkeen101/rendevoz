import { memo, useEffect, useRef } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import { IFeedInstance } from '~/typings'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { waitFor } from '@/utils'
import routers from './routers'

export default memo(({ onInstanceInitialized }: { onInstanceInitialized?: (i: IFeedInstance) => void }) => {
  const instance = useFeedInstance()
  useEffect(() => {
    ObjectStore('feedFolder').getAll()
    ObjectStore('feedCollection').getAll()
    waitFor(
      () => {
        return !!instance.feedOps
      },
      () => {
        onInstanceInitialized?.(instance)
      }
    )
  }, [])
  return <RouterProvider router={routers}></RouterProvider>
})
