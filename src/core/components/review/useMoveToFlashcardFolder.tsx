import { ObjectStore } from '@/api/stores'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import { IMenuLayoutItem } from '@/components/base/menu'
import { useTranslation } from 'react-i18next'
import { IReviewFolder } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default (currentId?: number) => {
  const allFolders = ObjectStore('reviewFolder').useAll()
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const leftFolders = useMemo(
    () =>
      allFolders
        .filter(i => i.workspace === currentWorkspace?.id && !i.children.some(o => o.id === currentId))
        .sort((b, a) => a.createdAt - b.createdAt),
    [currentId, allFolders]
  )
  const { t } = useTranslation()
  if (!currentId) return () => []
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
          toast.success(t(trans.Feed.SavedToFolder))
          ObjectStore('reviewFolder').updateOne({
            id: i.id,
            children: [
              {
                type: 'group',
                id: currentId
              },
              ...(i.children?.filter(o => o.id !== currentId) || [])
            ]
          })
          onClose()
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
          Global.dialogOps?.createOrEditFolder<IReviewFolder>('reviewFolder').then(async f => {
            toast.success(t(trans.Feed.SavedToFolder))
            ObjectStore('reviewFolder').updateOne({ id: f.id, children: [{ type: 'group', id: currentId }] })
          })
        }
      }
    ].filter(i => i) as IMenuLayoutItem[]
}
