import { AnimatePopover, Content, Icon, WithBorder } from '@/components/base'
import Modal from '@/components/base/Modal'
import CollectionForm from '@/components/form/CollectionForm'
import CreateDocumentForm from '@/components/form/CreateDocumentForm'
import Zindexes from '@/consts/zindex'
import useWhiteboardStore from '@/stores/whiteboard.store'
import ClassName from '@/styles/classNames'
import { Position } from '@/types'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { collectionStore, noteStore } from '@/stores'
import { AnimatePresence, motion } from 'framer-motion'
import { RefObject, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

const useSidebarItemContextMenu = (
  contextMenuElementRef: RefObject<HTMLElement>,
  item: {
    type: 'collection' | 'note' | 'pdf' | 'whiteboard'
    id: number
  },
  {
    onPin,
    onDelete,
    onEdit,
    onAddNewSubItem,
    pinned
  }: {
    onPin?: VoidFunction
    onDelete?: VoidFunction
    onEdit?: VoidFunction
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
    Partial<{ newCollectionVisible: boolean; newPdfVisible: boolean; editCollectionVisible: boolean }>
  >({
    newCollectionVisible: false,
    newPdfVisible: false,
    editCollectionVisible: false
  })
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
  const navigate = useNavigate()
  const { addNote } = noteStore
  const { addItemToCollection, addCollection } = collectionStore
  const { addWhiteboard } = useWhiteboardStore()
  useEffect(() => {
    contextMenuElementRef?.current?.addEventListener('contextmenu', contextMenuHandler)
    return () => {
      contextMenuElementRef?.current?.removeEventListener('contextmenu', contextMenuHandler)
    }
  })
  const portal = createPortal(
    <AnimatePresence>
      {contextMenuState.contextMenuVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', zIndex: Zindexes.SidebarContextMenuOverlay }}
          onContextMenu={e => {
            e.preventDefault()
            e.stopPropagation()
            if (e.target === e.currentTarget) {
              setContextMenuState({ ...contextMenuState, contextMenuVisible: false })
            }
          }}
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            if (e.target === e.currentTarget) {
              setContextMenuState({ ...contextMenuState, contextMenuVisible: false })
            }
          }}
        >
          <WithBorder
            className={ClassName.defaultFont(13, 600)}
            style={{
              padding: 3,
              width: 150,
              position: 'absolute',
              background: 'white',
              ...contextMenuState
            }}
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
                    style={{ width: 150, padding: 3, background: 'white' }}
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
                    <div
                      onClick={() => {
                        setFormState({
                          newCollectionVisible: true
                        })
                      }}
                    >
                      <Icon name="park-folder-close" />
                      Subcollection
                    </div>
                    <div
                      onClick={() => {
                        const id = Id.getId()
                        const contentId = Id.getId()
                        addItemToCollection(
                          {
                            id,
                            type: 'note'
                          },
                          item.id
                        )
                        addNote({
                          id,
                          contentId,
                          title: 'Untitled'
                        })
                        navigate(`/editor/${id}`)
                        onAddNewSubItem?.()
                      }}
                    >
                      <Icon name="park-notes" />
                      Note
                    </div>
                    <div
                      onClick={() => {
                        setFormState({
                          newPdfVisible: true
                        })
                      }}
                    >
                      <Icon name="park-file-pdf" />
                      Pdf
                    </div>
                    <div
                      onClick={() => {
                        const whiteboardId = Id.getId()
                        addItemToCollection(
                          {
                            id: whiteboardId,
                            type: 'whiteboard'
                          },
                          item.id
                        )
                        addWhiteboard({
                          id: whiteboardId,
                          name: 'Unnamed Whiteboard',
                          edges: new Map(),
                          nodes: new Map(),
                          items: []
                        })
                        navigate(`/whiteboard/${whiteboardId}`)
                        onAddNewSubItem?.()
                      }}
                    >
                      <Icon name="park-new-computer" />
                      Whiteboard
                    </div>
                  </WithBorder>
                }
              >
                <Content
                  flex
                  justifyContent="space-between"
                  onClick={e => {
                    e.stopPropagation()
                    setContextMenuState({
                      ...contextMenuState,
                      createVisible: !contextMenuState.createVisible
                    })
                  }}
                  className={ClassName.flatButton()}
                >
                  Create
                  <Icon name="park-right" />
                </Content>
              </AnimatePopover>
            )}
            <div
              className={ClassName.flatButton()}
              onClick={e => {
                e.stopPropagation()
                onEdit?.()
                setContextMenuState({
                  ...contextMenuState,
                  contextMenuVisible: false
                })
              }}
            >
              Edit
            </div>
            <div className={ClassName.flatButton()} onClick={onPin}>
              {pinned ? 'Unpin' : 'Pin'}
            </div>
            <div className={ClassName.flatButton()} onClick={onDelete}>
              Delete
            </div>
          </WithBorder>
        </motion.div>
      )}
    </AnimatePresence>,
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
      <Modal
        width={300}
        visible={!!formState.newPdfVisible}
        onClose={() => {
          setFormState({ newPdfVisible: false })
        }}
      >
        <CreateDocumentForm
          collection={item}
          onBack={() => setFormState({ newPdfVisible: false })}
          onSubmit={doc => {
            setFormState({ newPdfVisible: false })
            addItemToCollection({ id: doc.id, type: 'document' }, item?.id)
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
