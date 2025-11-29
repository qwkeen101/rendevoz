import { useTranslation } from 'react-i18next'
import { Menu, WithBorder } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import { IMenuLayoutItem } from '@/components/base/menu'
import { IYoutubeChannel, IYoutubeInstance, IYoutubePlaylist, IYoutubeVideo } from '~/typings'
import YoutubeServices from '@/core/components/youtube/YoutubeServices'
import { useLayoutEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSetAtom } from 'jotai/react'
import useYoutubeVideoToMeta from '@/core/components/youtube/hooks/useYoutubeVideoToMeta'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { YoutubeStateAtom } from '@/core/components/youtube/hooks/useYoutubeState'

const getYtItem = async (id: string, type: 'channel' | 'playlist' | 'video') => {
  if (type === 'channel') {
    return await ObjectStore('youtubeChannel').fetchByConditions({ channelId: id })
  }
  if (type === 'playlist') {
    return await ObjectStore('youtubePlaylist').fetchByConditions({ playlistId: id })
  }
  return await ObjectStore('youtubeVideo').fetchByConditions({ videoId: id })
}

const YoutubeItemMenu = ({
  id,
  onClose,
  parentFolderId,
  type,
  showMeta = true,
  showFollow = true
}: {
  id: number | string
  showMeta?: boolean
  onClose: VoidFunction
  parentFolderId?: number
  showFollow?: boolean
  type: 'video' | 'channel' | 'playlist'
}) => {
  const itemType =
    type === 'video' ? 'youtubeVideo' : type === 'channel' ? 'youtubeChannel' : type === 'playlist' ? 'youtubePlaylist' : 'youtubeVideo'
  const { t } = useTranslation()
  const getInstance = async (): Promise<IYoutubeInstance> => {
    return new Promise(res => {
      Global.layoutOps?.openPage('youtube').then(res)
    })
  }
  const instance = useYoutubeInstance()
  const getRealId = async () => {
    if (rId) {
      return rId
    }
    if (!item && typeof id === 'string') {
      let res =
        type === 'channel'
          ? await instance.addChannel?.(id)
          : type === 'playlist'
            ? await instance.addPlaylist?.(id)
            : await instance.addVideo?.(id)
      if (res) {
        return res.id
      }
      return
    }
    if (typeof id === 'number') {
      return id
    }
    return
  }
  const setYoutubeState = useSetAtom(YoutubeStateAtom)
  const [rId, setRId] = useState<number | undefined>(typeof id === 'number' ? id : undefined)
  const item = ObjectStore(itemType).useValue(rId)
  const meta = type === 'video' ? useYoutubeVideoToMeta(item?.id) : undefined
  const getLink = () => {
    if (!item && typeof id !== 'string') return
    const strId = typeof id === 'string' ? id : undefined
    if (type === 'video') {
      const videoId = strId ?? (item as IYoutubeVideo).videoId
      return `https://www.youtube.com/watch?v=${videoId}`
    }
    if (type === 'channel') {
      const channelId = strId ?? (item as IYoutubeChannel).channelId
      return `https://www.youtube.com/channel/${channelId}`
    }
    if (type === 'playlist') {
      const playlistId = strId ?? (item as IYoutubePlaylist).playlistId
      return `https://www.youtube.com/playlist?list=${playlistId}`
    }
  }
  const getChannelId = async () => {
    if (item && 'channelId' in item && item.channelId) {
      return item.channelId
    }
    if (typeof id === 'string') {
      if (type === 'video') {
        const video = await YoutubeServices.getVideo(id)
        if (video?.items.length) {
          const v = video.items[0].snippet.channelId
          return v
        }
      }
      if (type === 'playlist') {
        const playlist = await YoutubeServices.getPlaylist(id)
        if (playlist?.items.length) {
          const v = playlist.items[0].snippet.channelId
          return v
        }
      }
    }
  }
  useLayoutEffect(() => {
    if (typeof id === 'string') {
      getYtItem(id, type).then(res => {
        if (res.length) {
          return setRId(res[0].id)
        }
      })
    }
  }, [])

  const moveToMenu = useMoveToMenu({ parentFolderId, id: rId ?? id, type })
  const showMetaMenu = showMeta !== false ? true : showMeta === false ? meta && !meta.temp && !meta.deleted : false

  return (
    <WithBorder className={'py-[0.4rem] min-w-56'} onClick={e => e.stopPropagation()}>
      <Menu.NavigationMenu
        layout={[
          showFollow && {
            type: 'item',
            text: item?.followed ? t(trans.Unfollow) : t(trans.Follow),
            key: 'follow',
            icon: Icons.Follow,
            iconTheme: item?.followed ? 'filled' : undefined,
            iconClassName: item?.followed ? 'text-red-500' : '',
            onSelect: () => {
              onClose()
              setTimeout(async () => {
                const realId = await getRealId()
                if (realId) {
                  instance.follow?.(realId, type)
                }
              }, 160)
            }
          },
          parentFolderId
            ? {
                type: 'item',
                key: 'move-out',
                text: t('feed.Move out from folder'),
                icon: 'park-folder-withdrawal',
                onSelect: async () => {
                  onClose()
                  const parentFolder = await ObjectStore('youtubeFolder').getOneById(parentFolderId)
                  if (parentFolder) {
                    await ObjectStore('youtubeFolder').updateOne({
                      id: parentFolderId,
                      items: parentFolder.items?.filter(i => i.id !== id)
                    })
                  }
                }
              }
            : undefined,
          {
            type: 'item',
            key: 'move-to',
            text: t(trans.Save),
            subMenuStyle: { width: 200 },
            icon: Icons.Folder,
            subMenu: moveToMenu(onClose)
          },
          type === 'video' || type === 'playlist'
            ? {
                type: 'item',
                text: t(trans.Feed.ViewChannel),
                key: 'view-channel',
                icon: Icons.ApplicationAll,
                onSelect: async () => {
                  const id = await getChannelId()
                  if (id) {
                    instance.addChannel?.(id).then(async res => {
                      ;(await getInstance()).goTo?.(res.id, 'channel')
                    })
                  }
                  onClose()
                }
              }
            : undefined,
          item && 'playlistAppId' in item && item.playlistAppId
            ? {
                type: 'item',
                text: t(trans.Feed.ViewPlaylist),
                key: 'view-playlist',
                icon: Icons.Playlist,
                onSelect: async () => {
                  const playlistId = item.playlistAppId
                  if (playlistId) {
                    ;(await getInstance()).goTo?.(playlistId, 'playlist')
                  }
                  onClose()
                }
              }
            : undefined,
          {
            type: 'item',
            text: t(trans.CopyLink),
            key: 'copy-link',
            icon: Icons.Copy,
            onSelect: () => {
              const link = getLink()
              if (link) {
                navigator.clipboard.writeText(link)
                toast.success(t(trans.Copied))
              }
              onClose()
            }
          },
          ...(type === 'video' && showMetaMenu
            ? ([
                {
                  type: 'separator'
                },
                showMeta && {
                  type: 'item',
                  key: 'add as object',
                  icon: meta ? Icons.Info : Icons.AddAsObject,
                  text: meta ? t(trans.Meta.ViewDetails) : t(trans.Meta.AddAsObject),
                  onSelect: async () => {
                    onClose?.()
                    if (meta) {
                      Global.metaOps?.openDetails(meta.id)
                    } else {
                      const realId = await getRealId()
                      if (realId) {
                        instance.addVideoAsMeta?.(realId)
                        toast.success(t(trans.Success.AddedSuccessfully))
                      }
                    }
                  }
                },
                {
                  type: 'item',
                  key: 'add tag',
                  icon: Icons.Tag,
                  text: t(trans.AddTag),
                  onSelect: async () => {
                    onClose?.()
                    if (meta) {
                      Global.metaOps?.quickAdd(meta.id, 'tags')
                    } else {
                      const realId = await getRealId()
                      if (realId) {
                        const m = await instance.addVideoAsMeta?.(realId)
                        if (m) {
                          Global.metaOps?.quickAdd(m.id, 'tags')
                        }
                      }
                    }
                  }
                },
                {
                  type: 'item',
                  key: 'move to',
                  icon: Icons.MoveTo,
                  text: t(trans.Meta.MoveTo),
                  onSelect: async () => {
                    onClose?.()
                    if (meta) {
                      Global.metaOps?.quickAdd(meta.id)
                    } else {
                      const realId = await getRealId()
                      if (realId) {
                        const m = await instance.addVideoAsMeta?.(realId)
                        if (m) {
                          Global.metaOps?.quickAdd(m.id)
                        }
                      }
                    }
                  }
                },
                meta &&
                  !meta.deleted &&
                  !meta.temp && {
                    type: 'item',
                    key: 'delete-meta',
                    icon: Icons.Delete,
                    text: t(trans.Delete),
                    onSelect: () => {
                      onClose?.()
                      setTimeout(() => {
                        MetaStore.deleteMetaObject(meta.id)
                        toast.success(t(trans.Success.DeleteSuccessfully))
                      }, 200)
                    }
                  }
              ] as IMenuLayoutItem[])
            : [])
        ]}
      />
    </WithBorder>
  )
}

