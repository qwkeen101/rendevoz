import { AnimatePopover, Content, Icon, WithBorder } from '@/components/base'
import Modal from '@/components/base/Modal'
import NewDocumentDialog from '@/components/dialogs/NewDocumentDialog'
import NewCollectionForm from '@/components/form/NewCollectionForm'
import NewDocumentForm from '@/components/form/NewDocumentForm'
import { KEY } from '@/consts/key'
import Zindexes from '@/consts/zindex'
import useCollectionStore from '@/stores/collection.store'
import useNoteStore from '@/stores/note.store'
import ClassName from '@/styles/classNames'
import { Position } from '@/types'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { RefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ICollection, INote, IPdfDocument } from '~/typings/data'

const useSidebarItemContextMenu = (
  contextMenuElementRef?: RefObject<HTMLElement>,
  {
    onPin,
    onDelete,
    onEdit,
    pinned,
    name
  }: { onPin?: VoidFunction; onDelete?: VoidFunction; onEdit?: VoidFunction; pinned?: boolean; name?: string } = {},
  item?: ICollection | IPdfDocument | INote
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
    console.log(e)
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
  const nameRef = useRef(name)
  useEffect(() => {
    nameRef.current = name
  }, [name])

  const navigate = useNavigate()
  const { addNote } = useNoteStore()
  const { addItemToCollection } = useCollectionStore()
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
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'saturate(1.5) blur(8px)',
              position: 'absolute',
              ...contextMenuState
            }}
            onClick={e => {
              if (e.target !== e.currentTarget) {
                setContextMenuState({
                  ...contextMenuState,
                  contextMenuVisible: false
                })
              }
            }}
          >
            {item?.items && (
              <AnimatePopover
                containerStyle={{ zIndex: String(Zindexes.PopupMenu) }}
                positions={['right']}
                align="start"
                visible={!!contextMenuState.createVisible}
                content={
                  <WithBorder
                    style={{ width: 150, padding: 3, background: 'rgba(255,255,255,0.7)', backdropFilter: 'saturate(1.5) blur(8px)' }}
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
        <NewCollectionForm
          parentCollection={item}
          onAddCollection={() => setFormState({ newCollectionVisible: false })}
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
        <NewDocumentForm
          collection={item}
          onBack={() => setFormState({ newPdfVisible: false })}
          onSubmit={doc => {
            setFormState({ newPdfVisible: false })
            addItemToCollection({ id: doc.id, type: 'document' }, item?.id)
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
