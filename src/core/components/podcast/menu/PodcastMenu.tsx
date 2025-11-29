import { Menu, WithBorder } from '@/components'
import { ObjectStore } from '@/api/stores'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import usePodcastInstance, { IPodcastInstance } from '@/core/components/podcast/hooks/usePodcastInstance'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import useEpisodeIsMeta from '@/core/components/podcast/hooks/useEpisodeIsMeta'
import addEpisodeAsMeta from '@/core/components/podcast/services/addEpisodeAsMeta'
import { Icons } from '@/consts'
import { MetaStore } from '@/api/stores'
import trans from '@/consts/trans'
import usePodcastState from '@/core/components/podcast/hooks/usePodcastState'
import { useInRouterContext, useMatch } from 'react-router-dom'
import toast from 'react-hot-toast'
import { IMenuLayoutItem } from '@/components/base/menu'

const PodcastMenu = ({
  id,
  type,
  onClose,
  showMeta = true,
  parentFolderId,
  showPlay = true
}: {
  id: number
  type: 'podcast' | 'episode'
  onClose?: VoidFunction
  parentFolderId?: number
  showMeta?: boolean
  showPlay?: boolean
}) => {
  const podcast = ObjectStore(type).useValue(id)
  const p = usePodcastData().playlist
  const playlist = useMemo(() => p, [])
  const inPlaylist = playlist.list.includes(id)
  const podcastState = usePodcastState()[0]
  const inPodcastTab = useInRouterContext()
  const matchEpisode = inPodcastTab && useMatch('/episode/:id')?.params.id === String(id)
  const isPlaying = type === 'episode' && podcastState.isPlaying && p.current === id
  const instance = usePodcastInstance()
  const episode = type === 'episode' ? ObjectStore('episode').useValue(id) : undefined
  const isMeta = type === 'episode' ? useEpisodeIsMeta(id) : undefined
  const podcastId = inPodcastTab && useMatch('/podcast/:id')?.params.id
  const matchPodcast = (type === 'podcast' && podcastId === String(id)) || (type === 'episode' && episode?.podcastId === Number(podcastId))
  const moveToMenu = useMoveToMenu({ id, parentFolderId, type })
  const { t } = useTranslation()
  const showMetaMenu = showMeta !== false ? true : isMeta && !isMeta.temp && !isMeta.deleted
  const getInstance = async (): Promise<IPodcastInstance> => {
    return new Promise(res => Global.layoutOps?.openPage('podcast').then(res))
  }
  return (
    <WithBorder onClick={e => e.stopPropagation()} padding={'0.4rem 0'}>
      <Menu.NavigationMenu
        className={'!min-w-52'}
        layout={[
          showPlay && type === 'episode'
            ? {
                icon: isPlaying ? 'park-pause' : 'park-play',
                text: isPlaying ? t('general.Pause') : t('general.Play'),
                key: 'play',
                type: 'item',
                onSelect: async () => {
                  onClose?.()
                  if (isPlaying) {
                    instance.actionOps?.pause?.()
                  } else {
                    ;(await getInstance()).actionOps?.playEpisode?.(id)
                  }
                }
              }
            : undefined,
          showPlay && type === 'episode'
            ? {
                icon: 'park-music-list',
                key: 'playlist',
                type: 'item',
                text: inPlaylist ? t('podcast.Remove from playlist') : t('podcast.Add to playlist'),
                onSelect: () => {
                  instance.actionOps?.queueEpisode?.(id)
                  onClose?.()
                }
              }
            : undefined,
          showPlay && type === 'episode' ? { type: 'separator' } : undefined,
          showPlay && {
            icon: podcast?.followed ? Icons.Unfollow : Icons.Follow,
            text: podcast?.followed ? t(trans.Unfollow) : t(trans.Follow),
            key: 'follow',
            type: 'item',
            onSelect: () => {
              onClose?.()
              instance.dataOps?.follow?.(id, type)
            }
          },
          parentFolderId
            ? {
                type: 'item',
                key: 'move-out',
                text: t('feed.Move out from folder'),
                icon: 'park-folder-withdrawal',
                onSelect: async () => {
                  onClose?.()
                  const parentFolder = await ObjectStore('podcastFolder').getOneById(parentFolderId)
                  if (parentFolder) {
                    const current = await ObjectStore(type).fetchOneById(id)
                    const lastThumbnail = (
                      parentFolder.episodes[0]
                        ? await ObjectStore('episode').fetchOneById(parentFolder.episodes[0])
                        : parentFolder.podcasts[0]
                          ? await ObjectStore('podcast').fetchOneById(parentFolder.podcasts[0])
                          : undefined
                    )?.thumbnail
                    await ObjectStore('podcastFolder').updateOne({
                      id: parentFolderId,
                      thumbnail: parentFolder.thumbnail === current?.thumbnail ? lastThumbnail : parentFolder.thumbnail,
                      [type === 'episode' ? 'episodes' : 'podcasts']: parentFolder[type === 'episode' ? 'episodes' : 'podcasts']?.filter(
                        i => i !== id
                      )
                    })
                  }
                }
              }
            : undefined,
          {
            type: 'item',
            key: 'save-to',
            text: t(trans.Save),
            subMenuStyle: { width: 200 },
            icon: Icons.Folder,
            subMenu: moveToMenu?.(onClose)
          },
          (type === 'podcast' || episode?.podcastId) && !matchPodcast
            ? {
                icon: 'park-fm',
                text: t('podcast.Open podcast'),
                key: 'open-podcast',
                type: 'item',
                onSelect: async () => {
                  ;(await getInstance()).actionOps?.openPodcast?.(type === 'podcast' ? id : episode!.podcastId!)
                  onClose?.()
                }
              }
            : undefined,
          // @ts-ignore
          ...(type === 'episode' && showMetaMenu
            ? [
                { type: 'separator' },
                showMeta &&
                  (isMeta && !isMeta.temp && !isMeta.deleted
                    ? {
                        icon: 'park-info',
                        text: t('general.View details'),
                        key: 'view-info',
                        type: 'item',
                        onSelect: () => {
                          onClose?.()
                          Global.metaOps?.openDetails(isMeta.id)
                        }
                      }
                    : {
                        icon: Icons.AddAsObject,
                        text: t(trans.Meta.AddAsObject),
                        key: 'add-as-meta',
                        type: 'item',
                        onSelect: () => {
                          setTimeout(() => {
                            addEpisodeAsMeta(id, isMeta).then(m => {
                              if (m) {
                                toast.success(t(trans.Success.AddedSuccessfully))
                              }
                            })
                          }, 200)
                          onClose?.()
                        }
                      }),
                {
                  type: 'item',
                  key: 'move-to',
                  text: t(trans.Meta.MoveTo),
                  icon: Icons.MoveTo,
                  onSelect: async () => {
                    onClose?.()
                    const meta = isMeta ?? (await addEpisodeAsMeta(id))
                    if (meta) {
                      if (meta.temp) {
                        await MetaStore.updateMetaObject({ id: meta.id, temp: false })
                      }
                      if (meta.deleted) {
                        await MetaStore.updateMetaObject({ id: meta.id, deleted: false })
                      }
                      Global.metaOps?.quickAdd(meta.id)
                    }
                  }
                },
                isMeta &&
                  !isMeta.temp &&
                  !isMeta.deleted && {
                    type: 'item',
                    key: 'delete',
                    text: t(trans.Delete),
                    icon: Icons.Delete,
                    onSelect: () => {
                      onClose?.()
                      setTimeout(() => {
                        MetaStore.deleteMetaObject(isMeta.id)
                        toast.success(t(trans.Success.DeleteSuccessfully))
                      }, 200)
                    }
                  }
              ]
            : [])
        ]}
      />
    </WithBorder>
  )
}

