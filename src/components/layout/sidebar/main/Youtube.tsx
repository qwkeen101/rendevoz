import { ObjectStore } from '@/api/stores'
import { useEffect, useState } from 'react'
import { noRepeatArray } from '@/utils'
import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import { ISidebarWidgetProps, SidebarExpandItem } from '@/components/layout/sidebar/main/index'
import YoutubeFolderMenu from '@/core/components/youtube/YoutubeFolderMenu'
import YoutubeItemMenu from '@/core/components/youtube/YoutubeItemMenu'
import { compareStrings } from '@/utils/str'
import { groupBy } from 'lodash'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import { Button, Icon, Tooltip } from '@/components'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import YoutubeConsts from '@/core/components/youtube/YoutubeConsts'
import KeyvalueStore from '@/api/stores/keyvalue.store'

type Item = {
  type: 'channel' | 'folder' | 'video' | 'playlist'
  id: number
  children: Item[]
  expanded?: boolean
  onExpand?: VoidFunction
  image?: string
  parentFolderId?: number
  name?: string
}

export default ({ expandIds, onExpand }: ISidebarWidgetProps) => {
  const youtubeFolders = ObjectStore('youtubeFolder').useAll()
  const data = useYoutubeData()
  const channels = ObjectStore('youtubeChannel').useMultiple(data.followedChannels)
  const videos = ObjectStore('youtubeVideo').useMultiple(data.followedVideos)
  const playlists = ObjectStore('youtubePlaylist').useMultiple(data.followedPlaylists)
  const [result, setResult] = useState<{
    channels: Item[]
    playlists: Item[]
    folders: Item[]
  }>({
    channels: [],
    playlists: [],
    folders: []
  })

  const { t } = useTranslation()
  const keyToTrans = {
    channels: t(trans.Feed.Channels),
    videos: t(trans.Feed.Videos),
    playlists: t(trans.Feed.Playlists),
    folders: t(trans.Folders)
  }

  useEffect(() => {
    ObjectStore('youtubeFolder').getAll()
  }, [])

  const calculateParents = async () => {
    const expandedSet = new Set(expandIds)
    const inFolderChannels = new Set(youtubeFolders.map(i => i.items?.filter(i => i.type === 'channel').map(i => i.id)).flat())
    const inFolderPlaylists = new Set(youtubeFolders.map(i => i.items?.filter(i => i.type === 'playlist').map(i => i.id)).flat())
    const allFollowedChannels = await ObjectStore('youtubeChannel').getMultipleByIds(
      noRepeatArray([...channels.map(i => i.id), ...inFolderChannels])
    )
    const allFollowedPlaylists = await ObjectStore('youtubePlaylist').getMultipleByIds(
      noRepeatArray([...playlists.map(i => i.id), ...inFolderPlaylists])
    )
    await ObjectStore('youtubeChannel').getMultipleByIds(noRepeatArray([...inFolderChannels]))
    const channelToPlaylists = groupBy(allFollowedPlaylists, 'channelAppId')
    const playlistItems = allFollowedPlaylists
      .map(p => {
        return {
          type: 'playlist',
          id: p.id,
          image: p.thumbnail,
          name: p.name,
          expanded: expandedSet.has(`playlist_${p.id}`),
          onExpand: () => {
            onExpand?.(`playlist_${p.id}`)
          },
          children: []
        }
      })
      .sort((a, b) => compareStrings(a.name, b.name)) as Item[]
    const channelItems = allFollowedChannels
      .map(channel => {
        const playlists = channelToPlaylists[channel.id] || []
        const items: Item[] = []
        if (playlists) {
          playlists.forEach(playlist => {
            items.push({
              type: 'playlist',
              id: playlist.id,
              image: playlist.thumbnail,
              name: playlist.name,
              expanded: expandedSet.has(`channel_${channel.id}_${playlist.id}`),
              onExpand: () => {
                onExpand?.(`channel_${channel.id}_${playlist.id}`)
              },
              children: []
            })
          })
          items.sort((a, b) => compareStrings(a.name, b.name))
        }
        return {
          type: 'channel',
          id: channel.id,
          image: channel.thumbnail,
          onExpand: () => {
            onExpand?.(`channel_${channel.id}`)
          },
          children: items,
          expanded: expandedSet.has(`channel_${channel.id}`),
          name: channel.name
        } as Item
      })
      .sort((a, b) => compareStrings(a.name, b.name))
    const folderItems = youtubeFolders
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
        const inFolderChannels = new Set(folder.items?.filter(i => i.type === 'channel').map(i => i.id))
        const inFolderPlaylists = new Set(folder.items?.filter(i => i.type === 'playlist').map(i => i.id))
        const inFolderVideos = new Set(folder.items?.filter(i => i.type === 'video').map(i => i.id))
        const channels: Item[] = []
        const playlists: Item[] = []
        const videos: Item[] = []
        inFolderChannels.forEach(c => {
          const expandId = `${folder.id}_${c}`
          const channelItem: Item = {
            type: 'channel',
            id: c,
            name: ObjectStore('youtubeChannel').getCachedOneById(c)?.name,
            parentFolderId: folder.id,
            expanded: expandedSet.has(expandId),
            onExpand: () => {
              onExpand?.(expandId)
            },
            children: []
          }
          channels.push(channelItem)
        })
        inFolderPlaylists.forEach(p => {
          const expandId = `${folder.id}_${p}`
          playlists.push({
            type: 'playlist',
            id: p,
            name: ObjectStore('youtubePlaylist').getCachedOneById(p)?.name,
            expanded: expandedSet.has(expandId),
            onExpand: () => {
              onExpand?.(expandId)
            },
            children: []
          })
        })
        inFolderVideos.forEach(v => {
          videos.push({
            type: 'video',
            children: [],
            id: v,
            name: ObjectStore('youtubeVideo').getCachedOneById(v)?.name
          })
        })
        channels.sort((a, b) => compareStrings(a.name, b.name))
        playlists.sort((a, b) => compareStrings(a.name, b.name))
        videos.sort((a, b) => compareStrings(a.name, b.name))
        item.children = [...channels, ...playlists, ...videos]
        return item
      })
      .sort((a, b) => compareStrings(a.name, b.name))

    setResult({
      playlists: playlistItems,
      channels: channelItems,
      folders: folderItems
    })
  }
  const instance = useYoutubeInstance()
  useEffect(() => {
    calculateParents()
  }, [youtubeFolders, channels, videos, expandIds, playlists])

  const isHidden = KeyvalueStore.useValue('sidebarExpandData')?.includes('youtube')
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
                currentCollapse?.includes('youtube')
                  ? currentCollapse?.filter(i => i !== 'youtube')
                  : [...(currentCollapse || []), 'youtube']
              )
            }}
            className={'hover-active-button'}
            size={24}
            name={'custom-left-bar'}
          />
        </div>
        <div className='flex-1 flex flex-col gap-1 no-scrollbar overflow-y-auto'>
          {result.folders.map(i => (
            <div onClick={() => instance.goTo?.(i.id, 'folder')} className='rounded-md p-2 light-hover'>
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
          {result.channels.map(i => (
            <Tooltip content={i.name}>
              <div onClick={() => instance.goTo?.(i.id, 'channel')} className='rounded-md p-2 light-hover'>
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
          {result.playlists.map(i => (
            <Tooltip content={i.name}>
              <div onClick={() => instance.goTo?.(i.id, 'playlist')} className='rounded-md p-2 light-hover'>
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
      className='flex flex-col h-full rounded-lg'
      style={{
        background: 'var(--background-base)'
      }}
    >
      <div className='flex gap-5 items-center p-5'>
        <Icon
          onClick={() => {
            const currentCollapse = KeyvalueStore.getOne('sidebarExpandData')
            KeyvalueStore.updateOne(
              'sidebarExpandData',
              currentCollapse?.includes('youtube') ? currentCollapse?.filter(i => i !== 'youtube') : [...(currentCollapse || []), 'youtube']
            )
          }}
          className={CLASS}
          size={20}
          name={'custom-left-bar'}
        />
        <div
          className='font-bold cursor-pointer'
          onClick={() => {
            instance.navigate?.(YoutubeConsts.Routers.Library)
          }}
        >
          资料库
        </div>
        <div className='ml-auto flex'>
          <Icon strokeWidth={4} size={18} className={CLASS} name={Icons.Create} />
        </div>
      </div>
      <div className={'flex flex-col gap-5 p-3 pt-0 pb-10 overflow-y-auto no-scrollbar'}>
        {(['folders', 'channels', 'playlists'] as (keyof typeof result)[]).map(i =>
          result[i].length ? (
            <div key={i}>
              <div
                onClick={() => {
                  onExpand?.(`youtube_sidebar_${i}`)
                }}
                className={'menu-sub-title ml-2 cursor-pointer mb-1.5'}
              >
                {keyToTrans[i]}
              </div>
              {expandIds?.includes(`youtube_sidebar_${i}`) ? null : result[i].map(o => <Item key={o.id} item={o} />)}
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

const Item = ({ item }: { item: Item }) => {
  const parent = ObjectStore(
    item.type === 'channel'
      ? 'youtubeChannel'
      : item.type === 'folder'
        ? 'youtubeFolder'
        : item.type === 'playlist'
          ? 'youtubePlaylist'
          : 'youtubeVideo'
  ).useValue(item.id)
  if (!parent) return null
  const togglable = item.children?.length > 0
  const image = item.type === 'folder' ? undefined : 'thumbnail' in parent ? parent.thumbnail : undefined
  return (
    <>
      <SidebarExpandItem
        contextMenu={setV =>
          item.type === 'folder' ? (
            <YoutubeFolderMenu id={item.id} onClose={() => setV(false)} />
          ) : (
            <YoutubeItemMenu parentFolderId={item.parentFolderId} id={item.id} onClose={() => setV(false)} type={item.type} />
          )
        }
        onClick={() => {
          Global.layoutOps?.openPage('youtube').then(ins => {
            if (item.type === 'folder') {
              ins.goTo?.(item.id, 'folder')
            }
            if (item.type === 'playlist') {
              ins.goTo?.(item.id, 'playlist')
            }
            if (item.type === 'channel') {
              ins.goTo?.(item.id, 'channel')
            }
            if (item.type === 'video') {
              ins.goTo?.(item.id, 'video')
            }
          })
        }}
        icon={Icons.Folder}
        image={image}
        expanded={item.expanded}
        name={parent.name}
        onExpand={item.onExpand}
        expandable={togglable}
        childrenSize={item.children?.length}
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
