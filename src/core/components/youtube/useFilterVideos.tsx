import { ObjectStore } from '@/api/stores'
import { IYoutubeVideo } from '~/typings'
import useItemsFilter from '@/core/components/common/useItemsFilter'
import { noRepeatArray } from '@/utils'
import { orderBy } from 'lodash'

export default (
  currItems: number[],
  key: number | string,
  opts?: {
    filters?: {
      isObject?: boolean
    }
  }
) => {
  const { renderFilter, renderGrouperChooser, renderSearch, finalResults, groupState, setState, state } = useItemsFilter<IYoutubeVideo>(
    currItems,
    `${key}_youtube_filter`,
    {
      itemType: 'youtubeVideo',
      searchKeys: ['name', 'description'],
      filters: opts?.filters,
      getURL: i => `https://www.youtube.com/embed/${i.videoId}`,
      grouperOpts: {
        getCustomGrouper: async (v, videos: IYoutubeVideo[]) => {
          switch (v) {
            case 'channel': {
              const channelIdToVideo = new Map<number, number[]>()
              videos.forEach(v => {
                channelIdToVideo.set(v.channelAppId, [...(channelIdToVideo.get(v.channelAppId) ?? []), v.id])
              })
              const allChannels = await ObjectStore('youtubeChannel').getMultipleByIds(noRepeatArray(videos.map(i => i.channelAppId)))
              const sorted = orderBy(allChannels, i => channelIdToVideo.get(i.id)?.length ?? 0, 'desc')
              return sorted.map(i => ({
                name: i.name ?? 'Unnamed channel',
                image: i.thumbnail,
                count: channelIdToVideo.get(i.id)?.length ?? 0,
                id: i.id,
                items: channelIdToVideo.get(i.id) ?? []
              }))
            }
            case 'playlist': {
              const playlistIdToVideo = new Map<number, number[]>()
              videos.forEach(v => {
                if (v.playlistAppId) {
                  playlistIdToVideo.set(v.playlistAppId, [...(playlistIdToVideo.get(v.playlistAppId) ?? []), v.id])
                }
              })
              const allPlaylists = await ObjectStore('youtubePlaylist').getMultipleByIds(noRepeatArray(videos.map(i => i.playlistAppId)))
              const sorted = orderBy(allPlaylists, i => playlistIdToVideo.get(i.id)?.length ?? 0, 'desc')
              return sorted.map(i => ({
                name: i.name ?? 'Unnamed playlist',
                image: i.thumbnail,
                count: playlistIdToVideo.get(i.id)?.length ?? 0,
                id: i.id,
                items: playlistIdToVideo.get(i.id) ?? []
              }))
            }
          }
          return []
        },
        groupers: [
          ['none', '无分组'],
          ['channel', '频道'],
          ['playlist', '播放列表'],
          ['tag', '标签'],
          ['appearsIn', '出现于']
        ]
          .filter(i => i)
          .map(i => ({ value: i[0], text: i[1] }))
      }
    }
  )
  return {
    state,
    groupState,
    finalResults,
    setState,
    renderSearch,
    renderFilter,
    renderGrouperChooser
  }
}