const useMoveToMenu = ({ parentFolderId, id, type }: { parentFolderId?: number; id: number | string; type: string }) => {
  const allFolders = ObjectStore('youtubeFolder').useAll()
  const { t } = useTranslation()
  const instance = useYoutubeInstance()
  const getRealId = async () => {
    if (typeof id === 'string') {
      let res =
        type === 'channel'
          ? await instance.addChannel?.(id)
          : type === 'playlist'
            ? await instance.addPlaylist?.(id)
            : await instance.addVideo?.(id)
      if (res) {
        return res.id
      }
      return
    }
    if (typeof id === 'number') {
      return id
    }
    return
  }
  const leftFolder = Array.from(allFolders.values())
    .filter(i => i.id !== parentFolderId)
    .sort((a, b) => b.createdAt - a.createdAt)
  return (onClose?: VoidFunction) =>
    [
      leftFolder.length
        ? {
            type: 'title',
            name: t('feed.Assign to folder')
          }
        : undefined,
      // @ts-ignore
      ...leftFolder.map(i => ({
        type: 'item',
        key: String(i.id),
        text: i.name,
        onSelect: async () => {
          onClose?.()
          const realId = await getRealId()
          if (!realId) return
          toast.success(t(trans.Feed.SavedToFolder))
          ObjectStore('youtubeFolder').updateOne({
            id: i.id,
            items: [
              {
                id: realId,
                type
              },
              ...(i.items?.filter(o => o.id !== realId) || [])
            ]
          })
        }
      })),
      leftFolder.length ? { type: 'separator' } : undefined,
      {
        type: 'item',
        key: 'create-folder',
        text: t(trans.Feed.CreateFolder),
        icon: 'park-folder-plus',
        onSelect: () => {
          onClose?.()
          instance.createFolder?.().then(async f => {
            const realId = await getRealId()
            if (!realId) return
            toast.success(t(trans.Feed.SavedToFolder))
            ObjectStore('youtubeFolder').updateOne({
              id: f.id,
              items: [
                {
                  type,
                  id: realId
                }
              ]
            })
          })
        }
      }
    ].filter(i => i) as IMenuLayoutItem[]
}

YoutubeItemMenu.useMoveToMenu = useMoveToMenu
export default YoutubeItemMenu as typeof YoutubeItemMenu & {
  useMoveToMenu: typeof useMoveToMenu
}
