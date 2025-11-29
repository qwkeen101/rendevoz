import { CollectionStore, MetaStore } from '@/api/stores'
import { Menu } from '@/components'
import { Icons } from '@/consts'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'

export default ({ id, onClose }: { id: number; onClose: VoidFunction }) => {
  const collection = CollectionStore.useValue(id)
  const collectionMeta = MetaStore.useObjectToMetaValue(id)
  const { t } = useTranslation()
  return (
    <Menu.NavigationMenu
      layout={[
        {
          type: 'item',
          key: 'create',
          icon: Icons.Create,
          text: t(trans.New),
          subMenu: [
            {
              type: 'item',
              key: 'object',
              icon: Icons.FileAddition,
              text: t(trans.File),
              onSelect: () => {
                onClose()
                Global.metaOps.createObjects?.(
                  undefined,
                  m => {
                    CollectionStore.addItemToCollection({ id: m.id, type: 'meta' }, id)
                  },
                  {
                    parentCollectionId: id
                  }
                )
              }
            },
            {
              type: 'item',
              key: 'sub-collection',
              icon: Global.utils.getIcon('collection'),
              text: t('general.Folder'),
              onSelect: () => {
                CollectionStore.create(id)
                onClose()
              }
            }
          ]
        },
        {
          type: 'item',
          key: 'open',
          icon: Icons.Efferent,
          text: t('general.Open in new tab'),
          onSelect: () => {
            Global.layoutOps?.openPage('collectionGroup', { id })
            onClose()
          }
        },
        {
          type: 'item',
          key: 'edit',
          icon: Icons.Edit,
          text: t(trans.Edit),
          onSelect: () => {
            CollectionStore.edit(id)
            onClose()
          }
        },
        {
          type: 'item',
          key: 'move-to',
          icon: Icons.MoveTo,
          text: t(trans.Meta.MoveTo),
          onSelect: () => {
            if (collection) {
              Global.collectionOps?.selectCollection().then(res => {
                const target = typeof res === 'number' ? 0 : res.id
                if (target !== id) {
                  CollectionStore.moveItems({ id, type: 'collection' }, collection.parentId, target)
                }
              })
            }
            onClose()
          }
        },
        {
          type: 'item',
          key: 'pin',
          icon: 'park-pin',
          text: collection?.pinned ? t('general.unpin') : t('general.pin'),
          onSelect: () => {
            onClose()
            setTimeout(async () => {
              const c = await CollectionStore.getCollectionById(id)
              if (c) {
                CollectionStore.updateCollection({ id: id, pinned: !c.pinned })
              }
            }, 200)
          }
        },
        {
          type: 'item',
          key: 'delete',
          icon: Icons.Delete,
          text: t(trans.Delete),
          onSelect: () => {
            onClose()
            if (collectionMeta) {
              MetaStore.deleteMetaObject(collectionMeta.id)
            }
          }
        }
      ]}
    />
  )
}
