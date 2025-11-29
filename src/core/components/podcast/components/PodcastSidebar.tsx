import { memo, useState } from 'react'
import { Resizable } from 're-resizable'
import { useTranslation } from 'react-i18next'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default memo(() => {
  const ids = KeyvalueStore.useValue('sidebarExpandData')
  const hidden = ids?.includes('podcast')
  return (
    <Resizable
      enable={hidden ? false : { right: true }}
      defaultSize={{ width: hidden ? 'auto' : 320, height: '100%' }}
      key={hidden ? 'true' : 'false'}
      className={'flex flex-col pt-0 p-3 pr-0'}
    >
      <Inner
        expandIds={ids}
        onExpand={id => KeyvalueStore.updateOne('sidebarExpandData', ids?.includes(id) ? ids.filter(i => i !== id) : [...(ids || []), id])}
      />
    </Resizable>
  )
})

import { ObjectStore } from '@/api/stores'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import { useEffect, useLayoutEffect } from 'react'
import { noRepeatArray } from '@/utils'
import { ISidebarWidgetProps, SidebarExpandItem } from '@/components/layout/sidebar/main'
import PodcastFolderMenu from '@/core/components/podcast/components/PodcastFolderMenu'
import PodcastMenu from '@/core/components/podcast/menu/PodcastMenu'
import { compareStrings } from '@/utils/str'
import { groupBy } from 'lodash'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import { Button, Icon, Tooltip } from '@/components'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import PodcastConsts from '@/core/components/podcast/PodcastConsts'

type Item = {
  type: 'podcast' | 'folder' | 'episode'
  id: number
  children: Item[]
  image?: string
  expanded?: boolean
  onExpand?: VoidFunction
  parentFolderId?: number
  name?: string
}

