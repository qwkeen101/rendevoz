export type IYoutubeVideoItem = {
  id: string
  etag: string
  kind: string
  snippet: {
    channelId: string
    channelTitle: string
    description: string
    playlistId: string
    publishedAt: string
    resourceId: {
      kind: string
      videoId: string
    }
    thumbnails: {
      standard: {
        url: string
        height: number
        width: number
      }
    }
    title: string
  }
}
