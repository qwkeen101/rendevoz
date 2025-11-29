import { assignProperties } from '@/utils'
import YoutubeServices, { IYoutubeChannelItem } from '@/core/components/youtube/YoutubeServices'
import { MetaStore, ObjectStore } from '@/api/stores'
import { IYoutubeChannel } from '~/typings'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import { useMemoizedFn } from '@/hooks'
import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import FileSystem from '@/api/fileSystem'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'

export default () => {
  const instance = useYoutubeInstance()
  const data = useYoutubeData()
  const [youtubeState, setYoutubeState] = useYoutubeState()
  const search = useMemoizedFn(async (t, channelId) => {
    const youtubeState = useYoutubeState.getState()
    if (channelId) {
      const channelCache = youtubeState.dataCache.channel[channelId]
      const searchCache = channelCache?.search
      const query = searchCache?.query
      const currentTab = channelCache?.tab === 'playlists' ? 'playlist' : 'video'
      if (searchCache?.isLoadingMore) return
      if (currentTab === 'video' && searchCache?.videoHasMore === false) return
      if (currentTab === 'playlist' && searchCache?.playlistHasMore === false) return
      if (!query) return
      useYoutubeState.setChannelDataState(channelId, curr => ({
        ...curr,
        tab: currentTab === 'video' ? 'videos' : 'playlists',
        search: {
          ...curr?.search,
          isLoadingMore: true
        }
      }))
      try {
        const res = await YoutubeServices.search(query, {
          token: currentTab === 'video' ? searchCache.videoToken : searchCache.playlistToken,
          type: [currentTab],
          channelId: channelId,
          details: true
        })
        if (res) {
          useYoutubeState.setChannelDataState(channelId, curr => ({
            ...curr,
            search: {
              ...curr?.search,
              videoResults: currentTab === 'video' ? [...(curr?.search?.videoResults || []), ...res.items] : curr?.search?.videoResults,
              playlistResults:
                currentTab === 'playlist' ? [...(curr?.search?.playlistResults || []), ...res.items] : curr?.search?.playlistResults,
              videoHasMore: currentTab === 'video' ? !!res.token : curr?.search?.videoHasMore,
              playlistHasMore: currentTab === 'playlist' ? !!res.token : curr?.search?.playlistHasMore,
              videoToken: currentTab === 'video' ? res.token : curr?.search?.videoToken,
              playlistToken: currentTab === 'playlist' ? res.token : curr?.search?.playlistToken,
              isLoadingMore: false
            }
          }))
        }
      } finally {
        useYoutubeState.setChannelDataState(channelId, curr => ({
          ...curr,
          search: {
            ...curr?.search,
            isLoadingMore: false
          }
        }))
      }
      return
    }
    if (youtubeState.search?.isLoadingMore) return
    if (youtubeState.search?.hasMore === false) return
    const query = youtubeState.search?.query
    if (!query) {
      return
    }
    setYoutubeState(s => ({
      ...s,
      search: {
        ...s.search,
        isLoadingMore: true
      }
    }))
    const tab = t ?? youtubeState.search?.tab ?? 'video'
    let type: string[] | undefined = undefined
    switch (tab) {
      case 'channel':
        type = ['channel']
        break
      case 'playlist':
        type = ['playlist']
        break
      case 'video':
        type = ['video']
        break
    }
    try {
      const res = await YoutubeServices.search(query, {
        token: youtubeState.search?.token,
        type,
        details: true
      })
      if (res) {
        setYoutubeState(s => ({
          ...s,
          search: {
            ...s.search,
            results: [...(s.search?.results || []), ...res.items],
            hasMore: !!res.token,
            token: res.token,
            isLoadingMore: false
          }
        }))
      }
    } finally {
      setYoutubeState(s => ({ ...s, search: { ...s.search, isLoadingMore: false } }))
    }
  })
  const { t } = useTranslation()
  assignProperties(instance, {
    addVideoAsMeta: async id => {
      const video = await ObjectStore('youtubeVideo').fetchOneById(id)
      if (video) {
        ObjectStore('youtubeVideo').updateOne({ id, viewAt: Date.now() })
        const url = `https://www.youtube.com/embed/${video.videoId}`
        const object = await ObjectStore('video').fetchByConditions({
          url
        })
        if (object.length) {
          const o = object[0]
          ObjectStore('video').updateOne({
            id: o.id,
            ytChannelId: video.channelAppId,
            ytPlaylistId: video.playlistAppId,
            ytVideoId: video.id,
            thumbnail: video.thumbnail
          })
          const meta = MetaStore.getMetaObjectByObjectId(o.id)
          if (meta) {
            if (meta.temp) {
              MetaStore.updateMetaObject({ id: meta.id, temp: false, deleted: false })
            }
            if (meta.deleted) {
              MetaStore.updateMetaObject({ id: meta.id, deleted: false })
            }
            return meta
          } else {
            const m = await MetaStore.addMetaObject({
              objectId: o.id,
              name: video.name,
              description: video.description,
              placeholderName: 'Unnamed video',
              type: 'video'
            })
            FileSystem.saveImage(video.thumbnail).then(res => {
              MetaStore.updateMetaObject({ id: m.id, coverImgSrc: res })
            })
            MetaStore.triggerObjectIndex()
            return m
          }
        } else {
          const res = (
            await ObjectStore('video').addOneWithMeta(
              {
                url,
                thumbnail: video.thumbnail,
                ytChannelId: video.channelAppId,
                ytPlaylistId: video.playlistAppId,
                ytVideoId: video.id
              },
              {
                currentMeta: {
                  name: video.name,
                  description: video.description,
                  placeholderName: 'Unnamed video'
                }
              }
            )
          )?.meta
          FileSystem.saveImage(video.thumbnail).then(path => {
            MetaStore.updateMetaObject({ id: res.id, coverImgSrc: path })
          })
          MetaStore.triggerObjectIndex()
          return res
        }
      }
    },
    updateInfo: async (id, type) => {
      if (type === 'channel') {
        const channel = await ObjectStore('youtubeChannel').fetchOneById(id)
        if (channel && channel.channelId) {
          const items = (await YoutubeServices.getChannel(channel.channelId))?.items
          if (items?.length) {
            const first = items[0]
            ObjectStore('youtubeChannel').updateOne({
              id: id,
              thumbnail: first.snippet.thumbnails?.high?.url ?? channel.thumbnail,
              name: first.snippet.title,
              description: first.snippet.description
            })
          }
        }
      }
      if (type === 'playlist') {
        const playlist = await ObjectStore('youtubePlaylist').fetchOneById(id)
        if (playlist && playlist.playlistId) {
          const items = (await YoutubeServices.getPlaylist(playlist.playlistId))?.items
          if (items?.length) {
            const first = items[0]
            ObjectStore('youtubePlaylist').updateOne({
              id: id,
              thumbnail: first.snippet.thumbnails?.high?.url ?? playlist.thumbnail,
              name: first.snippet.title,
              description: first.snippet.description,
              channelTitle: first.snippet.channelTitle
            })
          }
        }
      }
      if (type === 'video') {
        const video = await ObjectStore('youtubeVideo').fetchOneById(id)
        if (video && video.videoId) {
          const items = (await YoutubeServices.getVideo(video.videoId))?.items
          if (items?.length) {
            const first = items[0]
            ObjectStore('youtubeVideo').updateOne({
              id: id,
              thumbnail: first.snippet.thumbnails?.high?.url ?? video.thumbnail,
              name: video.name ?? first.snippet.title,
              description: first.snippet.description,
              channelTitle: first.snippet.channelTitle
            })
          }
        }
      }
    },
    follow: async (id, type, shouldToast = true) => {
      switch (type) {
        case 'channel':
          if (data.followedChannels?.includes(id)) {
            ObjectStore('youtubeChannel').updateOne({ id, followed: false })
            useYoutubeData.updateData(curr => ({ ...curr, followedChannels: curr.followedChannels?.filter(i => i !== id) }))
          } else {
            ObjectStore('youtubeChannel').updateOne({ id, followed: true })
            shouldToast && toast.success(t(trans.Success.FollowedSuccessfully))
            useYoutubeData.updateData(curr => ({ ...curr, followedChannels: [id, ...(curr.followedChannels || [])] }))
          }
          break
        case 'playlist':
          if (data.followedPlaylists?.includes(id)) {
            ObjectStore('youtubePlaylist').updateOne({ id, followed: false })
            useYoutubeData.updateData(curr => ({ ...curr, followedPlaylists: curr.followedPlaylists?.filter(i => i !== id) }))
          } else {
            ObjectStore('youtubePlaylist').updateOne({ id, followed: true })
            shouldToast && toast.success(t(trans.Success.FollowedSuccessfully))
            useYoutubeData.updateData(curr => ({ ...curr, followedPlaylists: [id, ...(curr.followedPlaylists || [])] }))
          }
          break
        case 'video':
          if (data.followedVideos?.includes(id)) {
            ObjectStore('youtubeVideo').updateOne({ id, followed: false })
            useYoutubeData.updateData(curr => ({ ...curr, followedVideos: curr.followedVideos?.filter(i => i !== id) }))
          } else {
            ObjectStore('youtubeVideo').updateOne({ id, followed: true })
            shouldToast && toast.success(t(trans.Success.FollowedSuccessfully))
            useYoutubeData.updateData(curr => ({ ...curr, followedVideos: [id, ...(curr.followedVideos || [])] }))
          }
          break
      }
    },
    goTo: async (id, type, opts) => {
      if (type === 'folder') {
        instance.navigate?.(`/youtube/folder/${id}`, { replace: opts?.replace })
      }
      if (type === 'channel') {
        const channel = await ObjectStore('youtubeChannel').getOneById(id)
        if (!channel) return
        instance.updateInfo?.(id, 'channel')
        instance.initializeChannel?.(channel.channelId)
        instance.navigate?.(`/youtube/channel/${id}`, { replace: opts?.replace })
      }
      if (type === 'playlist') {
        const p = await ObjectStore('youtubePlaylist').getOneById(id)
        if (!p) return
        instance.updateInfo?.(id, 'playlist')
        instance.navigate?.(`/youtube/playlist/${id}`, { replace: opts?.replace })
      }
      if (type === 'video') {
        const v = await ObjectStore('youtubeVideo').getOneById(id)
        if (!v) return
        instance.updateInfo?.(id, 'video')
        ObjectStore('youtubeVideo').updateOne({ id, viewAt: Date.now() })
        useYoutubeData.addToHistory(id)
        instance.navigate?.(`/youtube/video/${id}`, {
          state: {
            folderId: opts?.folderId
          },
          replace: opts?.replace
        })
      }
    },
    viewHistory: (id, type) => {
      instance.navigate?.(`/youtube/history/${type}/${id}`)
    },
    focusVideo: id => {
      setYoutubeState(s => ({ ...s, isFocusing: true, currentVideo: id }))
    },
    search,
    load: (id, type, opts) => {
      const params = new URLSearchParams({
        type,
        id,
        playlistId: opts?.playlistId ?? '',
        playlistAppId: opts?.playlistAppId?.toString() ?? '',
        channelAppId: opts?.channelAppId?.toString() ?? ''
      })
      instance.navigate?.(`/loading?${params.toString()}`)
    },
    addChannel: async channelId => {
      const existed = await ObjectStore('youtubeChannel').fetchByConditions({
        channelId
      })
      if (existed.length) {
        instance.initializeChannel?.(channelId)
        return existed[0]
      }
      const key = YoutubeServices.getApiKey()
      if (!key) return Promise.reject()
      try {
        const url = `https://youtube.googleapis.com/youtube/v3/channels?part=statistics&part=contentDetails&part=snippet&id=${channelId}&key=${key}`
        const res = await fetch(url).then(i => i.json())
        const channel = res.items?.[0] as IYoutubeChannelItem | undefined
        if (channel) {
          const {
            snippet: { title, description, thumbnails },
            statistics
          } = channel
          const c: Partial<IYoutubeChannel> = {
            name: title,
            description: description,
            channelId,
            videoCount: statistics?.videoCount ? Number(statistics.videoCount) : undefined,
            subscriberCount: statistics?.subscriberCount ? Number(statistics.subscriberCount) : undefined,
            thumbnail: (thumbnails['high'] || thumbnails['medium'] || thumbnails['default'])?.url
          }
          await instance.initializeChannel?.(channelId)
          return (await ObjectStore('youtubeChannel').addOne(c)) || Promise.reject()
        }
        return Promise.reject()
      } catch (e) {
        console.error(e)
        return Promise.reject()
      }
    },
    addVideo: async (videoId, opts) => {
      const existed = await ObjectStore('youtubeVideo').fetchByConditions({ videoId })
      if (existed.length) {
        if (opts?.history) {
          useYoutubeData.addToHistory(existed[0].id)
        }
        if (opts?.playlistAppId && !existed[0].playlistAppId) {
          ObjectStore('youtubeVideo').updateOne({ id: existed[0].id, playlistAppId: opts.playlistAppId })
        }
        return existed[0]
      }
      try {
        const videoDetails = await YoutubeServices.getVideo(videoId)
        if (videoDetails?.items.length) {
          const v = videoDetails.items[0]
          const { snippet, contentDetails, statistics } = v
          const channelId = v.snippet.channelId
          const channel = await instance.addChannel?.(channelId)
          if (!channel) {
            return Promise.reject()
          }
          const currentLocation = instance.getCurrentLocation?.()
          const matchPlaylistId = currentLocation?.pathname.startsWith('/youtube/playlist') ? currentLocation?.params.id : undefined
          const playlist =
            opts?.playlistAppId || matchPlaylistId
              ? await ObjectStore('youtubePlaylist').fetchOneById(opts?.playlistAppId || Number(matchPlaylistId))
              : undefined
          const video = await ObjectStore('youtubeVideo').addOne({
            name: snippet.title,
            description: snippet.description,
            videoId: v.id,
            playlistAppId: playlist?.id,
            playlistId: playlist?.playlistId,
            channelAppId: channel.id,
            channelId: channelId,
            channelTitle: snippet.channelTitle,
            viewCount: statistics?.viewCount ? Number(statistics.viewCount) : undefined,
            publishedAt: snippet.publishedAt,
            duration: YoutubeServices.iso8601DurationToSeconds(contentDetails?.duration),
            thumbnail: (snippet.thumbnails['high'] || snippet.thumbnails['medium'] || snippet.thumbnails['default'])?.url
          })
          if (opts?.history) {
            useYoutubeData.addToHistory(video.id)
          }
          return video
        }
        return Promise.reject()
      } catch (e) {
        console.error(e)
        return Promise.reject()
      }
    },
    addPlaylist: async playlistId => {
      const existed = await ObjectStore('youtubePlaylist').fetchByConditions({ playlistId })
      if (existed.length) {
        return existed[0]
      }
      try {
        const playlistDetails = await YoutubeServices.getPlaylist(playlistId)
        if (playlistDetails?.items.length) {
          const v = playlistDetails.items[0]
          const { snippet, contentDetails } = v
          const channelId = v.snippet.channelId
          const channel = await instance.addChannel?.(channelId)
          if (!channel) {
            return Promise.reject()
          }
          return await ObjectStore('youtubePlaylist').addOne({
            name: snippet.title,
            description: snippet.description,
            playlistId: v.id,
            channelTitle: snippet.channelTitle,
            channelAppId: channel.id,
            channelId: channelId,
            itemCount: contentDetails?.itemCount,
            thumbnail: (snippet.thumbnails['high'] || snippet.thumbnails['medium'] || snippet.thumbnails['default'])?.url
          })
        }
        return Promise.reject()
      } catch (e) {
        console.error(e)
        return Promise.reject()
      }
    },
    initializeChannel: async channelId => {
      const getVideos = async () => {
        const videos = await YoutubeServices.getVideosOfChannel(channelId, { max: 12, details: true })
        setYoutubeState(s => ({
          ...s,
          dataCache: {
            ...s.dataCache,
            channel: {
              ...s.dataCache.channel,
              [channelId]: {
                ...s.dataCache.channel[channelId],
                videos: videos?.items ?? []
              }
            }
          }
        }))
      }
      const getPlaylists = async () => {
        const playlists = await YoutubeServices.getPlaylistOfChannel(channelId, { max: 6 })
        const playlistWithVideos = await Promise.all(
          playlists.items.map(async p => {
            const videos = await YoutubeServices.getVideosOfPlaylist(p.id, { max: 12, details: true })
            return {
              ...p,
              videos: videos?.items
            }
          })
        )
        setYoutubeState(s => ({
          ...s,
          dataCache: {
            ...s.dataCache,
            channel: {
              ...s.dataCache.channel,
              [channelId]: {
                ...s.dataCache.channel[channelId],
                playlists: playlistWithVideos
              }
            }
          }
        }))
      }
      try {
        await Promise.all([getPlaylists(), getVideos()])
      } catch (e) {
        console.error(e)
      }
    },
    createFolder: async currentFolder => {
      return await Global.dialogOps!.createOrEditFolder('youtubeFolder', {
        items: [],
        ...currentFolder
      })
    }
  })
}