const Inner = ({ expandIds, onExpand }: ISidebarWidgetProps) => {
  const podcastsFolders = ObjectStore('podcastFolder').useAll()
  const podcasts = ObjectStore('podcast').useMultiple(usePodcastData().followedPodcasts)
  const episodes = ObjectStore('episode').useMultiple(usePodcastData().followedEpisodes)
  const [result, setResult] = useState<{
    folders: Item[]
    podcasts: Item[]
    recently: Item[]
  }>({
    folders: [],
    podcasts: [],
    recently: []
  })
  const { t } = useTranslation()
  const keyToTrans = {
    podcasts: t('podcast.Podcasts'),
    recently: t('feed.Recently liked'),
    folders: t(trans.Folders)
  }
  useEffect(() => {
    ObjectStore('podcastFolder').getAll()
  }, [])
  const calculateParents = async () => {
    const expandedSet = new Set(expandIds)
    const inFolderEpisodes = new Set(podcastsFolders.map(i => i.episodes || []).flat())
    const inFolderPodcasts = new Set(podcastsFolders.map(i => i.podcasts).flat())
    const allFollowedEpisodes = await ObjectStore('episode').getMultipleByIds(
      noRepeatArray([...episodes.map(i => i.id), ...inFolderEpisodes])
    )
    const allFollowedPodcasts = await ObjectStore('podcast').getMultipleByIds(
      noRepeatArray([...podcasts.map(i => i.id), ...inFolderPodcasts])
    )
    const podcastToEpisodes = groupBy(allFollowedEpisodes, 'podcastId')
    const folderItems = podcastsFolders
      .map(folder => {
        const item: Item = {
          type: 'folder',
          id: folder.id,
          expanded: expandedSet.has(folder.id.toString()),
          onExpand: () => {
            onExpand?.(folder.id.toString())
          },
          name: folder.name,
          children: []
        }
        folder.podcasts?.forEach(p => {
          item.children.push({
            type: 'podcast',
            id: p,
            parentFolderId: folder.id,
            name: ObjectStore('podcast').getCachedOneById(p)?.name,
            children: []
          })
        })
        item.children.sort((a, b) => compareStrings(a.name, b.name))
        folder.episodes
          ?.map(e => ({
            type: 'episode',
            id: e,
            name: ObjectStore('episode').getCachedOneById(e)?.name,
            children: [],
            parentFolderId: folder.id
          }))
          .sort((a, b) => compareStrings(a.name, b.name))
          .forEach(i => item.children.push(i))
        return item
      })
      .sort((a, b) => compareStrings(a.name, b.name))
    const podcastItems = allFollowedPodcasts
      .map(p => ({
        type: 'podcast',
        id: p.id,
        onExpand: () => {
          onExpand?.(p.id.toString())
        },
        image: p.thumbnail,
        name: p.name,
        expanded: expandedSet.has(p.id.toString()),
        children:
          podcastToEpisodes[p.id]
            ?.map(i => ({
              id: i.id,
              type: 'episode',
              children: [],
              name: i.name
            }))
            .sort((a, b) => compareStrings(a.name, b.name)) || []
      }))
      .sort((a, b) => compareStrings(a.name, b.name)) as Item[]
    const episodeItems = allFollowedEpisodes
      .filter(i => i.followed)
      .slice(0, 15)
      .map(e => ({
        name: e.name,
        id: e.id,
        children: [],
        type: 'episode'
      })) as Item[]

    setResult({
      recently: episodeItems,
      podcasts: podcastItems,
      folders: folderItems
    })
  }

  useLayoutEffect(() => {
    calculateParents()
  }, [podcastsFolders, podcasts, episodes, expandIds])

  const instance = usePodcastInstance()

  const isHidden = KeyvalueStore.useValue('sidebarExpandData')?.includes('podcast')
  if (isHidden) {
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
                currentCollapse?.includes('podcast')
                  ? currentCollapse?.filter(i => i !== 'podcast')
                  : [...(currentCollapse || []), 'podcast']
              )
            }}
            className={'hover-active-button'}
            size={24}
            name={'custom-left-bar'}
          />
        </div>
        <div className='flex-1 flex flex-col gap-1 no-scrollbar overflow-y-auto'>
          {result.folders.map(i => (
            <div onClick={() => instance.actionOps?.openFolder?.(i.id)} className='rounded-md p-2 light-hover'>
              <Icon
                tooltip={i.name}
                style={{
                  fontSize: '1.5rem'
                }}
                className='rounded-md transparent-font p-2 bg-secondary'
                name={Icons.Folder}
              />
            </div>
          ))}
          {result.podcasts.map(i => (
            <Tooltip content={i.name}>
              <div onClick={() => instance.actionOps?.openPodcast(i.id)} className='rounded-md p-2 light-hover'>
                <img
                  src={i.image}
                  className='rounded'
                  style={{
                    width: `2.5rem`,
                    height: `2.5rem`
                  }}
                />
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    )
  }
  const CLASS = 'hover:opacity-100 opacity-70 cursor-pointer transition-opacity'
  return (
    <div
      style={{
        background: 'var(--background-base)'
      }}
      className='rounded-lg flex flex-col h-full'
    >
      <div className='flex gap-5 items-center p-5'>
        <Icon
          onClick={() => {
            const currentCollapse = KeyvalueStore.getOne('sidebarExpandData')
            KeyvalueStore.updateOne(
              'sidebarExpandData',
              currentCollapse?.includes('podcast') ? currentCollapse?.filter(i => i !== 'podcast') : [...(currentCollapse || []), 'podcast']
            )
          }}
          className={CLASS}
          size={20}
          name={'custom-left-bar'}
        />
        <div
          className='font-bold cursor-pointer'
          onClick={() => {
            instance.navigate?.(PodcastConsts.Routers.Library)
          }}
        >
          资料库
        </div>
        <div className='ml-auto flex'>
          <Icon strokeWidth={4} size={18} className={CLASS} name={Icons.Create} />
        </div>
      </div>
      <div className={'flex flex-col gap-5 p-3 pt-0 pb-10 overflow-y-auto no-scrollbar'}>
        {(['folders', 'podcasts', 'recently'] as (keyof typeof result)[]).map(i =>
          result[i].length ? (
            <div key={i}>
              <div
                onClick={() => {
                  onExpand?.(`podcast_sidebar_${i}`)
                }}
                className={'menu-sub-title ml-2 cursor-pointer mb-1.5'}
              >
                {keyToTrans[i]}
              </div>
              {expandIds?.includes(`podcast_sidebar_${i}`) ? null : result[i].map(o => <Item key={o.id} item={o} />)}
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

const Item = ({ item }: { item: Item }) => {
  const parent = ObjectStore(item.type === 'podcast' ? 'podcast' : item.type === 'folder' ? 'podcastFolder' : 'episode').useValue(item.id)
  const ins = usePodcastInstance()
  if (!parent) return null
  const togglable = item.children?.length > 0
  return (
    <>
      <SidebarExpandItem
        expandable={togglable}
        icon={Icons.Folder}
        name={parent.name}
        image={item.type === 'folder' ? undefined : parent.thumbnail}
        childrenSize={item.children?.length}
        onClick={() => {
          if (item.type === 'podcast') {
            ins.actionOps?.openPodcast?.(item.id)
          } else if (item.type === 'folder') {
            ins.actionOps?.openFolder?.(item.id)
          } else {
            ins.actionOps?.openEpisode?.(item.id)
          }
        }}
        onExpand={item.onExpand}
        expanded={item.expanded}
        contextMenu={setV =>
          item.type === 'folder' ? (
            <PodcastFolderMenu id={item.id} onClose={() => setV(false)} />
          ) : (
            <PodcastMenu parentFolderId={item.parentFolderId} id={item.id} onClose={() => setV(false)} type={item.type} />
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
