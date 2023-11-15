import { AnimatePopover, Button, WithBorder } from '@/components'
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

const useSidebarItemContextMenu = (
  contextMenuElementRef: RefObject<HTMLElement>,
  item: {
    type: 'collection' | 'note' | 'pdf' | 'whiteboard' | 'meta'
    id: number
  },
  {
    onPin,
    onDelete,
    onEdit,
    onAddNewSubItem,
    onRemoveFromCollection,
    onDeleteWithMeta,
    pinned
  }: {
    onPin?: VoidFunction
    onDelete?: VoidFunction
    onEdit?: VoidFunction
    onDeleteWithMeta?: VoidFunction
    onRemoveFromCollection?: VoidFunction
    pinned?: boolean
    name?: string
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
  }, [])
  const portal = createPortal(
    <AnimatePopover
      visible={contextMenuState.contextMenuVisible}
      disableNudge
      disableIntersection
      positions={['right']}
      align="start"
      onClickOutside={() => setContextMenuState(s => ({ ...s, contextMenuVisible: false }))}
      position={{
        left: contextMenuState.left,
        top: contextMenuState.top
      }}
      content={
        <WithBorder
          onContextMenu={e => {
            e.preventDefault()
            e.stopPropagation()
            if (e.target === e.currentTarget) {
              setContextMenuState({
                ...contextMenuState,
                contextMenuVisible: false
              })
            }
          }}
          className={ClassName.defaultFont(13, 600)}
          padding={6}
          width={150}
          onClick={e => {
            if (e.target !== e.currentTarget) {
              e.stopPropagation()
              setContextMenuState({
                ...contextMenuState,
                createVisible: false
              })
              setTimeout(() => {
                setContextMenuState(s => ({
                  ...s,
                  contextMenuVisible: false
                }))
              })
            }
          }}
        >
          {item?.type === 'collection' && (
            <>
              <Button.IconButton
                onClick={() => {
                  setFormState({
                    newCollectionVisible: true
                  })
                }}
                text={t('general.subcollection')}
                icon="park-folder-close"
              />
              <Button.IconButton
                onClick={() => {
                  GlobalInstance.metaOps?.createObject().then(res => {
                    if (res) {
                      addItemToCollection({ type: 'meta', id: res.id }, item.id)
                      onAddNewSubItem?.()
                    }
                  })
                }}
                text={t('general.create')}
                icon="park-plus"
              />
            </>
          )}
          <Button.IconButton
            text={t('general.edit')}
            icon="park-edit"
            onClick={e => {
              e.stopPropagation()
              onEdit?.()
              setContextMenuState({
                ...contextMenuState,
                contextMenuVisible: false
              })
            }}
          />
          <Button.IconButton text={pinned ? t('general.unpin') : t('general.pin')} icon="park-pin" onClick={onPin} />
          <Button.IconButton text={t('general.delete')} icon="park-delete" dangerous onClick={onDelete} />
          {item.type === 'collection' && (
            <Button.IconButton
              text={t('general.delete collection and all objects')}
              icon="park-delete"
              dangerous
              onClick={onDeleteWithMeta}
            />
          )}
          {item.type !== 'collection' && (
            <Button.IconButton
              text={t('general.remove from collection')}
              icon="park-folder-minus"
              dangerous
              onClick={onRemoveFromCollection}
            />
          )}
        </WithBorder>
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
