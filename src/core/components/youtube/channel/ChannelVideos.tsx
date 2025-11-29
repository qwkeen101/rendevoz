import { useLayoutEffect } from 'react'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import YoutubeServices from '@/core/components/youtube/YoutubeServices'
import toast from 'react-hot-toast'
import { DotLoading } from '@/components'
import YoutubeVideos from '@/core/components/youtube/YoutubeVideos'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { EmptyList } from '@/core/components'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'

export default ({ channelId }: { channelId: string }) => {
  const [state, setState] = useYoutubeState()
  const dataCache = state.dataCache.channel[channelId]
  const cache = dataCache?.videoTab
  const search = dataCache?.search
  const items = search?.query ? search?.videoResults?.map(i => ({ ...i, id: i.id.videoId })) : cache?.items
  const token = cache?.token
  const instance = useYoutubeInstance()
  const { t } = useTranslation()
  const handleLoad = async () => {
    if (cache?.isLoadingMore) return
    setVideoState(s => ({ ...s, isLoadingMore: true }))
    try {
      const res = await YoutubeServices.getVideosOfChannel(channelId, { token, details: true })
      console.log(res)
      setVideoState(s => ({
        ...s,
        isLoadingMore: false,
        token: res?.token,
        hasMore: !!res?.token,
        items: [...(s?.items ?? []), ...(res?.items || [])]
      }))
    } catch (e) {
      toast.error(t(trans.Errors.NetworkError))
      setVideoState(s => ({ ...s, failed: true }))
    } finally {
      setVideoState(s => ({ ...s, isLoadingMore: false }))
    }
  }
  useLayoutEffect(() => {
    if (!cache?.items) {
      handleLoad()
    }
  }, [])
  const setVideoState = (updater: (curr: typeof cache) => Partial<typeof cache>) => {
    setState(s => ({
      ...s,
      dataCache: {
        ...s.dataCache,
        channel: {
          ...s.dataCache.channel,
          [channelId]: {
            ...s.dataCache.channel[channelId],
            videoTab: updater(s.dataCache.channel[channelId]?.videoTab)
          }
        }
      }
    }))
  }
  if (!items) {
    return (
      <div className={'w-full grow flex items-center justify-center'}>
        <DotLoading />
      </div>
    )
  }

  if (items && !items.length) {
    return <EmptyList />
  }
  if (!instance.scrollElementRef) return null
  return (
    <YoutubeVideos
      hasMore={search?.query ? !!search.videoHasMore : !!cache?.hasMore}
      scrollElementRef={instance.scrollElementRef}
      items={items}
      size={14}
      onLoadMore={() => {
        if (search?.query) {
          instance.search?.(undefined, channelId)
          return
        }
        handleLoad()
      }}
    />
  )
}
