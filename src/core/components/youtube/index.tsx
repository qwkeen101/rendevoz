import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { IYoutubeInstance } from '~/typings'
import { ObjectStore } from '@/api/stores'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { waitFor } from '@/utils'
import routers from '@/core/components/youtube/routers'

export default memo(({ onInstanceInitialized }: { onInstanceInitialized?: (i: IYoutubeInstance) => void }) => {
  const instance = useYoutubeInstance()
  useEffect(() => {
    ObjectStore('youtubeFolder').getAll()
    waitFor(
      () => !!instance.navigate,
      () => {
        onInstanceInitialized?.(instance)
      }
    )
  }, [])
  return <RouterProvider router={routers}></RouterProvider>
})
