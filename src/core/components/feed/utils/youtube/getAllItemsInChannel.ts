import { IYoutubeVideoItem } from '@/core/components/feed/utils/youtube/types'
import { FeedItem } from '~/typings'
import Id from '@/utils/id'

export default async (
  channelId: string,
  api: string,
  opts?: {
    maxItems?: number
  }
) => {
  const channelDetails = await fetch(
    `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&part=contentDetails&id=${channelId}&key=${api}`,
    {
      method: 'GET'
    }
  ).then(i => i.json())
  const firstItem = channelDetails.items[0]
  const uploadPlaylistId = firstItem.contentDetails.relatedPlaylists.uploads
  if (uploadPlaylistId) {
    let resultItems: IYoutubeVideoItem[] = []
    const fetchItems = async (nextPageToken: string) => {
      const items = await fetch(
        `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadPlaylistId}&key=${api}&pageToken=${nextPageToken}`
      ).then(i => i.json())
      resultItems = [...resultItems, ...items.items]
      if (resultItems.length > (opts?.maxItems ?? 100)) {
        return
      }
      if (items.nextPageToken) {
        await fetchItems(items.nextPageToken)
      }
    }
    const items = await fetch(
      `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadPlaylistId}&key=${api}`
    ).then(i => i.json())
    resultItems = [...resultItems, ...items.items]
    if (items.nextPageToken) {
      await fetchItems(items.nextPageToken)
    }
    const transformedFeedItems: FeedItem[] = resultItems.slice(0, opts?.maxItems ?? 100).map(i => ({
      feedType: 'youtube',
      image: i.snippet.thumbnails.standard?.url,
      date: new Date(i.snippet.publishedAt).getTime(),
      link: 'https://www.youtube.com/watch?v=' + i.snippet.resourceId.videoId,
      description: i.snippet.description,
      title: i.snippet.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      id: Id.getId()
    }))
    console.log(transformedFeedItems)
    return {
      items: transformedFeedItems,
      channelName: firstItem.snippet.title,
      image: firstItem.snippet.thumbnails.default.url
    }
  }
}
