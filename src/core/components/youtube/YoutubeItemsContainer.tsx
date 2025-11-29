import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import { Button, Icon, IconWithPopover, TabPane, Tabs } from '@/components'
import { RefObject, useLayoutEffect, useMemo, useState } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import YoutubePlaylists from '@/core/components/youtube/YoutubePlaylists'
import YoutubeVideos from '@/core/components/youtube/YoutubeVideos'
import YoutubeChannels from '@/core/components/youtube/YoutubeChannels'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/youtube/YoutubeItemMenu'
import classnames from 'classnames'
import { css } from '@emotion/css'
import { useNorepeatNavigate } from '@/hooks'
import YoutubeFolderMenu from '@/core/components/youtube/YoutubeFolderMenu'
import useFilterVideos from '@/core/components/youtube/hooks/useFilterVideos'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { IYoutubeChannel, IYoutubeFolder, IYoutubePlaylist, IYoutubeVideo } from '~/typings'
import { groupBy, orderBy } from 'lodash'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { Tab } from '@/components/base/tabs'
import NoResult from '@/core/components/common/NoResult'
import { getMetaObjectByURL } from '@/api/indexData/urlToId'
import { useNavigationType } from 'react-router-dom'
import useUpdateIsomorphicLayoutEffect from '@/hooks/utils/useUpdateIsomorphicLayoutEffect'
import { Icons } from '@/consts'
import ClearSearchButton from '../common/ClearSearchButton'
import { EmptyList } from '../common'

