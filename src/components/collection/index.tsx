import { useToggle } from '@/hooks'
import useCurrentCollection from '@/hooks/components/useCurrentCollection'
import useCollectionStore from '@/stores/collection.store'
import { CSSProperties, FC, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ICollection, INote, IPdfDocument } from '~/typings/data'
import { Breadcrumb, Content, WithBorder } from '../base'
import Modal from '../base/modal'
import NewCollectionForm from '../form/NewCollectionForm'
import Icon from '../base/Icon'
import CollectionItem from './CollectionItem'
import Details from './Details'
import DocumentItem from './DocumentItem'
import styles from './index.module.less'
import NoteItem from './NoteItem'
import { CurrentSelectContext } from './useCurrentSelect'
import { isDocument, isNote } from './utils'
import { useTranslation } from 'react-i18next'
import ContextMenu from '../contextMenu'
import CollectionContextMenu from '../menus/CollectionContextMenu'
import useDocumentStore from '@/stores/document.store'
import useNoteStore from '@/stores/note.store'
import RenameDialog from '../dialogs/RenameDialog'
import toast from 'react-hot-toast'
import useCurrentCut from './useCurrentCut'
import useCurrentCopy from './useCurrentCopy'
import useCurrentCollectionContextMenuItem from './useCurrentContextMenuItem'
import Id from '@/utils/id'

