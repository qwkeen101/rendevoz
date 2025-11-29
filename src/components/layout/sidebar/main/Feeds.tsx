import { ObjectStore } from '@/api/stores'
import { useEffect, useLayoutEffect, useState } from 'react'
import GNewsToImage from '@/core/components/feed/news/gNewsToImage'
import { ISidebarWidgetProps, SidebarExpandItem } from '@/components/layout/sidebar/main/index'
import { useTranslation } from 'react-i18next'
import FeedFolderMenu from '@/core/components/feed/components/FeedFolderMenu'
import FeedCollectionMenu from '@/core/components/feed/components/FeedCollectionMenu'
import FeedItemMenu from '@/core/components/feed/components/FeedItemMenu'
import { compareStrings } from '@/utils/str'
import { noRepeatArray } from '@/utils'
import trans from '@/consts/trans'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { Icons } from '@/consts'
import { Icon, IconWithPopover, Tooltip, WithBorder } from '@/components'
import RSSIcon from '@/core/components/feed/components/RSSIcon'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import classNames from 'classnames'
import FeedConsts from '@/core/components/feed/FeedConsts'
import FeedCreateIcon from '@/core/components/feed/components/FeedCreateIcon'

type Item = {
  type: 'item' | 'folder' | 'collection'
  id: number
  children: Item[]
  expanded?: boolean
  onExpand?: VoidFunction
  icon?: string
  image?: string
  unread?: number
  parentFolderId?: number
  name?: string
}

