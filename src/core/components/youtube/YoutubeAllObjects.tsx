import { RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import { ObjectStore } from '@/api/stores'
import { getMetaObjectByURL } from '@/api/indexData/urlToId'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useFilterVideos from '@/core/components/feed/youtube/useFilterVideos'
import YoutubeVideos from '@/core/components/feed/youtube/YoutubeVideos'
import { useUpdate } from 'react-use'
import { orderBy } from 'lodash'
import { Icon } from '@/components'
import { useNavigationType } from 'react-router-dom'
import { Icons } from '@/consts'

export default ({
  items,
  scrollElementRef,
  scrollKey,
  searchedItems
}: {
  items?: number[]
  scrollElementRef: RefObject<HTMLDivElement>
  scrollKey: string
  searchedItems?: number[]
}) => {
  const [state, setState] = useYoutubeState()
  const objectsCache = state.dataCache.objects[scrollKey]
  const sk = scrollKey
  const navigationType = useNavigationType()
  const [isLoading, setIsLoading] = useState(false)
  const update = useUpdate()
  const { renderFilter, renderGrouperChooser, finalResults, renderSearch } = useFilterVideos(
    searchedItems || objectsCache,
    `${sk}_objects`,
    {
      filters: {
        isObject: false
      }
    }
  )
  console.log(items)
  useLayoutEffect(() => {
    update()
    const action = async () => {
      setIsLoading(true)
      const videos = items ? await ObjectStore('youtubeVideo').getMultipleByIds(items) : await ObjectStore('youtubeVideo').fetchAll()
      const metaVideos = videos.filter(i => {
        const m = getMetaObjectByURL(`https://www.youtube.com/embed/${i.videoId}`)
        if (m && !m.temp && !m.deleted) {
          return true
        }
        return false
      })
      const sorted = orderBy(metaVideos, s => s.viewAt ?? -1000, 'desc')
      setState(s => ({ ...s, dataCache: { ...s.dataCache, objects: { ...s.dataCache.objects, [sk]: sorted.map(i => i.id) } } }))
      setTimeout(() => setIsLoading(false), 500)
    }
    if (navigationType !== 'POP') {
      action()
    }
  }, [])
  const { t } = useTranslation()
  const finalItems = finalResults
  const videos = ObjectStore('youtubeVideo').useMultiple(finalItems)
  const allChannelIds = useMemo(() => {
    return Array.from(new Set(videos.map(i => i.channelAppId)))
  }, [videos])
  const channels = ObjectStore('youtubeChannel').useMultiple(allChannelIds)
  const channelMap = useMemo(() => new Map(channels.map(i => [i.id, i])), [channels])
  return (
    <>
      <>
        {objectsCache?.length && !isLoading ? (
          <div className={'flex gap-3 mb-4'}>
            {renderFilter('large')}
            {renderGrouperChooser('large')}
          </div>
        ) : null}
      </>
      {videos.length && !isLoading ? (
        <YoutubeVideos
          showChannelTitle
          scrollKey={sk}
          scrollElementRef={scrollElementRef}
          items={videos.map(i => ({
            contentDetails: {
              duration: i.duration
            },
            snippet: {
              title: i.name,
              description: i.description,
              publishedAt: i.publishedAt,
              thumbnails: {
                high: {
                  url: i.thumbnail
                }
              },
              channelTitle: channelMap.get(i.channelAppId)?.name,
              resourceId: {
                videoId: i.videoId,
                kind: 'youtube#video'
              }
            },
            id: i.videoId
          }))}
        />
      ) : (
        <div className={'flex items-center grow justify-center transparent-font font-semibold'}>
          {isLoading ? <Icon name={Icons.Loading} spin size={44} /> : t(trans.NoResult)}
        </div>
      )}
    </>
  )
}
