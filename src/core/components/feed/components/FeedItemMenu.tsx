import { Menu, WithBorder } from '@/components'
import { ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import addFeedAsMeta from '@/core/components/feed/utils/service/addFeedAsMeta'
import toast from 'react-hot-toast'
import useFeedIsMeta from '@/core/components/feed/hooks/useFeedIsMeta'
import { Icons } from '@/consts'
import trans from '@/consts/trans'
import { IFeedInstance, IFeedItem } from '~/typings'
import { useLayoutEffect, useState } from 'react'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { IMenuLayoutItem } from '@/components/base/menu'

const FeedItemMenu = ({
  id,
  onClose,
  item,
  parentFolderId
}: {
  id?: number
  onClose: VoidFunction
  item?: Partial<IFeedItem>
  parentFolderId?: number
}) => {
  const [realId, setRealId] = useState(id)
  const feed = ObjectStore('feed').useValue(realId)
  const getInstance = async (): Promise<IFeedInstance> => {
    return new Promise(res => Global.layoutOps?.openPage('feed').then(res))
  }
  useLayoutEffect(() => {
    if (typeof id === 'number') {
      setRealId(id)
      return
    }
    if (item && item.link) {
      ObjectStore('feed')
        .fetchByConditions({ link: item.link })
        .then(res => {
          if (res.length) {
            setRealId(res[0].id)
          }
        })
    }
  }, [])
  const getId = async () => {
    if (realId) {
      return realId
    }
    if (!item || !item.link) return
    return (await ObjectStore('feed').addOne({ ...item })).id
  }
  const { isMeta, metaId } = useFeedIsMeta(realId)
  const { t } = useTranslation()
  const instance = useFeedInstance()
  const link = feed?.link ?? item?.link
  const menu = useMoveToMenu({
    parentFolderId,
    onGetId: async () => {
      return await getId()
    }
  })
  if (!feed && !item) return null
  return (
    <WithBorder className={'py-[0.4rem] min-w-56'} onClick={e => e.stopPropagation()}>
      <Menu.NavigationMenu
        layout={[
          {
            key: 'follow',
            type: 'item',
            icon: feed?.followed ? Icons.Unfollow : Icons.Follow,
            text: feed?.followed ? t(trans.Unfollow) : t(trans.Follow),
            onSelect: async () => {
              onClose()
              const realId = await getId()
              if (realId) {
                setTimeout(() => instance.feedOps?.follow(realId), 150)
              }
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
                  const parentFolder = await ObjectStore('feedFolder').getOneById(parentFolderId)
                  if (parentFolder) {
                    await ObjectStore('feedFolder').updateOne({
                      id: parentFolderId,
                      feeds: parentFolder.feeds?.filter(i => i !== id)
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
            subMenu: menu?.(onClose)
          },
          feed?.collectionId
            ? {
                key: 'view-feed',
                type: 'item',
                icon: Icons.Link,
                text: t(trans.Feed.ViewFeed),
                onSelect: async () => {
                  ;(await getInstance()).feedOps?.navigate(`/feed/collection/${feed?.collectionId}`)
                  onClose()
                }
              }
            : undefined,
          {
            key: 'view-original',
            type: 'item',
            icon: Icons.Efferent,
            text: t(trans.Feed.ViewOriginal),
            onSelect: async () => {
              onClose()
              link && window.open(link, '_blank')
            }
          },
          {
            key: 'copy-link',
            type: 'item',
            icon: Icons.Copy,
            text: t(trans.CopyLink),
            onSelect: async () => {
              onClose()
              if (link) {
                navigator.clipboard.writeText(link)
                toast.success(t('general.Copied'))
              }
            }
          },
          { type: 'separator' },
          isMeta
            ? {
                type: 'item',
                key: 'view-details',
                icon: Icons.Info,
                text: t(trans.Meta.ViewDetails),
                onSelect: () => {
                  onClose()
                  Global.metaOps?.openDetails?.(metaId)
                }
              }
            : {
                type: 'item',
                key: 'add as object',
                icon: Icons.AddAsObject,
                text: t(trans.Meta.AddAsObject),
                onSelect: async () => {
                  onClose()
                  const id = await getId()
                  if (id) {
                    setTimeout(() => addFeedAsMeta(id, metaId), 200)
                    toast.success(t(trans.Success.AddedSuccessfully))
                  }
                }
              },
          {
            key: 'add-tag',
            type: 'item',
            icon: Icons.Tag,
            text: t(trans.AddTag),
            onSelect: async () => {
              onClose()
              const id = await getId()
              if (id) {
                if (!isMeta) {
                  const m = await addFeedAsMeta(id, metaId)
                  if (m) {
                    Global.metaOps?.quickAdd(m.id, 'tags')
                  }
                } else {
                  if (metaId) {
                    Global.metaOps?.quickAdd(metaId, 'tags')
                  }
                }
              }
            }
          },
          {
            key: 'move-to',
            type: 'item',
            icon: Icons.MoveTo,
            text: t(trans.Meta.MoveTo),
            onSelect: async () => {
              onClose()
              const id = await getId()
              if (id) {
                if (!isMeta) {
                  const m = await addFeedAsMeta(id, metaId)
                  if (m) {
                    Global.metaOps?.quickAdd(m.id)
                  }
                } else {
                  if (metaId) {
                    Global.metaOps?.quickAdd(metaId)
                  }
                }
              }
            }
          }
        ]}
      />
    </WithBorder>
  )
}

const useMoveToMenu = ({ parentFolderId, onGetId }: { parentFolderId?: number; onGetId: () => Promise<number | undefined> }) => {
  const allFolders = ObjectStore('feedFolder').useAll()
  const { t } = useTranslation()
  const leftFolders = Array.from(allFolders.values())
    .filter(i => i.id !== parentFolderId)
    .sort((a, b) => b.createdAt - a.createdAt)
  const instance = useFeedInstance()
  return (onClose: VoidFunction) =>
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
        text: i.name || 'Unnamed folder',
        onSelect: async () => {
          onClose()
          const id = await onGetId()
          if (id) {
            toast.success(t(trans.Feed.SavedToFolder))
            ObjectStore('feedFolder').updateOne({ id: i.id, feeds: [id, ...(i.feeds?.filter(o => o !== id) || [])] })
          }
        }
      })),
      leftFolders.length ? { type: 'separator' } : undefined,
      {
        type: 'item',
        key: 'create-folder',
        text: t(trans.Feed.CreateFolder),
        icon: 'park-folder-plus',
        onSelect: async () => {
          onClose()
          instance.folderOps?.createFolder().then(async f => {
            const id = await onGetId()
            if (id) {
              toast.success(t(trans.Feed.SavedToFolder))
              ObjectStore('feedFolder').updateOne({ id: f.id, feeds: [id] })
            }
          })
        }
      }
    ].filter(i => i) as IMenuLayoutItem[]
}

FeedItemMenu.useMoveToMenu = useMoveToMenu
export default FeedItemMenu as typeof FeedItemMenu & {
  useMoveToMenu: typeof useMoveToMenu
}