export default ({ expandIds, onExpand }: ISidebarWidgetProps) => {
  const feedFolders = ObjectStore('feedFolder').useAll()
  const feedCollections = ObjectStore('feedCollection').useAll()
  const data = useFeedData()
  const [result, setResult] = useState<{
    folders: Item[]
    collections: Item[]
  }>({
    folders: [],
    collections: []
  })
  useEffect(() => {
    ObjectStore('feedCollection').getAll()
    ObjectStore('feedFolder').getAll()
  }, [])
  const calculateParents = async () => {
    const expandedSet = new Set(expandIds)
    const inFolderCollections = new Set(feedFolders.map(i => i.collections || []).flat())
    const inFolderFeeds = new Set(feedFolders.map(i => i.feeds || []).flat())
    await ObjectStore('feed').getMultipleByIds(Array.from(inFolderFeeds))
    const allFollowedCollections = await ObjectStore('feedCollection').getMultipleByIds(
      noRepeatArray([...feedCollections.map(i => i.id), ...inFolderCollections])
    )
    const collectionItems = allFollowedCollections
      .map(c => ({
        type: 'collection',
        name: c.name,
        id: c.id,
        children: [],
        image: c.icon,
        unread: c.unreadCount
      }))
      .sort((a, b) => compareStrings(a.name, b.name)) as Item[]
    const sortedFolders = (
      await Promise.all(
        feedFolders.map(async folder => {
          const childrenCollections = await ObjectStore('feedCollection').getMultipleByIds(folder.collections || [])
          return {
            type: 'folder',
            id: folder.id,
            icon: Icons.Folder,
            expanded: expandedSet.has(folder.id.toString()),
            onExpand: () => {
              onExpand?.(folder.id.toString())
            },
            name: folder.name,
            unread: childrenCollections.length + (folder.feeds?.length ?? 0),
            children: [
              ...(folder.collections
                ?.map(p => ({
                  type: 'collection',
                  id: p,
                  name: ObjectStore('feedCollection').getCachedOneById(p)?.name,
                  parentFolderId: folder.id
                }))
                .sort((a, b) => compareStrings(a.name, b.name)) || []),
              ...(folder.feeds
                ?.map(p => ({
                  type: 'item',
                  id: p,
                  image: ObjectStore('feed').getCachedOneById(p)?.image,
                  name: ObjectStore('feed').getCachedOneById(p)?.title,
                  parentFolderId: folder.id
                }))
                .sort((a, b) => compareStrings(a.name, b.name)) || [])
            ]
          } as Item
        })
      )
    ).sort((a, b) => compareStrings(a.name, b.name)) as Item[]
    setResult({
      folders: sortedFolders,
      collections: collectionItems
    })
  }
  useLayoutEffect(() => {
    calculateParents()
  }, [feedFolders, feedCollections, expandIds, data?.followedItems])
  const { t } = useTranslation()
  const keyToTrans = {
    collections: t(trans.Feed.Feeds),
    folders: t(trans.Folders),
    recently: t('feed.Recently liked')
  }

  const instance = useFeedInstance()
  const isHidden = KeyvalueStore.useValue('sidebarExpandData')?.includes('feed')
  const CLASS = 'hover:opacity-100 opacity-70 cursor-pointer transition-opacity'

  if (isHidden) {
    const LEFT_BAR_ICON_SIZE = '1.5rem'
    return (
      <div
        style={{
          background: 'var(--background-base)',
          width: '4.5rem'
        }}
        className='flex flex-col p-2 h-full rounded-lg'
      >
        <div className='p-3 mb-1'>
          <Icon
            onClick={() => {
              const currentCollapse = KeyvalueStore.getOne('sidebarExpandData')
              KeyvalueStore.updateOne(
                'sidebarExpandData',
                currentCollapse?.filter(i => i !== 'feed')
              )
            }}
            className={'hover-active-button'}
            size={24}
            name={'custom-left-bar'}
          />
        </div>
        <div className='flex-1 flex flex-col gap-1 no-scrollbar overflow-y-auto'>
          {result.folders.map(i => (
            <div onClick={() => instance.feedOps?.navigate?.('/feed/folder/' + i.id)} className='rounded-md p-2 light-hover'>
              <Icon
                tooltip={i.name}
                style={{
                  fontSize: LEFT_BAR_ICON_SIZE
                }}
                className='rounded-md transparent-font p-2 bg-secondary'
                name={Icons.Folder}
              />
            </div>
          ))}
          {result.collections.map(i => (
            <Tooltip content={i.name}>
              <div onClick={() => instance.feedOps?.navigate('/feed/collection/' + i.id)} className='rounded-md p-2 light-hover'>
                {i.image ? (
                  <img
                    src={i.image}
                    className='rounded'
                    style={{
                      width: `2.5rem`,
                      height: `2.5rem`
                    }}
                  />
                ) : (
                  <Icon
                    name='park-broadcast'
                    style={{
                      fontSize: LEFT_BAR_ICON_SIZE
                    }}
                    className='rounded-md transparent-font p-2 bg-secondary'
                  />
                )}
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div
      style={{
        background: 'var(--background-base)'
      }}
      className='rounded-lg h-full'
    >
      <div className='flex gap-5 items-center p-5'>
        <Icon
          onClick={() => {
            const currentCollapse = KeyvalueStore.getOne('sidebarExpandData')
            KeyvalueStore.updateOne(
              'sidebarExpandData',
              currentCollapse?.includes('feed') ? currentCollapse?.filter(i => i !== 'feed') : [...(currentCollapse || []), 'feed']
            )
          }}
          style={{
            appRegion: 'no-drag'
          }}
          className={CLASS}
          size={20}
          name={'custom-left-bar'}
        />
        <div
          className='font-bold cursor-pointer'
          onClick={() => {
            instance.feedOps?.navigate(FeedConsts.Routers.Library)
          }}
        >
          资料库
        </div>
        <div className='ml-auto flex'>
          <FeedCreateIcon />
        </div>
      </div>
      <div className={'flex flex-col gap-5 p-3 pb-10 overflow-y-auto no-scrollbar'}>
        {(['folders', 'collections'] as (keyof typeof result)[]).map(i =>
          result[i].length ? (
            <div key={i}>
              <div
                onClick={() => {
                  onExpand?.(`feed_sidebar_${i}`)
                }}
                className={'menu-sub-title ml-2 cursor-pointer mb-1.5'}
              >
                {keyToTrans[i]}
              </div>
              {expandIds?.includes(`feed_sidebar_${i}`) ? null : result[i].map(o => <Item key={o.id} item={o} />)}
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

const Item = ({ item }: { item: Item }) => {
  const parent = ObjectStore(item.type === 'collection' ? 'feedCollection' : item.type === 'folder' ? 'feedFolder' : 'feed').useValue(
    item.id
  )
  if (!parent) return null
  const togglable = item.children?.length > 0
  const unread = item.unread || ('unreadCount' in parent ? parent.unreadCount : undefined)
  const name = 'name' in parent ? parent.name : 'title' in parent ? parent.title : ''
  const image = item.image || ('icon' in parent ? GNewsToImage(parent.icon) : 'image' in parent ? parent.image : undefined)
  const icon = item.icon
  return (
    <>
      <SidebarExpandItem
        icon={icon}
        name={name}
        childrenSize={unread}
        onClick={() => {
          Global.layoutOps?.openPage('feed').then(ins => {
            if (item.type === 'collection') {
              ins.feedOps?.navigate?.(`/feed/collection/${item.id}`)
            } else if (item.type === 'folder') {
              ins.feedOps?.navigate?.(`/feed/folder/${item.id}`)
            } else {
              ins.feedOps?.navigate?.(`/feed/${item.id}`)
            }
          })
        }}
        expanded={item.expanded}
        onExpand={item.onExpand}
        expandable={togglable}
        image={image}
        contextMenu={setV =>
          item.type === 'folder' ? (
            <FeedFolderMenu id={item.id} onClose={() => setV(false)} />
          ) : item.type === 'collection' ? (
            <FeedCollectionMenu parentFolderId={item.parentFolderId} id={item.id} onClose={() => setV(false)} />
          ) : (
            <FeedItemMenu parentFolderId={item.parentFolderId} id={item.id} onClose={() => setV(false)} />
          )
        }
      />
      {item.expanded && item.children?.length ? (
        <div className={'pl-3'}>
          {item.children.map(i => (
            <Item item={i} key={i.id} />
          ))}
        </div>
      ) : null}
    </>
  )
}
