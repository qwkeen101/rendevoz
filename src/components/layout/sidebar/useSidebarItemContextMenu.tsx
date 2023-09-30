import { AnimatePopover, Button, WithBorder } from '@/components'
import Modal from '@/components/base/Modal'
import CollectionForm from '@/components/form/CollectionForm'
import CreateDocumentForm from '@/components/form/CreateDocumentForm'
import Zindexes from '@/consts/zindex'
import ClassName from '@/styles/classNames'
import { Position } from '@/types'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { CollectionStore, ObjectStore } from '@/stores'
import { RefObject, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { GlobalEventEmitter } from '@/events'
import { MetaObject } from '~/typings'
import { ObjectFamily } from '@/stores/object.store'
import { Rendevoz } from '@/core/rendevoz'

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
            <AnimatePopover
              containerStyle={{ zIndex: String(Zindexes.PopupMenu) }}
              positions={['right']}
              align="start"
              visible={!!contextMenuState.createVisible}
              content={
                <WithBorder
                  width={150}
                  padding={6}
                  className={css([
                    ClassName.defaultFont(13, 600),
                    ClassName.childrenAllFlex(undefined, 'flex-start'),
                    {
                      '> *': [
                        {
                          gap: 6
                        },
                        ClassName.flatButton()
                      ]
                    }
                  ])}
                >
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
                      createObjectWithOpenMeta(
                        'note',
                        {
                          contentId: Id.getId(),
                          title: 'Untitled'
                        },
                        'Untitled Note'
                      )
                    }}
                    text={t('general.note')}
                    icon="park-notes"
                  />

                  <Button.IconButton
                    onClick={() => {
                      setFormState({
                        newPdfVisible: true
                      })
                    }}
                    text={t('general.pdf')}
                    icon="park-file-pdf"
                  />
                  <Button.IconButton
                    onClick={() => {
                      createObjectWithOpenMeta(
                        'video',
                        {
                          name: 'Unnamed Video'
                        },
                        'Unnamed Video'
                      )
                    }}
                    text={t('general.video')}
                    icon={Rendevoz.Utils.Object.getMetaObjectIcon('video')}
                  />
                  <Button.IconButton
                    onClick={() => {
                      createObjectWithOpenMeta(
                        'whiteboard',
                        {
                          name: 'Unnamed Whiteboard',
                          edges: new Map(),
                          nodes: new Map(),
                          items: []
                        },
                        'Unnamed Whiteboard'
                      )
                    }}
                    text={t('general.whiteboard')}
                    icon="park-new-computer"
                  />
                  <Button.IconButton
                    icon="park-web-page"
                    text={t('general.webpage')}
                    onClick={e => {
                      e.stopPropagation()
                      setContextMenuState({
                        ...contextMenuState,
                        createVisible: false,
                        contextMenuVisible: false
                      })
                      createObjectWithOpenMeta('webpage')
                    }}
                  />
                </WithBorder>
              }
            >
              <Button.IconButton
                icon="park-right"
                text={t('general.create')}
                reverse
                spaceBetween
                onClick={e => {
                  e.stopPropagation()
                  setContextMenuState({
                    ...contextMenuState,
                    createVisible: !contextMenuState.createVisible
                  })
                }}
              />
            </AnimatePopover>
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
            <Button.IconButton text={t('general.delete collection and all objects')} icon="park-delete" dangerous onClick={onDeleteWithMeta} />
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
  const createObjectWithOpenMeta = (type: keyof ObjectFamily, object?: Partial<ObjectFamily[typeof type]>, metaName?: string) => {
    ObjectStore(type)
      .addOne({ ...object }, { silent: true, preventAddMeta: true })
      .then(obj => {
        GlobalEventEmitter()
          .emitWithCallback('global', {
            type: 'globalNeedAddMetaObject',
            data: {
              currentObject: {
                type: type,
                objectId: obj.id,
                name: metaName
              }
            }
          })
          .then(meta => {
            addItemToCollection(
              {
                id: (meta as MetaObject).id,
                type: 'meta'
              },
              item.id
            )
            Rendevoz.Actions.Open.Meta.openMetaObject(meta.id)
            onAddNewSubItem?.()
          })
          .catch(() => {
            ObjectStore(type).deleteOneById(obj.id, {
              force: true,
              silent: true
            })
          })
      })
  }
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
      <Modal
        // width={300}
        noStyle
        visible={!!formState.newPdfVisible}
        onClose={() => {
          setFormState({ newPdfVisible: false })
        }}
      >
        <CreateDocumentForm
          onBack={() => setFormState({ newPdfVisible: false })}
          onSubmit={meta => {
            setFormState({ newPdfVisible: false })
            addItemToCollection({ id: meta.id, type: 'meta' }, item?.id)
            onAddNewSubItem?.()
          }}
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
