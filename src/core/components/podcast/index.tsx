import { memo, useEffect, useMemo } from 'react'
import usePodcastInstance, { IPodcastInstance } from '@/core/components/podcast/hooks/usePodcastInstance'
import { waitFor } from '@/utils'
import podcastServices from '@/core/components/podcast/services/podcastServices'
import { RouterProvider } from 'react-router-dom'
import routers from './routers'

export default memo(({ onInstanceInitializd }: { onInstanceInitializd?: (i: IPodcastInstance) => void }) => {
  const i = usePodcastInstance()
  useMemo(() => {
    waitFor(
      () => !!i.navigate,
      () => {
        onInstanceInitializd?.(i)
      },
      {
        microTask: true
      }
    )
  }, [])
  useEffect(() => {
    podcastServices.updateAllPodcastInfo()
    return () => {
      i.navigate = undefined
    }
  })
  return <RouterProvider router={routers}></RouterProvider>
})
