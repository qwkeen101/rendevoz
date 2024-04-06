import { FC, useEffect, useRef } from 'react'
import { GlobalInstance } from '@/hooks'
import { Button, Content, Menu } from '@/components'
import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'
import isHotkey from 'is-hotkey'

export const ObjectActionPopover: FC<
  Partial<{
    onClose: VoidFunction
    onJump: VoidFunction
    onGraphPin: VoidFunction
    onShowRelated: VoidFunction
    onShowGraph: VoidFunction
    onEditLink: VoidFunction
    onDeleteLink: VoidFunction
    visibility: {
      editLink?: boolean
      deleteLink?: boolean
      jumpToVisible?: boolean
      graphPinVisible?: boolean
      showRelatedVisible?: boolean
      graphPinned?: boolean
      relatedNum?: number
      showGraph?: boolean
    }
  }> & { metaObjectId: number }
> = ({ onClose, metaObjectId, visibility, onJump, onEditLink, onDeleteLink, onGraphPin, onShowGraph }) => {
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
        if (!metaObject.temp) {
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
  if (!metaObject) return null
  return (
    <Content style={{ padding: '0.4rem 0', minWidth: 200, fontSize: 14 }} ref={containerRef} role="object-popover-panel">
      <Menu.NavigationMenu
        layout={[
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
            icon: 'park-delete',
            onSelect: () => {
              deleteMetaObject(metaObject.id)
              onClose?.()
            },
            key: 'delete'
          }
        ]}
      />
    </Content>
  )
}
