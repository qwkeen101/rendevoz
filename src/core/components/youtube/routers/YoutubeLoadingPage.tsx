import { useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { DotLoading } from '@/components'

type Params = {
  type: 'channel' | 'playlist' | 'video'
  id: string
  playlistAppId?: string
  channelAppId?: string
  playlistId?: string
}
export default () => {
  const [isFailed, setIsFailed] = useState(false)
  const [target, setTarget] = useState<{
    type: 'video' | 'playlist' | 'channel'
    id: number
  }>()
  const instance = useYoutubeInstance()
  const searchParams = Object.fromEntries(useSearchParams()[0].entries()) as Params
  useLayoutEffect(() => {
    if (searchParams.type === 'video') {
      if (searchParams.playlistId) {
        instance.addPlaylist?.(searchParams.playlistId).then(res => {
          instance
            .addVideo?.(searchParams.id, {
              history: true,
              playlistAppId: res.id
            })
            .then(res =>
              setTarget({
                type: 'video',
                id: res.id
              })
            )
        })
        return
      }
      instance
        .addVideo?.(searchParams.id, {
          history: true,
          playlistAppId: Number(searchParams.playlistAppId),
          channelAppId: Number(searchParams.channelAppId)
        })
        .then(res => {
          setTarget({
            id: res.id,
            type: 'video'
          })
        })
    }
    if (searchParams.type === 'playlist') {
      instance.addPlaylist?.(searchParams.id).then(res => {
        setTarget({
          id: res.id,
          type: 'playlist'
        })
      })
    }
    if (searchParams.type === 'channel') {
      instance.addChannel?.(searchParams.id).then(res => {
        setTarget({
          id: res.id,
          type: 'channel'
        })
      })
    }
  }, [searchParams])
  useLayoutEffect(() => {
    if (target) {
      instance.goTo?.(target.id, target.type, { replace: true })
    }
  }, [target])

  return (
    <div className={'size-full flex items-center justify-center'}>
      <DotLoading />
    </div>
  )
}