export default ({
  videos,
  channels,
  playlists,
  cacheKey,
  parentFolderId,
  folders,
  scrollElementRef,
  defaultTab,
  searchedVideos
}: {
  videos?: number[]
  channels?: number[]
  playlists?: number[]
  folders?: number[]
  cacheKey: string
  defaultTab?: string
  parentFolderId?: number
  searchedVideos?: number[]
  scrollElementRef: RefObject<HTMLDivElement>
}) => {
  const instance = useYoutubeInstance()
  const [state, setState] = useYoutubeState()
  const cache = state.dataCache.itemWrapper[cacheKey]
  const objectsCache = state.dataCache.objects[cacheKey]
  const update = (updater: (curr: typeof cache) => typeof cache) => {
    setState(s => ({
      ...s,
      dataCache: {
        ...s.dataCache,
        itemWrapper: {
          ...s.dataCache.itemWrapper,
          [cacheKey]: updater(s.dataCache.itemWrapper[cacheKey])
        }
      }
    }))
  }
  const c = ObjectStore('youtubeChannel').useMultiple(channels)
  const memoedVideos = useMemo(() => videos ?? [], [videos])
  const { t } = useTranslation()
  const { renderFilter, renderGrouperChooser, finalResults } = useFilterVideos(memoedVideos, cacheKey)
  const {
    renderFilter: renderObjectsFilter,
    renderGrouperChooser: renderObjectsGrouper,
    finalResults: finalObjectsResults
  } = useFilterVideos(searchedVideos || objectsCache, `${cacheKey}_objects`, {
    filters: {
      isObject: false
    }
  })
  const renderFilters = () => {
    const key = cache?.active ?? defaultTab ?? 'channels'
    let shouldRender = false
    if (key === 'videos') {
      if (memoedVideos.length) {
        shouldRender = true
      }
    }
    if (key === 'objects') {
      if (objectsCache?.length) {
        shouldRender = true
      }
    }

    if (shouldRender) {
      return (
        <div className={'flex gap-5 items-center shrink-0 ml-auto pr-3'}>
          {key === 'objects' ? renderObjectsFilter() : renderFilter()}
          {key === 'objects' ? renderObjectsGrouper() : renderGrouperChooser()}
        </div>
      )
    }
  }
  const calculateMetaVideos = async () => {
    const vs =
      parentFolderId && videos ? await ObjectStore('youtubeVideo').getMultipleByIds(videos) : await ObjectStore('youtubeVideo').fetchAll()
    const metaVideos = vs.filter(i => {
      const m = getMetaObjectByURL(`https://www.youtube.com/embed/${i.videoId}`)
      if (m && !m.temp && !m.deleted) {
        return true
      }
      return false
    })
    const sorted = orderBy(metaVideos, s => s.viewAt ?? -1000, 'desc')
    setState(s => ({ ...s, dataCache: { ...s.dataCache, objects: { ...s.dataCache.objects, [cacheKey]: sorted.map(i => i.id) } } }))
  }
  const index = MetaStore.useIndexedMetaObjects()
  const navigationType = useNavigationType()
  useLayoutEffect(() => {
    if (navigationType !== 'POP') {
      calculateMetaVideos()
    }
  }, [])
  useUpdateIsomorphicLayoutEffect(() => {
    calculateMetaVideos()
  }, [index?.deletedMetaObjectsSet.size, index?.undeletedMetaObjectsSet.size, videos?.length])

  return (
    <div className={'grow flex flex-col'}>
      <Tabs
        renderOnly
        tabNavContainerClassname={'no-scrollbar w-full shrink-0 overflow-x-auto capitalize font-medium !justify-normal z-10'}
        tabNavClassname={'shrink-0 !min-w-0 font-size-14 !pl-0 !pr-0 !mr-7 !pb-2 !px-3 !justify-start'}
        container={false}
        // tabNavMode='underline'
        activeKey={cache?.active ?? defaultTab ?? 'channels'}
        onTabClick={k => {
          update(c => ({ ...c, active: k }))
        }}
        extra={renderFilters()}
      >
        {parentFolderId ? null : (
          <TabPane
            tab={folders ? <Tab text={t(trans.Feed.Folders)} count={folders.length} /> : null}
            key={'folders'}
            className={'pt-4 flex flex-col grow'}
          >
            {folders && <FolderPane items={folders} />}
          </TabPane>
        )}
        <TabPane tab={<Tab text={t(trans.Feed.Channels)} count={c.length} />} key={'channels'} className={'pt-4 flex flex-col grow'}>
          {c.length ? (
            <YoutubeChannels
              contextMenu={(idx, children) => (
                <ContextMenu
                  key={c[idx].id}
                  content={setV => (
                    <YoutubeItemMenu
                      parentFolderId={parentFolderId}
                      id={c[idx].id}
                      type={'channel'}
                      onClose={() => {
                        setV(false)
                      }}
                    />
                  )}
                >
                  {children}
                </ContextMenu>
              )}
              onLoadMore={() => {}}
              hasMore={false}
              items={c.map(i => ({
                snippet: {
                  title: i.name,
                  description: i.description,
                  channelId: i.channelId,
                  thumbnails: {
                    high: {
                      url: i.thumbnail
                    }
                  }
                }
              }))}
              scrollElementRef={scrollElementRef}
              scrollKey={cacheKey}
            />
          ) : (
            <EmptyList />
          )}
        </TabPane>
        <TabPane
          tab={<Tab text={t(trans.Feed.Playlists)} count={playlists?.length} />}
          key={'playlists'}
          className={'pt-4 flex flex-col grow'}
        >
          {playlists?.length ? (
            <YoutubePlaylists
              onLoadMore={() => {}}
              hasMore={false}
              contextMenu={(id, children) => (
                <ContextMenu
                  key={id}
                  content={setV => (
                    <YoutubeItemMenu
                      id={id}
                      parentFolderId={parentFolderId}
                      type={'playlist'}
                      onClose={() => {
                        setV(false)
                      }}
                    />
                  )}
                >
                  {children}
                </ContextMenu>
              )}
              items={playlists}
              scrollElementRef={scrollElementRef}
              scrollKey={cacheKey}
            />
          ) : (
            <EmptyList />
          )}
        </TabPane>
        <TabPane tab={<Tab text={t(trans.Feed.Videos)} count={memoedVideos.length} />} key={'videos'} className={'pt-4 flex flex-col grow'}>
          <Videos ids={finalResults} parentFolderId={parentFolderId} scrollElementRef={scrollElementRef} cacheKey={cacheKey} />
        </TabPane>
      </Tabs>
    </div>
  )
}

const RowClass = classnames([
  css({
    clipPath: 'xywh(0 0 100% 100% round 0.4rem)'
  }),
  'button none-select [&_td]:py-1.5 [&_td]:px-2 [&_td]:h-full'
])

