import { FC, useEffect, useRef, useState } from 'react'
import { Menu } from '@/components'
import { CollectionStore, MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import isHotkey from 'is-hotkey'
import calculateContains from '@/core/object/objectList/calculateContains'
import useSidebarDatabaseState from '@/components/layout/sidebar/useSidebarDatabaseState'
import { Icons, Shortcuts } from '@/consts'
import trans from '@/consts/trans'

const ObjectActionMenu: FC<
  Partial<{
    onClose: VoidFunction
    parentCollectionId?: number
    onRemoveFromAttachment: VoidFunction
    visibility: {
      removeFromAttachment?: boolean
      showContainsInSidebar?: boolean
      deleteFromCollection?: boolean
      relatedNum?: number
      showGraph?: boolean
    }
  }> & { metaObjectId: number }
> = ({ onClose, metaObjectId, onRemoveFromAttachment, parentCollectionId, visibility }) => {
  const { updateMetaObject, deleteMetaObject } = MetaStore
  const { t } = useTranslation()
  const metaObject = MetaStore.useValue(metaObjectId)
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (metaObject) {
      const keydownHandler = (e: KeyboardEvent) => {
        if (isHotkey('m', e)) {
          e.preventDefault()
          Global.metaOps.quickAdd?.(metaObjectId)
          onClose?.()
        }
        if (isHotkey('v', e)) {
          e.preventDefault()
          Global.metaOps.openDetails?.(metaObjectId)
          onClose?.()
        }
        if (isHotkey('e', e)) {
          e.preventDefault()
          Global.metaOps.edit?.(metaObjectId)
          onClose?.()
        }
        if (isHotkey('mod+c', e)) {
          e.preventDefault()
          Global.metaOps.copyLink(metaObjectId)
          onClose?.()
        }
        if (isHotkey('enter', e)) {
          onClose?.()
          e.preventDefault()
          Global.metaOps.closeDetails?.()
          Global.layoutOps?.openObject(metaObjectId)
        }
      }
      document.addEventListener('keydown', keydownHandler)
      return () => {
        document.removeEventListener('keydown', keydownHandler)
      }
    }
  }, [metaObject])
  const [sidebarCache] = useSidebarDatabaseState()
  const [contains, setContains] = useState(0)
  const displayContains =
    metaObject &&
    !sidebarCache?.selectedMeta?.includes(metaObject.id) &&
    ['pdf', 'video', 'audio', 'note', 'webpage', 'whiteboard', 'group'].includes(metaObject.type)
  useEffect(() => {
    if (displayContains && metaObject) {
      calculateContains(metaObject).then(res => setContains(res?.length || 0))
    }
  }, [metaObject])
  if (!metaObject) return null
  return (
    <div className={'py-1 min-w-60'} ref={containerRef}>
      <Menu.NavigationMenu
        layout={[
          parentCollectionId
            ? {
                type: 'item',
                text: t('general.Remove from folder'),
                icon: 'park-delete-two',
                onSelect: () => {
                  CollectionStore.removeItems(metaObjectId, parentCollectionId)
                  onClose?.()
                },
                key: 'remove-from-collection'
              }
            : undefined,
          visibility?.removeFromAttachment
            ? {
                type: 'item',
                key: 'remove-from-attachment',
                onSelect: () => {
                  onRemoveFromAttachment?.()
                  onClose?.()
                },
                text: t('general.Remove from attachments'),
                icon: 'park-delete-two'
              }
            : undefined,
          displayContains && contains > 0
            ? {
                type: 'item',
                key: 'show-contains-in-sidebar',
                onSelect: async () => {
                  onClose?.()
                  Global.metaOps?.viewContains(metaObjectId)
                },
                text: t('general.View included objects'),
                icon: 'park-hamburger-button'
              }
            : undefined,
          visibility?.showGraph
            ? {
                type: 'item',
                key: 'show-graph',
                onSelect: () => {
                  Global.metaOps.openGraph?.(metaObjectId)
                  onClose?.()
                },
                text: t('general.View graph'),
                icon: 'park-share-one'
              }
            : undefined,
          {
            type: 'item',
            text: t('general.Open'),
            icon: Icons.Efferent,
            suffix: '↵',
            onSelect: () => {
              onClose?.()
              Global.metaOps.closeDetails?.()
              Global.layoutOps?.openObject(metaObjectId)
            },
            key: 'open'
          },
          {
            type: 'item',
            text: t(trans.Meta.ViewDetails),
            icon: Icons.Info,
            suffix: 'V',
            onSelect: () => {
              onClose?.()
              Global.metaOps.openDetails?.(metaObjectId)
            },
            key: 'view-details'
          },
          {
            type: 'item',
            text: t(trans.Edit),
            icon: Icons.Edit,
            suffix: 'E',
            onSelect: () => {
              onClose?.()
              Global.metaOps.edit?.(metaObjectId)
            },
            key: 'edit'
          },
          {
            type: 'item',
            text: t(trans.Meta.MoveTo),
            icon: Icons.MoveTo,
            suffix: 'M',
            onSelect: () => {
              Global.metaOps.quickAdd?.(metaObjectId)
              onClose?.()
            },
            key: 'move-to'
          },
          {
            type: 'separator'
          },
          {
            type: 'item',
            text: metaObject.pinned ? t('general.unpin') : t('general.pin'),
            icon: 'park-pin',
            onSelect: () => {
              updateMetaObject({ id: metaObject.id, pinned: !metaObject.pinned })
              onClose?.()
            },
            key: 'pin'
          },
          {
            type: 'item',
            text: t(trans.CopyLink),
            icon: Icons.Link,
            suffix: Shortcuts.Copy[1],
            onSelect: () => {
              Global.metaOps?.copyLink(metaObjectId)
              onClose?.()
            },
            key: 'copy-link'
          },
          {
            type: 'item',
            text: t(trans.Delete),
            icon: Icons.Delete,
            onSelect: () => {
              deleteMetaObject(metaObject.id)
              onClose?.()
            },
            key: 'delete'
          }
        ]}
      />
    </div>
  )
}

export default ObjectActionMenu