interface CollectionProps {
  hideDetails?: boolean
  hideDocuments?: boolean
  hideCollections?: boolean
  hideNotes?: boolean
  hideBreadcrumb?: boolean
  hideActions?: boolean
  hideExtra?: boolean
  hideContextMenu?: boolean
  onCollectionSelect?: (selectedCollection?: ICollection) => void
  onCollectionChange?: (currentCollection?: ICollection | null) => void
  useRoute?: boolean
  defaultId?: number
  style?: CSSProperties
}
const Collection: FC<CollectionProps> = ({
  hideDetails = false,
  hideNotes = true,
  hideExtra = true,
  hideCollections,
  hideDocuments,
  hideActions = true,
  useRoute = true,
  hideBreadcrumb = false,
  hideContextMenu = false,
  defaultId,
  onCollectionChange,
  onCollectionSelect,
  style
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    all,
    one,
    findParentCollections,
    getChildrenCollections,
    getChildrenItems,
    renameCollection,
    updateCollection,
    addCollection,
    deleteCollection
  } = useCollectionStore()
  const { all: documents, renameDocument } = useDocumentStore()
  const { all: notes, renameNote, deleteNote } = useNoteStore()
  const [newCollectionVisible, toggleNewCollectionVisible] = useToggle(false)
  const [currentSelect, setCurrentSelect] = useState<ICollection | IPdfDocument>()
  const [currentCollection, setCurrentCollection] = useCurrentCollection()
  const [parentCollections, setParentCollections] = useState<ICollection[]>([])
  const childrenCollections = getChildrenCollections(currentCollection?.id || defaultId)
  const [childrenItems, setChildrenItems] = useState<any[]>([])
  const [renameVisible, toggleRenameVisible] = useToggle(false)
  const childrenNotes = childrenItems.filter(i => isNote(i)).filter(i => !i.deleted) as INote[]
  const childrenDocuments = childrenItems.filter(i => isDocument(i)).filter(i => !i.deleted) as IPdfDocument[]
  const [currentCut, setCurrentCut] = useCurrentCut()
  const [currentCopy, setCurrentCopy] = useCurrentCopy()
  const [currentCollectionContextMenuItem, setCurrentCollectionContextMenuItem] = useCurrentCollectionContextMenuItem()
  const actions = useRef([])
  const bodyRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef()
  useEffect(() => {
    console.log('fetched by all')
    if (defaultId) {
      setParentCollections(findParentCollections(one(defaultId)))
    }
  }, [all])
  useEffect(() => {
    if (actions.current.length === 0) {
      actions.current.push(currentCollection)
    }
    onCollectionChange?.(currentCollection)
    if (currentCollection) {
      getChildrenItems(currentCollection.id).then(items => {
        setChildrenItems(items.filter(i => !!i))
      })
      setParentCollections(findParentCollections(currentCollection))
    } else if (currentCollection === null) {
      setParentCollections([])
      setChildrenItems([])
    }
  }, [currentCollection, all])
  useEffect(() => {
    if (currentCollection) {
      getChildrenItems(currentCollection.id).then(items => {
        setChildrenItems(items.filter(i => !!i))
      })
      setParentCollections(findParentCollections(currentCollection))
    } else if (currentCollection === null) {
      setParentCollections([])
      setChildrenItems([])
    }
  }, [notes, documents])
  useEffect(() => {
    onCollectionSelect?.(currentSelect)
  }, [currentSelect])

  const handleCollectionClick = (e: React.MouseEvent<Element, MouseEvent>, c: ICollection) => {
    const count = e.detail
    // click
    if (count === 1) {
      setCurrentSelect(c)
    }
    // double click
    if (count === 2) {
      const { id } = c
      setCurrentCollection(c)
      actions.current.push(c)
      if (useRoute) {
        navigate(`/collections/${id}`)
      }
    }
  }
  const handleRename = (newName: string) => {
    if (currentCollectionContextMenuItem) {
      switch (currentCollectionContextMenuItem.type) {
        case 'collection': {
          const { id } = currentCollectionContextMenuItem.collection
          renameCollection(id, newName)
          break
        }
        case 'note': {
          const { id } = currentCollectionContextMenuItem.note
          renameNote(id, newName)
          break
        }
      }
      toast.success('Successfully renamed !')
      toggleRenameVisible()
      contextMenuRef.current?.closeContextMenu()
    }
  }
  const handleOpen = () => {
    if (currentCollectionContextMenuItem) {
      switch (currentCollectionContextMenuItem.type) {
        case 'collection': {
          const c = currentCollectionContextMenuItem.collection
          const { id } = c
          setCurrentCollection(c)
          if (useRoute) {
            navigate(`/collections/${id}`)
          }
          break
        }
        case 'note': {
          const n = currentCollectionContextMenuItem.note
          navigate(`/editor/${n.id}`)
          break
        }
      }
      contextMenuRef.current?.closeContextMenu()
    }
  }
  const handleDelete = () => {
    if (currentCollectionContextMenuItem) {
      switch (currentCollectionContextMenuItem.type) {
        case 'collection': {
          deleteCollection(currentCollectionContextMenuItem.collection.id)
          break
        }
        case 'note': {
          console.log(currentCollectionContextMenuItem)
          deleteNote(currentCollectionContextMenuItem.note.id)
          break
        }
        case 'document': {
        }
      }
      contextMenuRef.current?.closeContextMenu()
    }
  }
  const handleCut = () => {
    setCurrentCopy(null)
    setCurrentCut(currentCollectionContextMenuItem)
    contextMenuRef.current?.closeContextMenu()
  }
  const handleCopy = () => {
    setCurrentCut(null)
    setCurrentCopy(currentCollectionContextMenuItem)
    contextMenuRef.current?.closeContextMenu()
  }
  const handlePaste = () => {
    const pasteTargetCollection = (currentCollectionContextMenuItem && currentCollectionContextMenuItem.collection) || currentCollection
    if (currentCut) {
      if ('collection' in currentCut) {
        const cutCollection = currentCut.collection as ICollection
        cutCollection.parentId = pasteTargetCollection?.id
        updateCollection(cutCollection)
        contextMenuRef.current?.closeContextMenu()
      }
      if ('note' in currentCut) {
      }
      if ('document' in currentCut) {
      }
      setCurrentCut(null)
    }
    if (currentCopy) {
      if ('collection' in currentCopy) {
        const copyCollection = currentCopy.collection as ICollection
        // assign new id
        addCollection({
          ...copyCollection,
          id: Id.getId(),
          parentId: pasteTargetCollection?.id
        })
        contextMenuRef.current?.closeContextMenu()
      }
      if ('note' in currentCopy) {
        if (!pasteTargetCollection?.items?.some(i => i.id === currentCopy.note.id)) {
          updateCollection({
            ...pasteTargetCollection,
            items: [
              ...(pasteTargetCollection.items || []),
              {
                type: 'note',
                id: currentCopy.note.id
              }
            ]
          })
        }
      }
      if ('document' in currentCopy) {
        if (!pasteTargetCollection?.items?.some(i => i.id === currentCopy.document.id)) {
          updateCollection({
            ...pasteTargetCollection,
            items: [...(pasteTargetCollection?.items || []), { type: 'document', id: currentCopy.document.id }]
          })
        }
      }
      setCurrentCopy(null)
    }
  }

  return (
    <>
      <Modal width={400} height={200} visible={renameVisible} onClose={toggleRenameVisible}>
        <RenameDialog onBack={toggleRenameVisible} onRename={handleRename} />
      </Modal>
      <Modal width={600} height={500} visible={newCollectionVisible} onClose={toggleNewCollectionVisible}>
        <NewCollectionForm
          parentCollection={currentCollection}
          onAddCollection={toggleNewCollectionVisible}
          onBack={toggleNewCollectionVisible}
        />
      </Modal>
      <Content fullWidth fullHeight flex column style={style}>
        <Content flex>
          {!hideActions && (
            <Content flex style={{ marginRight: 20 }}>
              <Icon
                size={12}
                fill="#8590ae"
                name="park-arrow-left"
                cursor="pointer"
                onClick={() => {
                  setCurrentCollection(actions.current[actions.current.length - 1])
                  actions.current.pop()
                }}
              />
            </Content>
          )}
          {!hideBreadcrumb && (
            <Breadcrumb separator={<Icon name="park-right" />}>
              <Breadcrumb.Item
                type="button"
                onClick={() => {
                  setCurrentCollection(null)
                }}
              >
                {t('collection.root')}
              </Breadcrumb.Item>
              {parentCollections.map(i => (
                <Breadcrumb.Item
                  type="button"
                  onClick={() => {
                    setCurrentCollection(i)
                  }}
                >
                  {i.name}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          )}
          {!hideExtra && (
            <Content flex centered style={{ marginLeft: 'auto' }}>
              <Icon name="park-plus" cursor="pointer" onClick={toggleNewCollectionVisible} />
            </Content>
          )}
        </Content>
        <Content flex fullWidth fullHeight justifyContent="center">
          <ContextMenu
            ref={contextMenuRef}
            enableContextMenu={!hideContextMenu}
            content={
              <WithBorder style={{ width: 150 }}>
                <CollectionContextMenu
                  onCut={handleCut}
                  onCopy={handleCopy}
                  onRename={toggleRenameVisible}
                  onDelete={handleDelete}
                  onOpen={handleOpen}
                  onPaste={handlePaste}
                />
              </WithBorder>
            }
          >
            <div
              ref={bodyRef}
              onContextMenuCapture={e => {
                if (e.target === e.currentTarget) {
                  // click on blank space
                  if (!currentCollection) {
                    setCurrentCollectionContextMenuItem({ type: 'root' })
                  } else {
                    setCurrentCollectionContextMenuItem(null)
                  }
                }
              }}
              className={styles.body}
            >
              {!hideCollections && childrenCollections?.length === 0 && ((hideDocuments && hideNotes) || childrenItems.length === 0) && (
                <Content flex centered fullWidth fullHeight style={{ fontWeight: 600 }}>
                  {t('collection.no collection placeholder')}
                </Content>
              )}
              {!hideCollections &&
                childrenCollections?.map(i => (
                  <CollectionItem
                    onContextMenu={() => {
                      setCurrentCollectionContextMenuItem({
                        type: 'collection',
                        collection: i
                      })
                    }}
                    selected={currentSelect?.id === i.id}
                    onClick={e => handleCollectionClick(e, i)}
                    collection={i}
                  />
                ))}
              {!hideNotes &&
                childrenNotes.map(i => (
                  <NoteItem
                    note={i}
                    onContextMenu={note => {
                      setCurrentCollectionContextMenuItem({
                        type: 'note',
                        note
                      })
                    }}
                    onClick={note => {
                      setCurrentSelect(note)
                    }}
                  />
                ))}
              {!hideDocuments &&
                childrenDocuments.map(i => (
                  <DocumentItem
                    onClick={() => {
                      console.log(i)
                      setCurrentSelect(i)
                    }}
                    document={i}
                  />
                ))}
            </div>
          </ContextMenu>
          {!hideDetails && (
            <CurrentSelectContext.Provider value={currentSelect}>
              <div className={styles.details}>
                <Details onDelete={() => setCurrentSelect(null)} />
              </div>
            </CurrentSelectContext.Provider>
          )}
        </Content>
      </Content>
    </>
  )
}

export default Collection
