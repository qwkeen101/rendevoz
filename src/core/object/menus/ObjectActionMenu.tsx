import { FC, useEffect, useRef, useState } from 'react'
import { GlobalInstance } from '@/hooks'
import { Content, Menu } from '@/components'
import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'
import isHotkey from 'is-hotkey'
import calculateContains from '@/core/object/objectList/calculateContains'
import useSidebarDatabaseState from '@/components/layout/sidebar/useSidebarDatabaseState'

const ObjectActionMenu: FC<
  Partial<{
    onClose: VoidFunction
    onJump: VoidFunction
    onGraphPin: VoidFunction
    onShowRelated: VoidFunction
    onShowGraph: VoidFunction
    onRemoveFromCollection: VoidFunction
    onEditLink: VoidFunction
    onDeleteLink: VoidFunction
    onRemoveFromAttachment: VoidFunction
    visibility: {
      removeFromAttachment?: boolean
      showContainsInSidebar?: boolean
      editLink?: boolean
      deleteFromCollection?: boolean
      deleteLink?: boolean
      jumpToVisible?: boolean
      graphPinVisible?: boolean
      showRelatedVisible?: boolean
      graphPinned?: boolean
      relatedNum?: number
      showGraph?: boolean
    }
  }> & { metaObjectId: number }
> = ({
  onClose,
  metaObjectId,
  onRemoveFromAttachment,
  visibility,
  onJump,
  onRemoveFromCollection,
  onEditLink,
  onDeleteLink,
  onGraphPin,
  onShowGraph
}) => {
  const { updateMetaObject, deleteMetaObject } = MetaStore
  const { t } = useTranslation()
  const metaObject = MetaStore.useValue(metaObjectId)
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (metaObject) {
      const keydownHandler = (e: KeyboardEvent) => {
        if (isHotkey('m', e)) {
          e.preventDefault()
          GlobalInstance.metaOps?.quickAdd(metaObjectId)
          onClose?.()
        }
        if (isHotkey('v', e)) {
          e.preventDefault()
          GlobalInstance.metaOps?.openDetails(metaObjectId)
          onClose?.()
        }
        if (isHotkey('e', e)) {
          e.preventDefault()
          Rendevoz.Actions.Open.Meta.openEditMetaDialog(metaObjectId)
          onClose?.()
        }
        if (isHotkey('mod+c', e)) {
          e.preventDefault()
          GlobalInstance.metaOps?.copyLink(metaObjectId)
          onClose?.()
        }
        if (isHotkey('shift+enter', e)) {
          onClose?.()
          e.preventDefault()
          GlobalInstance.metaOps?.closeDetails()
          Rendevoz.Actions.Open.Meta.openMetaObject(metaObjectId)
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
    <Content style={{ padding: '0.4rem 0', minWidth: 250, fontSize: 14 }} ref={containerRef}>
      <Menu.NavigationMenu
        layout={[
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
                  GlobalInstance.metaOps?.viewContains(metaObjectId)
                },
                text: t('general.View included objects'),
                icon: 'park-hamburger-button'
              }
            : undefined,
          visibility?.editLink
            ? {
                type: 'item',
                key: 'edit-link',
                onSelect: () => {
                  onEditLink?.()
                  onClose?.()
                },
                text: t('general.Edit link'),
                icon: 'park-link'
              }
            : undefined,
          visibility?.deleteLink
            ? {
                type: 'item',
                key: 'delete-link',
                onSelect: () => {
                  onDeleteLink?.()
                  onClose?.()
                },
                text: t('general.Delete link'),
                icon: 'park-unlink'
              }
            : undefined,
          visibility?.showGraph
            ? {
                type: 'item',
                key: 'show-graph',
                onSelect: () => {
                  onShowGraph?.()
                  onClose?.()
                },
                text: t('general.View graph'),
                icon: 'park-share-one'
              }
            : undefined,
          visibility?.jumpToVisible
            ? {
                type: 'item',
                key: 'jump',
                onSelect: () => {
                  onJump?.()
                  onClose?.()
                },
                text: 'Focus',
                icon: 'park-share-two'
              }
            : undefined,
          visibility?.graphPinVisible
            ? {
                icon: 'park-pin',
                text: visibility.graphPinned ? t('graph.unpin') : t('graph.pin on graph'),
                onSelect: () => {
                  onGraphPin?.()
                  onClose?.()
                },
                key: 'graph-pin',
                type: 'item'
              }
            : undefined,
          visibility?.showRelatedVisible
            ? {
                icon: 'park-circle-four',
                text: t(`graph.show more related nodes`, {
                  num: visibility.relatedNum
                }),
                onSelect: () => {
                  onGraphPin?.()
                  onClose?.()
                },
                key: 'graph-show-related',
                type: 'item'
              }
            : undefined,
          {
            type: 'item',
            text: t('general.Open'),
            icon: 'park-share',
            suffix: 'Shift+↵',
            onSelect: () => {
              onClose?.()
              GlobalInstance.metaOps?.closeDetails()
              Rendevoz.Actions.Open.Meta.openMetaObject(metaObjectId)
            },
            key: 'open'
          },
          {
            type: 'item',
            text: t('general.View details'),
            icon: 'park-info',
            suffix: 'V',
            onSelect: () => {
              onClose?.()
              GlobalInstance.metaOps?.openDetails(metaObjectId)
            },
            key: 'view-details'
          },
          {
            type: 'item',
            text: t('general.Move to'),
            icon: 'park-corner-up-right',
            suffix: 'M',
            onSelect: () => {
              GlobalInstance.metaOps?.quickAdd(metaObjectId)
              onClose?.()
            },
            key: 'move-to'
          },
          {
            type: 'item',
            text: t('general.edit'),
            icon: 'park-edit',
            suffix: 'E',
            onSelect: () => {
              onClose?.()
              Rendevoz.Actions.Open.Meta.openEditMetaDialog(metaObjectId)
            },
            key: 'edit'
          },
          GlobalInstance.metaOps?.canPreview(metaObject)
            ? {
                icon: 'park-preview-open',
                text: t('general.Preview'),
                onSelect: () => {
                  onClose?.()
                  GlobalInstance.metaOps?.preview(metaObjectId)
                },
                key: 'preview',
                type: 'item'
              }
            : undefined,
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
            text: t('general.generate link'),
            icon: 'park-link-two',
            suffix: 'Cmd+C',
            onSelect: () => {
              GlobalInstance.metaOps?.copyLink(metaObjectId)
              onClose?.()
            },
            key: 'copy-link'
          },
          {
            type: 'item',
            text: t('general.delete'),
            icon: 'park-delete-one',
            onSelect: () => {
              deleteMetaObject(metaObject.id)
              onClose?.()
            },
            key: 'delete'
          },
          visibility?.deleteFromCollection
            ? {
                type: 'item',
                text: t('general.remove from collection'),
                icon: 'park-delete-two',
                onSelect: () => {
                  onRemoveFromCollection?.()
                  onClose?.()
                },
                key: 'remove-from-collection'
              }
            : undefined
        ]}
      />
    </Content>
  )
}

export default ObjectActionMenu