const useMoveToMenu = ({ id, parentFolderId, type }: { id?: number; parentFolderId?: number; type: 'podcast' | 'episode' }) => {
  const allFolders = ObjectStore('podcastFolder').useAll()
  const { t } = useTranslation()
  const leftFolders = Array.from(allFolders.values())
    .filter(i => i.id !== parentFolderId)
    .sort((a, b) => b.createdAt - a.createdAt)
  const instance = usePodcastInstance()
  if (!id) return null
  return (onClose?: VoidFunction) =>
    [
      leftFolders.length
        ? {
            type: 'title',
            name: t('feed.Assign to folder')
          }
        : undefined,
      // @ts-ignore
      ...leftFolders.map(i => ({
        type: 'item',
        key: String(i.id),
        text: i.name || t(trans.Unnamed),
        onSelect: async () => {
          onClose?.()
          toast.success(t(trans.Feed.SavedToFolder))
          const item = await ObjectStore(type).fetchOneById(id)
          const current = await ObjectStore('podcastFolder').fetchOneById(i.id)
          ObjectStore('podcastFolder').updateOne({
            id: i.id,
            thumbnail: item?.thumbnail ?? current?.thumbnail,
            [type === 'episode' ? 'episodes' : 'podcasts']: [id, ...i[type === 'episode' ? 'episodes' : 'podcasts'].filter(o => o !== id)]
          })
        }
      })),
      leftFolders.length ? { type: 'separator' } : undefined,
      {
        type: 'item',
        key: 'create-folder',
        text: t(trans.Feed.CreateFolder),
        icon: 'park-folder-plus',
        onSelect: async () => {
          onClose?.()
          instance.folderOps?.createFolder().then(async f => {
            toast.success(t(trans.Feed.SavedToFolder))
            const item = await ObjectStore(type).fetchOneById(id)
            ObjectStore('podcastFolder').updateOne({
              id: f.id,
              [type === 'episode' ? 'episodes' : 'podcasts']: [id],
              thumbnail: item?.thumbnail
            })
          })
        }
      }
    ].filter(i => i) as IMenuLayoutItem[]
}
PodcastMenu.useMoveToMenu = useMoveToMenu
export default PodcastMenu as typeof PodcastMenu & {
  useMoveToMenu: typeof useMoveToMenu
}
