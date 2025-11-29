import { GlobalSetting } from '@/core'

type CommonYoutubeResult<T> = {
  kind: string
  nextPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
  items: T[]
}
export type IYoutubeChannelItem = {
  kind: 'youtube#channel'
  statistics?: IYoutubeStatistics
  snippet: {
    title: string
    description: string
    customUrl?: string
    publishedAt: string
    channelId: string
    thumbnails: {
      default: {
        url: string
      }
      medium: {
        url: string
      }
      high: {
        url: string
      }
    }
  }
}

export type IYoutubeSearchResultItem = {
  kind: 'youtube#searchResult'
  etag: string
  id:
    | {
        kind: 'youtube#playlist'
        playlistId: string
      }
    | {
        kind: 'youtube#channel'
        channelId: string
      }
    | {
        kind: 'youtube#video'
        videoId: string
      }
  statistics?: IYoutubeStatistics
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    channelTitle: string
    thumbnails: {
      default: {
        url: string
      }
      medium: {
        url: string
      }
      high: {
        url: string
      }
    }
  }
  contentDetails?: {
    duration?: string | number
  }
}
export type IYoutubePlaylistItem = {
  kind: 'youtube#playlist'
  id: string
  contentDetails: {
    itemCount: number
  }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    channelTitle: string
    thumbnails: {
      default: {
        url: string
      }
      medium: {
        url: string
      }
      high: {
        url: string
      }
    }
  }
}

