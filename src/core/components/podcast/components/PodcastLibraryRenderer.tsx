import { Button, IconWithPopover, TabPane, Tabs } from '@/components'
import ItemRenderer from '@/core/components/podcast/ItemRenderer'
import { memo, useLayoutEffect } from 'react'
import { useMeasure, useNorepeatNavigate } from '@/hooks'
import usePodcastState from '@/core/components/podcast/hooks/usePodcastState'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import NoResult from '@/core/components/common/NoResult'
import PodcastTable from '@/core/components/podcast/components/PodcastTable'
import { Icons } from '@/consts'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import useEpisodeFilter from '@/core/components/podcast/hooks/useEpisodeFilter'
import useLibrarySearchAll from '@/core/components/common/useLibrarySearchAll'
import PodcastFolderMenu from '@/core/components/podcast/components/PodcastFolderMenu'
import { Tab } from '@/components/base/tabs'
import { getMetaObjectByURL } from '@/api/indexData/urlToId'
import { orderBy } from 'lodash'
import classnames from 'classnames'

export default memo(
  ({
    episodes: episodeIds,
    podcasts: podcastIds,
    folders: folderIds,
    createFolder,
    folderTab,
    parentFolderId,
    cacheKey,
    name
  }: {
    cacheKey: string
    episodes?: number[]
    podcasts?: number[]
    folders?: number[]
    createFolder?: boolean
    folderTab?: boolean
    parentFolderId?: number
    name?: string
  }) => {
    const instance = usePodcastInstance()
    const navigate = useNorepeatNavigate()
    const ref = instance.scrollElementRef
    const { width } = useMeasure(ref)
    const [state, setState] = usePodcastState()
    const sk = cacheKey
    const podcasts = ObjectStore('podcast').useMultiple(podcastIds)
    const episodes = ObjectStore('episode').useMultiple(episodeIds)
    const folders = ObjectStore('podcastFolder').useMultiple(folderIds)
    const objects = state.objectsCache[sk]
    const objectEpisodes = ObjectStore('episode').useMultiple(objects)
    const colMode = width > 0 && width < 600
    const { t } = useTranslation()
    const {
      state: { results: librarySearchResult }
    } = useLibrarySearchAll(sk, {
      folders: folders.map(i => ({ id: i.id, searchable: i.name })),
      podcasts: podcasts.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` })),
      episodes: episodes.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` })),
      objects: objectEpisodes.map(i => ({ id: i.id, searchable: `${i.name},${i.description}` }))
    })

    const searchedFolders = librarySearchResult?.['folders']
    const searchedEpisodes = librarySearchResult?.['episodes']
    const searchedPodcasts = librarySearchResult?.['podcasts']
    const searchedObjects = librarySearchResult?.['objects']
    const episodeLength = (searchedEpisodes || episodes).length
    const podcastLength = (searchedPodcasts || podcasts).length
    const folderLength = (searchedFolders || folders).length
    const allObjectsLength = (searchedObjects || objectEpisodes)?.length ?? 0
    const { finalResults, renderFilter, renderGrouperChooser } = useEpisodeFilter(searchedEpisodes || episodeIds, sk, {
      listened: true,
      unlistened: true
    })
    const {
      renderFilter: renderObjectsFilter,
      renderGrouperChooser: renderObjectsGrouper,
      finalResults: finalObjectsResults
    } = useEpisodeFilter(searchedObjects || objects, `${cacheKey}_episode_objects`, {
      isObject: false,
      hasHighlight: true,
      listened: true,
      unlistened: true
    })
    const calculateEpisodeMetas = async () => {
      const videos =
        parentFolderId && episodeIds ? await ObjectStore('episode').getMultipleByIds(episodeIds) : await ObjectStore('episode').fetchAll()
      const metaVideos = videos.filter(i => {
        const m = getMetaObjectByURL(i.enclosureURL)
        if (m && !m.temp && !m.deleted) {
          return true
        }
        return false
      })
      const sorted = orderBy(metaVideos, s => s.viewAt ?? -1000, 'desc')
      setState(s => ({ ...s, objectsCache: { ...s.objectsCache, [cacheKey]: sorted.map(i => i.id) } }))
    }
    const index = MetaStore.useIndexedMetaObjects()
    useLayoutEffect(() => {
      calculateEpisodeMetas()
    }, [index?.deletedMetaObjectsSet.size, index?.undeletedMetaObjectsSet.size, episodeIds?.length])
    return (
      <div className={'flex @container p-8 flex-col min-h-full w-full'}>
        <div className={'flex mb-8 gap-3 items-center'}>
          <div className={classnames('font-bold text-3xl mr-auto', !name && 'super-transparent-font')}>{name || t(trans.Unnamed)}</div>
          {createFolder && (
            <Button.IconButton
              onClick={() => instance.folderOps?.createFolder()}
              text={t(trans.Feed.CreateFolder)}
              icon={Icons.Create}
              className={'transparent-font !rounded-2xl'}
            ></Button.IconButton>
          )}
          {parentFolderId && (
            <>
              <IconWithPopover
                name={Icons.More}
                placement={['bottom']}
                className={'border-rounded-button h-full'}
                content={setV => <PodcastFolderMenu onClose={() => setV(false)} id={parentFolderId} />}
              />
            </>
          )}
        </div>
        <Tabs
          tabNavContainerClassname={
            'no-scrollbar w-full shrink-0 overflow-x-auto capitalize font-medium !justify-normal z-10'
          }
          tabNavClassname={'shrink-0 !pb-1.5 !px-3.5 !pt-2'}
          onTabClick={k => setState(s => ({ ...s, folderTabCache: { ...s.folderTabCache, [cacheKey]: k } }))}
          container={false}
          renderOnly
          defaultActiveKey={state.folderTabCache[cacheKey] ?? 'podcast'}
          tabNavMode={'underline'}
        >
          {folderTab ? (
            <TabPane className={'py-4 grow flex flex-col'} tab={<Tab text={t(trans.Feed.Folders)} count={folderLength} />} key={'folder'}>
              {folderLength ? (
                <PodcastTable totalCountMode={'podcast'} items={searchedFolders || folderIds} type={'folder'} cacheKey={sk} />
              ) : (
                <NoResult />
              )}
            </TabPane>
          ) : null}
          <TabPane tab={<Tab text={t('podcast.Podcasts')} count={podcastLength} />} className={'py-4 grow flex flex-col'} key={'podcast'}>
            {podcastLength ? (
              <PodcastTable parentFolderId={parentFolderId} items={searchedPodcasts || podcastIds} type={'podcast'} cacheKey={sk} />
            ) : (
              <NoResult />
            )}
          </TabPane>
          <TabPane className={'py-4 flex grow flex-col'} tab={<Tab text={t('podcast.Episodes')} count={episodeLength} />} key={'episode'}>
            {finalResults?.length ? (
              <VirtualLoader
                className={'pb-40'}
                scrollKey={sk}
                size={50}
                scrollElementRef={ref}
                itemClassName={'pb-4'}
                count={finalResults.length}
                renderItem={idx => {
                  const p = finalResults[idx]
                  if (p) {
                    return (
                      <ItemRenderer
                        columnMode={colMode}
                        onClick={() => {
                          navigate(`/episode/${p}`)
                        }}
                        id={p}
                        key={p}
                        parentFolderId={parentFolderId}
                        type={'episode'}
                      />
                    )
                  }
                  return null
                }}
              ></VirtualLoader>
            ) : (
              <NoResult />
            )}
          </TabPane>
        </Tabs>
      </div>
    )
  }
)
