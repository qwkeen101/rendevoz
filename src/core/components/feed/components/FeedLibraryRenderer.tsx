import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import FeedTable from '@/core/components/feed/components/components/FeedTable'
import { Button, Icon, IconWithPopover, TabPane, Tabs } from '@/components'
import { Icons } from '@/consts'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useLibrarySearchAll from '@/core/components/common/useLibrarySearchAll'
import FeedFolderMenu from '@/core/components/feed/components/FeedFolderMenu'
import FeedList from '@/core/components/feed/components/FeedList'
import useFeedFilter from '@/core/components/feed/hooks/useFeedFilter'
import FeedViewChanger from '@/core/components/feed/components/components/FeedViewChanger'
import { Tab } from '@/components/base/tabs'
import classnames from 'classnames'
import { EmptyList } from '../../common'
import ClearSearchButton from '../../common/ClearSearchButton'
import FeedCreateIcon from './FeedCreateIcon'

export default memo(
  ({
    collections: collectionIds,
    folders: folderIds,
    feeds: feedIds,
    cacheKey,
    name,
    parentFolderId
  }: {
    collections?: number[]
    folders?: number[]
    feeds?: number[]
    cacheKey: string
    name?: string
    parentFolderId?: number
  }) => {
    const feedCollections = ObjectStore('feedCollection').useMultiple(collectionIds)
    const feedFolders = ObjectStore('feedFolder').useMultiple(folderIds)
    const feeds = ObjectStore('feed').useMultiple(feedIds)
    const data = useFeedData()
    const key = cacheKey
    const cache = data.libraryCache[key]

    const ids = useMemo(() => {
      const folderIds = feedFolders.map(i => i.id)
      const folderContains = new Set(feedFolders.map(i => i.collections).flat())
      const collectionIds = feedCollections.map(i => i.id).filter(i => !folderContains.has(i))
      return {
        folder: folderIds,
        collection: collectionIds
      }
    }, [feedFolders, feedCollections])
    const excludedFeedCollections = ObjectStore('feedCollection').useMultiple(ids.collection)
    const instance = useFeedInstance()
    const { t } = useTranslation()
    const {
      state: { results }
    } = useLibrarySearchAll(cacheKey, {
      feeds: feeds.map(i => ({ searchable: `${i.title},${i.description}`, id: i.id })),
      collections: excludedFeedCollections.map(i => ({ searchable: `${i.name}`, id: i.id })),
      folders: feedFolders.map(i => ({ searchable: `${i.name}`, id: i.id }))
    })
    const { finalFolders, finalCollections } = useMemo(() => {
      const finalFolders = results?.['folders'] || ids.folder || []
      const finalCollections = results?.['collections'] || ids.collection || []
      return {
        finalCollections,
        finalFolders
      }
    }, [results, ids])

    const { renderFilter, finalResults, renderGrouperChooser } = useFeedFilter(feedIds, key, {
      read: true,
      unread: true
    })

    const finalFeeds = results?.['feeds'] || finalResults
    const ref = instance.scrollElementRef
    if (!ref) return null
    const renderFilters = () => {
      let shouldRender = false
      const key = cache?.active
      if (key === 'feed' || key === 'objects') {
        if (key === 'feed') {
          if (feeds.length) {
            shouldRender = true
          }
        }
      }
      if (shouldRender) {
        return (
          <div className={'flex gap-5 pr-3 shrink-0 ml-auto font-normal items-center pl-2'}>
            <FeedViewChanger />
            {renderFilter()}
            {renderGrouperChooser()}
          </div>
        )
      }
    }
    return (
      <div className={'@container p-8 min-h-full w-full flex flex-col'}>
        <div className={'flex gap-3 h-12 mb-8 items-center'}>
          <div className={classnames('text-3xl font-bold mr-auto', !name && 'super-transparent-font')}>{name || t(trans.Unnamed)}</div>
          <ClearSearchButton width={200} size={22} className='hover-active-button mr-4' />
          {parentFolderId ? (
            <IconWithPopover
              name={Icons.More}
              placement={['bottom']}
              className={'hover-active-button'}
              size={24}
              content={setV => <FeedFolderMenu onClose={() => setV(false)} id={parentFolderId} />}
            ></IconWithPopover>
          ) : (
            <FeedCreateIcon size={28} />
          )}
        </div>
        <Tabs
          tabNavContainerClassname={'font-medium z-10'}
          extra={renderFilters()}
          tabNavClassname={'shrink-0 !px-0 !mr-6 font-size-14 !min-w-0 !pt-2 !pb-1.5'}
          container={false}
          activeKey={cache?.active ?? (parentFolderId ? 'collection' : 'folder')}
          onTabClick={k => {
            useFeedData.updateData(c => ({
              ...c,
              libraryCache: {
                ...c.libraryCache,
                [key]: {
                  ...c.libraryCache[key],
                  active: k
                }
              }
            }))
          }}
        >
          {parentFolderId ? null : (
            <TabPane
              tab={<Tab text={t(trans.Feed.Folders)} count={finalFolders.length} />}
              key={'folder'}
              className={'pt-4 flex flex-col grow'}
            >
              <FeedTable items={finalFolders} type={'folder'} cacheKey={`${key}_folder`} />
            </TabPane>
          )}
          <TabPane
            tab={<Tab text={t(trans.Feed.Feeds)} count={finalCollections.length} />}
            key={'collection'}
            className={'pt-4 flex flex-col grow'}
          >
            <FeedTable items={finalCollections} type={'collection'} cacheKey={`${key}_collection`} />
          </TabPane>
          <TabPane
            tab={<Tab text={t(trans.Feed.Contents)} count={finalFeeds?.length} />}
            key={'feed'}
            className={'pt-3 flex flex-col grow'}
          >
            {finalFeeds?.length ? (
              <FeedList parentFolderId={parentFolderId} items={finalFeeds} scrollElementRef={ref} scrollKey={key} />
            ) : (
              <EmptyList />
            )}
          </TabPane>
        </Tabs>
      </div>
    )
  }
)