export type IYoutubeVideoItem = {
  kind: 'youtube#video'
  id: string
  snippet: {
    publishedAt: string
    title: string
    description: string
    playlistId?: string
    thumbnails: {
      default: {
        url: string
      }
      medium: {
        url: string
      }
      high: {
        url: string
      }
    }
    channelTitle: string
    channelId: string
    tags: string[]
  }
  statistics?: IYoutubeStatistics
  contentDetails?: {
    // youtube iso 8601 format duration, eg: PT1H5M10S
    duration: string
  }
}
export type IYoutubeStatistics = {
  viewCount?: string
  subscriberCount?: string
  videoCount?: string
}
const YoutubeServices = {
  getApiKey: () => {
    const key = GlobalSetting.getSetting().general.youtubeApiKey
    return key
  },
  getChannel: async (id: string | string[]) => {
    const key = YoutubeServices.getApiKey()
    if (!key) return
    const params = new URLSearchParams()
    const idArr = Array.isArray(id) ? id : [id]
    params.append('part', 'statistics')
    params.append('part', 'contentDetails')
    params.append('part', 'snippet')
    params.append('maxResults', '50')
    params.append('key', key)
    idArr.forEach(id => {
      params.append('id', id)
    })
    const url = `https://youtube.googleapis.com/youtube/v3/channels?${params.toString()}`
    const res = await fetch(url).then(i => i.json())
    const channels = res.items as IYoutubeChannelItem[] | undefined
    return {
      items: channels
    }
  },
  getStatistics: async (id: string[], type: 'channel' | 'video' | 'playlist') => {
    const key = YoutubeServices.getApiKey()
    if (!key) return
    const params = new URLSearchParams()
    if (type === 'playlist') {
      params.append('part', 'contentDetails')
    } else {
      params.append('part', 'statistics')
    }
    params.append('maxResults', '50')
    params.append('key', key)
    id.forEach(i => {
      params.append('id', i)
    })
    const target = type === 'channel' ? 'channels' : type === 'video' ? 'videos' : 'playlists'
    const url = `https://youtube.googleapis.com/youtube/v3/${target}?${params.toString()}`
    const res = await fetch(url, {}).then(i => i.json())

    if (res) {
      if (type === 'playlist') {
        const result = res as CommonYoutubeResult<{
          id: string
          contentDetails: {
            itemCount: number
          }
        }>
        return {
          items: result.items.map(i => ({
            id: i.id,
            statistics: {
              videoCount: `${i.contentDetails.itemCount ?? 0}`
            } as IYoutubeStatistics
          }))
        }
      }
      const result = res as CommonYoutubeResult<{
        id: string
        statistics: IYoutubeStatistics
      }>
      return {
        items: result.items
      }
    }
  },
  search: async (
    query: string,
    options?: {
      type?: ('playlist' | 'channel' | 'video')[]
      token?: string
      channelId?: string
      details?: boolean
    }
  ) => {
    const key = YoutubeServices.getApiKey()
    if (!key) return
    const params = new URLSearchParams()
    params.append('part', 'snippet')
    params.append('order', 'relevance')
    params.append('q', query)
    params.append('maxResults', '50')
    params.append('key', key)
    options?.type?.forEach(t => {
      params.append('type', t)
    })
    if (options?.channelId) {
      params.append('channelId', options.channelId)
    }
    if (options?.token) {
      params.append('pageToken', options.token)
    }
    const url = `https://youtube.googleapis.com/youtube/v3/search?${params.toString()}`
    const res = await fetch(url, {}).then(i => i.json())
    if (res) {
      const result = res as CommonYoutubeResult<IYoutubeSearchResultItem>
      if (options?.details !== false) {
        const videoIds = result.items.map(i => i.id.kind === 'youtube#video' && i.id.videoId).filter(i => i) as string[]
        const videoDetails = videoIds.length ? await YoutubeServices.getVideo(videoIds) : undefined
        const playlistIds = result.items.map(i => i.id.kind === 'youtube#playlist' && i.id.playlistId).filter(i => i) as string[]
        const playlistDetails = playlistIds.length ? await YoutubeServices.getPlaylist(playlistIds) : undefined
        const channelIds = result.items.map(i => i.id.kind === 'youtube#channel' && i.id.channelId).filter(i => i) as string[]
        const channelDetails = channelIds.length ? await YoutubeServices.getChannel(channelIds) : undefined
        const m = new Map(
          [...(videoDetails?.items || []), ...(playlistDetails?.items || []), ...(channelDetails?.items || [])].map(i => [i.id, i])
        )
        result.items.forEach(i => {
          if (i.id.kind === 'youtube#video') {
            const details = m.get(i.id.videoId)
            if (details) {
              i.contentDetails = details.contentDetails
              i.statistics = details.statistics
            }
          }
          if (i.id.kind === 'youtube#channel') {
            const details = m.get(i.id.channelId)
            if (details) {
              i.contentDetails = details.contentDetails
              i.statistics = details.statistics
            }
          }
          if (i.id.kind === 'youtube#playlist') {
            const details = m.get(i.id.playlistId)
            if (details) {
              i.contentDetails = details.contentDetails
            }
          }
        })
      }
      return {
        items: result.items,
        token: result.nextPageToken
      }
    }
  },
  getPlaylistOfChannel: async (
    channelId: string,
    options?: {
      token?: string
      max?: number
    }
  ) => {
    const key = YoutubeServices.getApiKey()
    if (!key) return Promise.reject()
    const params = new URLSearchParams()
    params.append('part', 'snippet')
    params.append('part', 'contentDetails')
    params.append('maxResults', (options?.max ?? 50).toString())
    params.append('key', key)
    params.append('channelId', channelId)
    if (options?.token) {
      params.append('pageToken', options.token)
    }
    const url = `https://youtube.googleapis.com/youtube/v3/playlists?${params.toString()}`
    const res = await fetch(url, {}).then(i => i.json())
    if (res) {
      const result = res as CommonYoutubeResult<IYoutubePlaylistItem>
      return {
        items: result.items,
        token: result.nextPageToken
      }
    }
    return Promise.reject()
  },
  getVideosOfPlaylist: async (
    playlistId: string,
    options?: {
      token?: string
      max?: number
      details?: boolean
    }
  ) => {
    const key = YoutubeServices.getApiKey()
    if (!key) return Promise.reject()
    const params = new URLSearchParams()
    params.append('part', 'snippet')
    params.append('maxResults', (options?.max ?? 50).toString())
    params.append('key', key)
    params.append('playlistId', playlistId)
    if (options?.token) {
      params.append('pageToken', options.token)
    }
    const url = `https://youtube.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
    const res = await fetch(url, {}).then(i => i.json())
    if (res) {
      const result = res as CommonYoutubeResult<IYoutubeVideoItem>
      result.items = result.items.filter(i => i.snippet.thumbnails?.high)
      if (options?.details && result.items.length) {
        const res = await YoutubeServices.getVideo(result.items.map(i => i.snippet.resourceId.videoId))
        if (res) {
          result.items = res.items
        }
      }
      return {
        items: result.items,
        token: result.nextPageToken
      }
    }
    return Promise.reject()
  },
  getVideosOfChannel: async (
    channelId: string,
    options?: {
      token?: string
      max?: number
      details?: boolean
    }
  ) => {
    const uploadPlaylistId = channelId.replace(/^UC/, 'UU')
    return await YoutubeServices.getVideosOfPlaylist(uploadPlaylistId, options)
  },
  iso8601DurationToSeconds,
  getPlaylist: async (playlistId: string | string[]) => {
    const ids = Array.isArray(playlistId) ? playlistId : [playlistId]
    const key = YoutubeServices.getApiKey()
    if (!key) return Promise.reject()
    const params = new URLSearchParams()
    params.append('part', 'snippet')
    params.append('part', 'contentDetails')
    params.append('maxResults', '50')
    params.append('key', key)
    ids.forEach(id => {
      params.append('id', id)
    })
    const url = `https://youtube.googleapis.com/youtube/v3/playlists?${params.toString()}`
    const res = await fetch(url).then(i => i.json())
    if (res) {
      const result = res as CommonYoutubeResult<IYoutubePlaylistItem>
      return {
        items: result.items
      }
    }
  },
  getVideo: async (videoId: string | string[]) => {
    const ids = Array.isArray(videoId) ? videoId : [videoId]
    const key = YoutubeServices.getApiKey()
    if (!key) return Promise.reject()
    if (!ids.length) return
    const params = new URLSearchParams()
    params.append('part', 'snippet')
    params.append('part', 'contentDetails')
    params.append('part', 'statistics')
    params.append('maxResults', '50')
    params.append('key', key)
    ids.forEach(id => {
      params.append('id', id)
    })
    const url = `https://youtube.googleapis.com/youtube/v3/videos?${params.toString()}`
    const res = await fetch(url).then(i => i.json())
    if (res) {
      const result = res as CommonYoutubeResult<IYoutubeVideoItem>
      return {
        items: result.items
      }
    }
  }
}

function iso8601DurationToSeconds(duration: string | undefined) {
  if (!duration) return undefined
  if (typeof duration === 'number') return duration
  // 正则表达式用于解析ISO 8601持续时间
  const regex = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  const matches = duration.match(regex)

  if (!matches) {
    throw new Error('Invalid ISO 8601 duration')
  }

  // 假设一年有365天，一个月有30天
  const yearsToDays = 365
  const monthsToDays = 30
  const daysToSeconds = 86400 // 一天有86400秒
  const hoursToSeconds = 3600 // 一小时有3600秒
  const minutesToSeconds = 60 // 一分钟有60秒

  const years = parseFloat(matches[1] || 0)
  const months = parseFloat(matches[2] || 0)
  const days = parseFloat(matches[3] || 0)
  const hours = parseFloat(matches[4] || 0)
  const minutes = parseFloat(matches[5] || 0)
  const seconds = parseFloat(matches[6] || 0)

  // 计算总秒数
  const totalSeconds =
    years * yearsToDays * daysToSeconds +
    months * monthsToDays * daysToSeconds +
    days * daysToSeconds +
    hours * hoursToSeconds +
    minutes * minutesToSeconds +
    seconds

  return totalSeconds
}
export default YoutubeServices
