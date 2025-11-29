import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import { memo, useEffect, useLayoutEffect } from 'react'
import YoutubeItemsContainer from '@/core/components/youtube/YoutubeItemsContainer'
import { useUpdate } from 'react-use'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useLibrarySearchAll from '@/core/components/common/useLibrarySearchAll'
import { ObjectStore } from '@/api/stores'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import classnames from 'classnames'
import ClearSearchButton from '@/core/components/common/ClearSearchButton'
import { Icon } from '@/components'

export default memo(
  ({
    folderIds,
    cacheKey,
    channelIds,
    playlistIds,
    videoIds,
    parentFolderId,
    name
  }: {
    folderIds?: number[]
    playlistIds?: number[]
    videoIds?: number[]
    channelIds?: number[]
    cacheKey: string
    name?: string
    parentFolderId?: number
  }) => {
    const data = useYoutubeData()
    const [state, setState] = useYoutubeState()
    const sk = cacheKey
    const cache = state.dataCache.itemWrapper[sk]
    const objectsCache = state.dataCache.objects[sk]
    const objects = ObjectStore('youtubeVideo').useMultiple(objectsCache)
    const videos = ObjectStore('youtubeVideo').useMultiple(videoIds)
    const playlists = ObjectStore('youtubePlaylist').useMultiple(playlistIds)
    const channels = ObjectStore('youtubeChannel').useMultiple(channelIds)
    const folders = ObjectStore('youtubeFolder').useMultiple(folderIds)
    const update = useUpdate()
    useLayoutEffect(() => {
      update()
    }, [])
    useEffect(() => {
      if (cache?.active) {
        useYoutubeData.updateData(c => ({ ...c, libraryActive: { ...c.libraryActive, [cacheKey]: cache?.active } }))
      }
    }, [cache?.active])
    const { t } = useTranslation()
    const instance = useYoutubeInstance()
    const {
      state: { results, query },
      setSearch
    } = useLibrarySearchAll(cacheKey, {
      videos: videos.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` })),
      channels: channels.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` })),
      playlists: playlists.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` })),
      folders: folders.map(i => ({ id: i.id, searchable: i.name })),
      objects: objects.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` }))
    })
    return (
      <div className={'flex flex-col min-h-full p-6 w-full'}>
        <div className={'flex items-center gap-3 mb-6 justify-between'}>
          <div className={classnames('text-2xl font-bold', !name && 'super-transparent-font')}>{name || t(trans.Unnamed)}</div>
          <div>
            <ClearSearchButton />
          </div>
        </div>
        <YoutubeItemsContainer
          searchedVideos={results?.['objects']}
          defaultTab={data.libraryActive?.[cacheKey]}
          scrollElementRef={instance.scrollElementRef}
          folders={results?.['folders'] || folderIds}
          cacheKey={sk}
          parentFolderId={parentFolderId}
          videos={results?.['videos'] || videoIds}
          playlists={results?.['playlists'] || playlistIds}
          channels={results?.['channels'] || channelIds}
        />
      </div>
    )
  }
)