const FolderPane = ({ items }: { items: number[] }) => {
  const folders = ObjectStore('youtubeFolder').useMultiple(items)
  const navigate = useNorepeatNavigate()
  const { t } = useTranslation()
  const [withImageFolders, setWithImageFolders] = useState<(IYoutubeFolder & { image?: string })[]>([])
  useLayoutEffect(() => {
    const sorted = folders.slice().sort((b, a) => a.createdAt - b.createdAt)
    Promise.all(
      sorted.map(async folder => {
        const firstItem = folder.items?.[0]
        if (!firstItem) return folder
        let type = ''
        switch (firstItem.type) {
          case 'channel':
            type = 'youtubeChannel'
            break
          case 'playlist':
            type = 'youtubePlaylist'
            break
          case 'video':
            type = 'youtubeVideo'
            break
        }
        if (type) {
          const o = (await ObjectStore(type).fetchOneById(firstItem.id)) as IYoutubeVideo | IYoutubePlaylist | IYoutubeChannel | undefined
          if (o) {
            return {
              ...folder,
              image: o.thumbnail
            }
          }
        }
        return folder
      })
    ).then(res => setWithImageFolders(res))
  }, [folders])
  if (!withImageFolders.length) {
    return <div className={'w-full grow flex items-center justify-center transparent-font font-semibold'}>{t(trans.Feed.NoFolder)}</div>
  }
  const renderFolderItems = (folder: IYoutubeFolder) => {
    const grouped = groupBy(folder.items ?? [], i => i.type)
    return (
      <>
        <td className={'font-size-12 transparent-font'}>
          <div className={'h-full flex items-center'}>{grouped['channel']?.length ?? 0}</div>
        </td>
        <td className={'font-size-12 transparent-font'}>
          <div className={'h-full flex items-center'}>{grouped['playlist']?.length ?? 0}</div>
        </td>
        <td className={'font-size-12 transparent-font'}>
          <div className={'h-full flex items-center'}>{grouped['video']?.length ?? 0}</div>
        </td>
      </>
    )
  }
  return (
    <table className={'w-full'}>
      <colgroup>
        <col width={'70%'}></col>
        <col width={'10%'}></col>
        <col width={'10%'}></col>
        <col width={'10%'}></col>
        <col width={'40px'}></col>
      </colgroup>
      <thead className={'transparent-font font-medium font-size-12'}>
        <tr>
          {[t(trans.Name), t(trans.Feed.Channels), t(trans.Feed.Playlists), t(trans.Feed.Videos)].map(i => (
            <td className={classnames('capitalize', i === t(trans.Name) ? 'pl-4' : 'pl-1.5')} key={i}>
              {i}
            </td>
          ))}
        </tr>
      </thead>
      {withImageFolders?.length ? (
        <tbody>
          {withImageFolders.map(i => (
            <ContextMenu content={setV => <YoutubeFolderMenu id={i.id} onClose={() => setV(false)} />} key={i.id}>
              <tr
                onClick={() => {
                  navigate(`/youtube/folder/${i.id}`)
                }}
                className={classnames(RowClass, 'h-14')}
              >
                <td>
                  <div className={'h-full flex items-center gap-2'}>
                    {i.image ? (
                      <img src={i.image} className={'rounded w-10 h-10 object-cover'} />
                    ) : (
                      <Icon className={'icon-22 w-10 h-10 flex items-center justify-center'} name={Icons.Folder} />
                    )}
                    <div className={classnames('ml-2 line-clamp-1', !i.name && 'super-transparent-font')}>{i.name || t(trans.Unnamed)}</div>
                  </div>
                </td>
                {renderFolderItems(i)}
                <td className={'font-size-12 transparent-font min-w-12'}>
                  <div className={'h-full flex w-full justify-center items-center'}>
                    <IconWithPopover
                      placement={['bottom']}
                      onClick={e => e.stopPropagation()}
                      name={'park-more'}
                      content={setV => <YoutubeFolderMenu id={i.id} onClose={() => setV(false)} />}
                      className={'icon-18 super-transparent-font'}
                    />
                  </div>
                </td>
              </tr>
            </ContextMenu>
          ))}
        </tbody>
      ) : null}
    </table>
  )
}

const Videos = ({
  ids,
  parentFolderId,
  cacheKey,
  scrollElementRef
}: {
  ids?: number[]
  parentFolderId?: number
  scrollElementRef: RefObject<HTMLDivElement>
  cacheKey: string
}) => {
  const videos = ObjectStore('youtubeVideo').useMultiple(ids)
  const instance = useYoutubeInstance()
  return ids?.length ? (
    <YoutubeVideos
      contextMenu={(id, children) => (
        <ContextMenu
          key={id}
          content={setV => (
            <YoutubeItemMenu
              parentFolderId={parentFolderId}
              id={id}
              type={'video'}
              onClose={() => {
                setV(false)
              }}
            />
          )}
        >
          {children}
        </ContextMenu>
      )}
      onLoadMore={() => {}}
      hasMore={false}
      onNavigate={i => {
        const item = videos.find(o => o.videoId === i)
        if (item) {
          instance.goTo?.(item.id, 'video', {
            history: true,
            folderId: parentFolderId
          })
        }
      }}
      showChannel
      items={ids}
      scrollElementRef={scrollElementRef}
      scrollKey={cacheKey}
    />
  ) : (
    <EmptyList />
  )
}
