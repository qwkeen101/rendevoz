import useYoutubeData from '@/core/components/feed/youtube/useYoutubeData'
import { Button, IconWithPopover, useElementScrollRestore } from '@/components'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import YoutubeItemsContainer from '@/core/components/feed/youtube/YoutubeItemsContainer'
import { useUpdate } from 'react-use'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import useLibrarySearchAll from '@/core/components/common/useLibrarySearchAll'
import { ObjectStore } from '@/api/stores'
import YoutubeFolderMenu from '@/core/components/feed/youtube/YoutubeFolderMenu'

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
    const ref = useRef<HTMLDivElement>(null)
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
    const instance = useFeedInstance()
    const {
      renderSearch,
      state: { results }
    } = useLibrarySearchAll(cacheKey, {
      videos: videos.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` })),
      channels: channels.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` })),
      playlists: playlists.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` })),
      folders: folders.map(i => ({ id: i.id, searchable: i.name })),
      objects: objects.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` }))
    })
    useElementScrollRestore({
      elementKey: sk,
      elementRef: ref
    })
    return (
      <div className={'h-full overflow-y-auto px-6'} ref={ref}>
        <div className={'container-7xl flex flex-col min-h-full py-6'}>
          <div className={'flex items-start pl-2 gap-3 mb-4'}>
            <div className={'text-3xl font-bold mr-auto'}>{name ?? t(trans.Feed.Library)}</div>
            {!parentFolderId && (
              <Button.IconButton
                onClick={() => {
                  instance.youtubeOps?.createFolder()
                }}
                icon={Icons.Create}
                text={t(trans.Feed.CreateFolder)}
                className={'border-round-icon-button shrink-0'}
              />
            )}
            {renderSearch({
              alwaysVisible: true
            })}
            {parentFolderId && (
              <IconWithPopover
                content={setV => <YoutubeFolderMenu onClose={() => setV(false)} id={parentFolderId} />}
                name={Icons.More}
                placement={['bottom']}
                className={'border-rounded-button'}
              />
            )}
          </div>
          <YoutubeItemsContainer
            searchedVideos={results?.['objects']}
            defaultTab={data.libraryActive?.[cacheKey]}
            scrollElementRef={ref}
            folders={results?.['folders'] || folderIds}
            cacheKey={sk}
            parentFolderId={parentFolderId}
            videos={results?.['videos'] || videoIds}
            playlists={results?.['playlists'] || playlistIds}
            channels={results?.['channels'] || channelIds}
          />
        </div>
      </div>
    )
  }
)
