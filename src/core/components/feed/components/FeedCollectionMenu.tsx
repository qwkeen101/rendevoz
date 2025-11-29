import { Menu, WithBorder } from '@/components'
import { ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { IMenuLayoutItem } from '@/components/base/menu'
import trans from '@/consts/trans'
import toast from 'react-hot-toast'
import { Icons } from '@/consts'
import { IFeedInstance } from '~/typings'

const FeedCollectionMenu = ({ id, onClose, parentFolderId }: { id: number; onClose: VoidFunction; parentFolderId?: number }) => {
  const instance = useFeedInstance()
  const { t } = useTranslation()
  const moveToMenu = useMoveToMenu({ id, parentFolderId })
  const getInstance = async (): Promise<IFeedInstance> => {
    return new Promise(res => Global.layoutOps?.openPage('feed').then(res))
  }
  return (
    <WithBorder className={'py-[0.4rem] min-w-52'} onClick={e => e.stopPropagation()}>
      <Menu.NavigationMenu
        layout={[
          {
            type: 'item',
            text: t('general.edit'),
            key: 'edit',
            icon: 'park-edit',
            onSelect: async () => {
              onClose()
              ;(await getInstance()).editFeed?.(id)
            }
          },
          {
            type: 'item',
            text: t('feed.Refresh content'),
            key: 'refresh',
            icon: 'park-refresh',
            onSelect: () => {
              instance.feedOps?.refreshCollectionContent(id)
              onClose()
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
                      collections: parentFolder.collections.filter(i => i !== id)
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
            subMenu: moveToMenu?.(onClose)
          },
          {
            type: 'item',
            key: 'delete',
            text: t('general.delete'),
            icon: 'park-delete-one',
            onSelect: () => {
              instance.feedOps?.deleteCollection(id)
              onClose()
            }
          }
        ]}
      />
    </WithBorder>
  )
}

const useMoveToMenu = ({ id, parentFolderId }: { id?: number; parentFolderId?: number }) => {
  const allFolders = ObjectStore('feedFolder').useAll()
  const { t } = useTranslation()
  const instance = useFeedInstance()
  const leftFolders = Array.from(allFolders.values())
    .filter(i => i.id !== parentFolderId)
    .sort((a, b) => b.createdAt - a.createdAt)
  if (!id) return null
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
        text: i.name || t(trans.Unnamed),
        onSelect: () => {
          onClose()
          toast.success(t(trans.Feed.SavedToFolder))
          ObjectStore('feedFolder').updateOne({ id: i.id, collections: [id, ...i.collections.filter(o => o !== id)] })
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
          instance.folderOps?.createFolder().then(f => {
            toast.success(t(trans.Feed.SavedToFolder))
            ObjectStore('feedFolder').updateOne({ id: f.id, collections: [id] })
          })
        }
      }
    ].filter(i => i) as IMenuLayoutItem[]
}
FeedCollectionMenu.useMoveToMenu = useMoveToMenu
export default FeedCollectionMenu as typeof FeedCollectionMenu & {
  useMoveToMenu: typeof useMoveToMenu
}
