import { RefObject } from 'react'
import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import { DotLoading } from '@/components'
import YoutubeVideos from '@/core/components/youtube/YoutubeVideos'

export default ({ topic, scrollElementRef }: { topic: string; scrollElementRef: RefObject<HTMLDivElement> }) => {
  const {
    dashboard: { topicToVideos }
  } = useYoutubeData()
  const videos = topicToVideos?.[topic]
  if (!videos?.items.length) {
    return (
      <div className={'size-full flex items-center justify-center'}>
        <DotLoading />
      </div>
    )
  }
  const items = videos.items,
    token = videos.token
  return (
    <YoutubeVideos
      large
      scrollElementRef={scrollElementRef}
      items={items.map(i => ({
        kind: 'youtube#video',
        id: i.id.videoId!,
        snippet: i.snippet,
        contentDetails: i.contentDetails,
        statistics: i.statistics
      }))}
      showChannel
      scrollKey={'youtube_dashboard_pane'}
      hasMore={token !== undefined}
      onLoadMore={() => {
        useYoutubeData.fetchDashboardTopicVideos(topic, token)
      }}
    />
  )
}
