import { IYoutubeVideoItem } from '@/core/components/feed/utils/youtube/types'
import { FeedItem } from '~/typings'
import Id from '@/utils/id'

export default async (
  playlistId: string,
  api: string,
  opts?: {
    maxItems?: number
  }
) => {
  const playlistDetails = await fetch(`https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${api}`).then(i => i.json())
  const firstItem = playlistDetails.items[0]
  let resultItems: IYoutubeVideoItem[] = []
  const fetchItems = async (nextPageToken: string) => {
    const items = await fetch(
      `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${api}&pageToken=${nextPageToken}`
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
    `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${api}`
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
    playlistName: firstItem.snippet.title,
    image: firstItem.snippet.thumbnails.default.url
  }
}
