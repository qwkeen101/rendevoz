import { AnimatePopover, Button, Menu, WithBorder } from '@/components'
import Modal from '@/components/base/Modal'
import CollectionForm from '@/components/form/CollectionForm'
import ClassName from '@/styles/classNames'
import { Position } from '@/types'
import Id from '@/utils/id'
import { CollectionStore } from '@/api/stores'
import { RefObject, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { GlobalInstance } from '@/hooks'
import { ObjectActionMenu } from '@/core'

const useSidebarItemContextMenu = (
  contextMenuElementRef: RefObject<HTMLElement>,
  item: {
    type: 'collection' | 'note' | 'pdf' | 'whiteboard' | 'meta'
    id: number
  },
  {
    pinned,
    onAddNewSubItem,
    onPin,
    onRemoveFromCollection,
    onDeleteWithMeta,
    onEdit,
    onDelete
  }: {
    onPin?: VoidFunction
    onDelete?: VoidFunction
    onDeleteWithMeta?: VoidFunction
    onRemoveFromCollection?: VoidFunction
    pinned?: boolean
    name?: string
    onEdit?: VoidFunction
    onAddNewSubItem?: VoidFunction
  } = {}
) => {
  const [contextMenuState, setContextMenuState] = useState<
    Partial<
      Position & {
        contextMenuVisible: boolean
        renameVisible: boolean
        createVisible: boolean
        targetElementLeft: number
        targetElementTop: number
        targetElementHeight: number
        targetElementRight: number
      }
    >
  >({
    contextMenuVisible: false
  })
  const [formState, setFormState] = useState<
    Partial<{
      newCollectionVisible: boolean
      newPdfVisible: boolean
      editCollectionVisible: boolean
    }>
  >({
    newCollectionVisible: false,
    newPdfVisible: false,
    editCollectionVisible: false
  })
  const { t } = useTranslation()
  const contextMenuHandler = (e: MouseEvent) => {
    const currentTarget = e.currentTarget as HTMLElement
    const rect = currentTarget.getBoundingClientRect()
    setContextMenuState({
      renameVisible: false,
      contextMenuVisible: true,
      left: e.clientX,
      top: e.clientY,
      targetElementLeft: rect.left,
      targetElementTop: rect.top,
      targetElementHeight: rect.height,
      targetElementRight: rect.right
    })
  }
  const { addItemToCollection, addCollection } = CollectionStore
  useEffect(() => {
    contextMenuElementRef?.current?.addEventListener('contextmenu', contextMenuHandler)
    return () => {
      contextMenuElementRef?.current?.removeEventListener('contextmenu', contextMenuHandler)
    }
  })
  const portal = createPortal(
    <AnimatePopover
      visible={contextMenuState.contextMenuVisible}
      disableNudge
      positions={['right']}
      align="start"
      onVisiblityChange={v => setContextMenuState(s => ({ ...s, contextMenuVisible: v }))}
      onClickOutside={() => setContextMenuState(s => ({ ...s, contextMenuVisible: false }))}
      position={{
        left: contextMenuState.left,
        top: contextMenuState.top
      }}
      content={setV =>
        item.type === 'collection' ? (
          <WithBorder onClick={e => e.stopPropagation()} padding={'0.4rem 0'} width={150}>
            <Menu.NavigationMenu
              layout={[
                {
                  type: 'item',
                  key: 'create',
                  icon: 'park-plus',
                  text: t('general.create'),
                  onSelect: () => {
                    setV(false)
                    GlobalInstance.metaOps?.createObjects(
                      undefined,
                      m => {
                        CollectionStore.addItemToCollection({ id: m.id, type: 'meta' }, item.id)
                        onAddNewSubItem?.()
                      },
                      {
                        parentCollectionId: item.id
                      }
                    )
                  }
                },
                {
                  type: 'item',
                  key: 'sub-collection',
                  icon: 'park-folder-close',
                  text: t('general.subcollection'),
                  onSelect: () => {
                    setFormState({
                      newCollectionVisible: true
                    })
                    setV(false)
                  }
                },
                {
                  type: 'item',
                  key: 'edit',
                  icon: 'park-edit',
                  text: t('general.edit'),
                  onSelect: () => {
                    setV(false)
                    onEdit?.()
                  }
                },
                {
                  type: 'item',
                  key: 'pin',
                  icon: 'park-pin',
                  text: pinned ? t('general.unpin') : t('general.pin'),
                  onSelect: () => {
                    setV(false)
                    setTimeout(() => {
                      onPin?.()
                    }, 200)
                  }
                },
                {
                  type: 'separator'
                },
                {
                  type: 'item',
                  key: 'delete',
                  icon: 'park-delete',
                  text: t('general.delete'),
                  onSelect: () => {
                    onDelete?.()
                    setV(false)
                  }
                },
                {
                  type: 'item',
                  key: 'delete-all',
                  icon: 'park-delete-two',
                  text: t('general.Delete collection and all objects'),
                  onSelect: () => {
                    onDeleteWithMeta?.()
                    setV(false)
                  }
                }
              ]}
            />
          </WithBorder>
        ) : (
          <WithBorder onClick={e => e.stopPropagation()}>
            <ObjectActionMenu
              onRemoveFromCollection={onRemoveFromCollection}
              visibility={{ deleteFromCollection: true }}
              onClose={() => setV(false)}
              metaObjectId={item.id}
            />
          </WithBorder>
        )
      }
    ></AnimatePopover>,
    document.body
  )
  const formPortal = createPortal(
    <>
      <Modal
        visible={!!formState.newCollectionVisible}
        noStyle
        onClose={() => {
          setFormState({ newCollectionVisible: false })
        }}
      >
        <CollectionForm
          onSubmit={collection => {
            setFormState({ newCollectionVisible: false })
            const newCollection = {
              ...collection,
              parentId: item?.id,
              id: Id.getId()
            }
            addItemToCollection(
              {
                type: 'collection',
                id: newCollection.id
              },
              item?.id
            )
            addCollection(newCollection)
            onAddNewSubItem?.()
          }}
          onBack={() => setFormState({ newCollectionVisible: false })}
        />
      </Modal>
    </>,
    document.body
  )
  return {
    contextMenuPortal: [portal, formPortal]
  }
}

export default useSidebarItemContextMenu
