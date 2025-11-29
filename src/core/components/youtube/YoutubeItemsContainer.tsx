import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import FeedSearchInput from '@/core/components/feed/components/FeedSearchInput'
import { Icon, IconWithPopover, Select, TabPane, Tabs } from '@/components'
import { Icons } from '@/consts'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { RefObject, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { ObjectStore } from '@/api/stores'
import YoutubePlaylists from '@/core/components/feed/youtube/YoutubePlaylists'
import YoutubeVideos from '@/core/components/feed/youtube/YoutubeVideos'
import YoutubeChannels from '@/core/components/feed/youtube/YoutubeChannels'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/feed/youtube/YoutubeItemMenu'
import classnames from 'classnames'
import { css } from '@emotion/css'
import { useNorepeatNavigate } from '@/hooks'
import YoutubeFolderMenu from '@/core/components/feed/youtube/YoutubeFolderMenu'
import useFilterVideos from '@/core/components/feed/youtube/useFilterVideos'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { IYoutubeChannel, IYoutubeFolder, IYoutubePlaylist, IYoutubeVideo } from '~/typings'
import { groupBy } from 'lodash'
import YoutubeAllObjects from '@/core/components/feed/youtube/YoutubeAllObjects'

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
  const [state, setState] = useYoutubeState()
  const cache = state.dataCache.itemWrapper[cacheKey]
  const objectsLength = state.dataCache.objects[cacheKey]?.length ?? 0
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
  const instance = useFeedInstance()
  const c = ObjectStore('youtubeChannel').useMultiple(channels)

  const p = ObjectStore('youtubePlaylist').useMultiple(playlists)
  const memoedVideos = useMemo(() => videos ?? [], [videos])
  const { t } = useTranslation()
  const { renderFilter, renderSearch, renderGrouperChooser, finalResults } = useFilterVideos(memoedVideos, cacheKey)
  const v = ObjectStore('youtubeVideo').useMultiple(finalResults)
  const allChannelIds = useMemo(() => {
    return Array.from(new Set(v.map(i => i.channelAppId)))
  }, [videos])
  const videoChannels = ObjectStore('youtubeChannel').useMultiple(allChannelIds)
  const channelMap = useMemo(() => new Map(videoChannels.map(i => [i.id, i])), [channels])
  return (
    <div className={'grow flex flex-col'}>
      <Tabs
        tabNavMode={'underline'}
        tabNavContainerClassname={
          '!sticky top-0 no-scrollbar w-full shrink-0 overflow-x-auto bg-global capitalize font-medium !justify-normal z-10 border-bottom'
        }
        tabNavClassname={'shrink-0 !pb-1.5 !px-3 !pt-2'}
        container={false}
        activeKey={cache?.active ?? defaultTab ?? 'channels'}
        onTabClick={k => {
          update(c => ({ ...c, active: k }))
        }}
      >
        <TabPane
          tab={folders ? `${t(trans.Feed.Folders)}${folders.length ? `(${folders.length})` : ''}` : null}
          key={'folders'}
          className={'pt-4 flex flex-col grow'}
        >
          {folders && <FolderPane items={folders} />}
        </TabPane>
        <TabPane tab={`${t(trans.Feed.Channels)}${c.length ? `(${c.length})` : ''}`} key={'channels'} className={'pt-4 flex flex-col grow'}>
          {c.length ? (
            <YoutubeChannels
              contextMenu={(idx, children) => (
                <ContextMenu
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
            <div className={'w-full grow flex items-center justify-center transparent-font font-semibold'}>{t(trans.Feed.NoChannel)}</div>
          )}
        </TabPane>
        <TabPane
          tab={`${t(trans.Feed.Playlists)}${p.length ? `(${p.length})` : ''}`}
          key={'playlists'}
          className={'pt-4 flex flex-col grow'}
        >
          {p.length ? (
            <YoutubePlaylists
              parentFolderId={parentFolderId}
              onLoadMore={() => {}}
              hasMore={false}
              contextMenu={(idx, children) => (
                <ContextMenu
                  content={setV => (
                    <YoutubeItemMenu
                      id={p[idx].id}
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
              items={p.map(i => ({
                id: i.playlistId,
                contentDetails: {
                  itemCount: i.itemCount
                },
                snippet: {
                  title: i.name,
                  description: i.description,
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
            <div className={'w-full grow flex items-center justify-center transparent-font font-semibold'}>{t(trans.Feed.NoPlaylist)}</div>
          )}
        </TabPane>
        <TabPane
          tab={`${t(trans.Feed.Videos)}${memoedVideos.length ? `(${memoedVideos.length})` : ''}`}
          key={'videos'}
          className={'pt-4 flex flex-col grow'}
        >
          {memoedVideos.length ? (
            <div className={'flex gap-3 mb-4'}>
              {renderFilter('large')}
              {renderGrouperChooser('large')}
            </div>
          ) : null}
          {v.length ? (
            <YoutubeVideos
              contextMenu={(idx, children) => (
                <ContextMenu
                  content={setV => (
                    <YoutubeItemMenu
                      parentFolderId={parentFolderId}
                      id={v[idx].id}
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
                const item = v.find(o => o.videoId === i.id)
                if (item) {
                  instance.youtubeOps?.goTo(item.id, 'video', {
                    history: true,
                    folderId: parentFolderId
                  })
                }
              }}
              showChannelTitle
              items={v.map(i => ({
                id: i.videoId,
                contentDetails: {
                  duration: i.duration
                },
                snippet: {
                  title: i.name,
                  publishedAt: i.publishedAt,
                  description: i.description,
                  resourceId: {
                    videoId: i.videoId
                  },
                  channelTitle: channelMap.get(i.channelAppId)?.name,
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
            <div className={'w-full grow flex items-center justify-center transparent-font font-semibold'}>{t(trans.Feed.NoVideo)}</div>
          )}
        </TabPane>
        <TabPane
          mount
          tab={`${t(trans.Feed.AllObjects)} ${searchedVideos?.length || objectsLength ? `(${searchedVideos?.length || objectsLength})` : ''}`}
          key={'objects'}
          className={'pt-4 flex flex-col grow'}
        >
          <YoutubeAllObjects
            searchedItems={searchedVideos}
            items={parentFolderId ? videos : undefined}
            scrollKey={cacheKey}
            scrollElementRef={scrollElementRef}
          />
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
          {withImageFolders.map((i, idx) => (
            <ContextMenu content={setV => <YoutubeFolderMenu id={i.id} onClose={() => setV(false)} />} key={i.id}>
              <tr
                onClick={() => {
                  navigate(`/youtube/folder/${i.id}`)
                }}
                className={classnames(idx % 2 !== 0 && 'bg-secondary', RowClass, 'h-12')}
              >
                <td>
                  <div className={'h-full flex items-center gap-2'}>
                    {i.image ? (
                      <img src={i.image} className={'rounded w-10 h-10 object-cover'} />
                    ) : (
                      <Icon className={'icon-22 w-10 h-10 flex items-center justify-center'} name={'park-folder-close'} />
                    )}
                    <div className={'ml-2 line-clamp-1'}>{i.name}</div>
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
