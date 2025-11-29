import { ObjectStore } from '@/api/stores'

export default async (id: string, type: 'channel' | 'playlist' | 'video') => {
  if (type === 'channel') {
    return await ObjectStore('youtubeChannel').fetchByConditions({ channelId: id })
  }
  if (type === 'playlist') {
    return await ObjectStore('youtubePlaylist').fetchByConditions({ playlistId: id })
  }
  return await ObjectStore('youtubeVideo').fetchByConditions({ videoId: id })
}
