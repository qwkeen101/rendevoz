import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn, useUnMount } from '@/hooks'
import Id from '@/utils/id'
import classNames from 'classnames'
import {
  FC,
  FormEvent,
  memo,
  MouseEvent,
  MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { createEditor, Editor, Transforms, Descendant, Path, Range } from 'slate'
import { withHistory } from 'slate-history'
import { withReact, ReactEditor } from './slate-react'
import { CustomElement } from './types'
import { useSelectedEditorRef } from './hooks/useSelectedEditorRef'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import styles from './index.module.less'
import BlockHandle from './components/blockHandle'
import useIsDragging, { useIsDraggingDivider } from './hooks/useIsDragging'
import { serializeEditor } from './utils/database/serialize'
import useNoteStore from '@/stores/note.store'
import useCurrentDocument from '../../hooks/components/useCurrentDocument'
import useDocumentStore from '@/stores/document.store'
import { withYjs, slateNodesToInsertDelta, YjsEditor } from './yjs'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import Modal from '../base/modal'
import SaveNoteDialog from '../dialogs/SaveNoteDialog'
import toast from 'react-hot-toast'
import produce from 'immer'
import { ICollection, INote, MetaNoteObject, MetaObject } from '~/typings/data'
import useCollectionStore from '@/stores/collection.store'
import withShortcuts from './plugins/withShortcuts'
import withCustomComponent from './plugins/withCustomComponent'
import { Breadcrumb, Content, Icon, Image } from '../base'
import withEmitter from './plugins/withEmitter'
import withHtml from './plugins/withHtml'
import { useTranslation } from 'react-i18next'
import { ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'
import { Noop } from '@/common/types'
import ScrollManager from './ScrollManager'
import _ from 'lodash'
import useMetaStore from '@/stores/meta.store'
import TabTitle from '../layout/TabTitle'
import useLocalSyncValue from './hooks/useSyncValue'
import useEditorDrag from './hooks/useEditorDrag'
import { useGlobalIsDragging } from '../globalDragOverlay'
import useEditorOverlay from './components/overlay/useEditorOverlay'
import { css } from '@emotion/css'
import withHandler from './plugins/withHandler'
import useEditorSelect from './hooks/useEditorSelect'

type DragHandleProps = {
  left?: number
  top?: number
  targetHeight?: number
  targetId?: number
  visible?: boolean
}
const initial = [
  {
    id: Id.getId(),
    type: 'paragraph',
    children: [{ text: '' }]
  }
]

export interface EditorProps {
  titleMarginTop?: number
  onEditorInitialized?: (isSaved: boolean) => void
  onChange?: (e: Descendant[]) => void
  onClick?: () => void
  onSave?: Noop
  onTitleChange?: (title: string) => void
  initialValue?: Descendant[]
  id: string
  noteId: number
}
export interface IEditorRef {
  insertNode: (element: CustomElement) => void
  elementPropertyChange: (element: CustomElement) => void
  outerElementPropertyChange: (element: CustomElement) => void
  resetEditor: (value: Descendant[], title?: string) => void
  jumpToBlock: (blockId: number) => void
}
const GlobalProviderMap = new Map()
export const EditorV1: FC<EditorProps> = memo(({ onEditorInitialized, onSave, onTitleChange, id, noteId, titleMarginTop }) => {
  useUnMount(() => {
    doc.destroy()
    if (note === null) {
      provider.clearData()
    } else {
      const blocks = []
      serializeEditor(editor, editor, blocks)
      blocks.forEach(i => (i.noteId = noteId))
      saveNoteAndBlocks(editor, blocks)
    }
  })
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useIsDragging()
  const [isDraggingDivider, setIsDraggingDivider] = useIsDraggingDivider()
  const [globalIsDragging] = useGlobalIsDragging()
  const [outlineVisible, setOutlineVisible] = useState(false)
  const [mindmapVisible, setMindmapVisible] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [saveNoteVisible, setSaveNoteVisible] = useState(false)
  const [parentNotes, setParentNotes] = useState<INote[]>([])
  const [title, setTitle] = useState<string>()
  const scrollManager = useMemo(() => new ScrollManager(), [])
  const titleRef = useRef<string>()
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const [dragHandle, setDragHandle] = useState<DragHandleProps>()
  const emitter = useEventEmitter()
  const selectedRef = useSelectedEditorRef()
  const { getNoteById, saveNote, findParentNotes, updateNote, saveNoteAndBlocks } = useNoteStore()
  const [note, setNote] = useState<INote | null>(null)
  const [metaObject, setMetaObject] = useState<MetaObject | null>(null)
  const [currentDocument] = useCurrentDocument()
  const { updateDocument } = useDocumentStore()
  const { addItemToCollection } = useCollectionStore()
  const { addMetaObject, getMetaObjectById } = useMetaStore()

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (dragHandle?.visible) {
        setDragHandle({ ...dragHandle, visible: false })
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    const scrollElement = scrollElementRef.current
    if (scrollElement) {
      scrollManager.registerScrollElement(scrollElement)
      dragManager.registerScrollElement(scrollElement)
    }
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  })
  useEffect(() => {
    if (noteId) {
      getNoteById(noteId).then(
        note => {
          if (note) {
            setNote(note)
            setTitle(note.title)
            onSave?.()
            onTitleChange?.(note.title || 'Untitled')
          } else {
            setNote(null)
          }
        },
        () => setNote(null)
      )
    }
  }, [noteId])
  useEffect(() => {
    if (note?.metaId) {
      getMetaObjectById(note.metaId).then(obj => {
        setMetaObject(obj)
        console.log(obj)
      })
    }
  }, [getMetaObjectById, note])
  useEffect(() => {
    findParentNotes(noteId).then(path => {
      setParentNotes(path)
    })
  }, [findParentNotes])
  const { sharedType, doc, provider } = useMemo(() => {
    const doc = new Y.Doc()
    let provider
    if (!GlobalProviderMap.has(noteId)) {
      provider = new IndexeddbPersistence(String(noteId), doc)
      GlobalProviderMap.set(noteId, provider)
    } else {
      provider = GlobalProviderMap.get(noteId)
    }
    // const provider = new IndexeddbPersistence(String(noteId), doc)
    const sharedType = provider.doc.get('content', Y.XmlText)
    return { doc, provider, sharedType }
  }, [noteId])
  provider.on(
    'synced',
    useMemoizedFn(() => {
      if (sharedType._length === 0) {
        sharedType.applyDelta(slateNodesToInsertDelta(initial))
      }
      // avoid undo on synced
      editor.history = { redos: [], undos: [] }
      editor.initialized = true
      onEditorInitialized?.(!!note)
    })
  )
  const handler = (e: { type: string; data: any }) => {
    if (e.type === 'addMetaObject') {
      overlayManager.setContent('metaQuery')
      overlayManager.open()
    }
  }
  const editor = useMemo(() => {
    return withVoid(
      withHtml(
        withCustomComponent(
          withShortcuts(
            withHandler(withEmitter(withHistory(withReact(withYjs(createEditor(), sharedType, { autoConnect: false }))), emitter), handler)
          )
        )
      )
    )
  }, [sharedType])
  useLocalSyncValue(editor)
  const dragManager = useEditorDrag(editor, scrollElementRef.current)
  const elementsMap = ID_TO_ELEMENTS_MAP.get(editor)
  const { renderOverlay, overlayManager } = useEditorOverlay(editor, scrollElementRef.current)
  useEditorSelect(editor, overlayManager, scrollElementRef.current)
  useEffect(() => {
    YjsEditor.connect(editor)
    ID_TO_ELEMENTS_MAP.set(editor, new Map())
    SELECTED_BLOCKS_MAP.set(editor, new Map())
    dragManager.registerEditor(editor)
    editor.id = id
    editor.noteId = noteId
    editor.initialized = true
    return () => {
      // disconnect
      if (YjsEditor.connected(editor)) {
        YjsEditor.disconnect(editor)
      }
    }
  }, [editor])

  useLayoutEffect(() => {
    selectedRef.current = {
      insertNode: handleInsertNode,
      elementPropertyChange: handleElementPropertyChange,
      outerElementPropertyChange: handleOuterElementPropertyChange,
      resetEditor: handleResetEditor,
      jumpToBlock: handleJumpToBlock
    }
  }, [])

  const handleResetEditor = (value: Descendant[], title?: string) => {
    if (value) {
      editor.children = value
      editor.onChange()
    }
    title && setTitle(title)
  }
  const handleJumpToBlock = useMemoizedFn((blockId: number) => {
    const requestSelectBlock = () => {
      const block = elementsMap?.get(blockId)
      if (block) {
        block.selectBlock()
        return
      }
      requestIdleCallback(requestSelectBlock)
    }
    requestIdleCallback(requestSelectBlock)
  })
  const handleNestedListItem = useMemoizedFn((isNested: boolean) => {
    dragManager.shouldNested(isNested)
  })
  const handleInsertNode = useMemoizedFn((element: CustomElement) => {
    element.id = Id.getId()
    if (element.type === 'emoji') {
      handleInsertEmoji(element)
    } else {
      if (element.type === 'subPage') {
        // wait for switch to sub page
        setTimeout(() => Editor.insertNode(editor, element), 300)
      } else {
        Editor.insertNode(editor, element)
      }
    }
  })
  const handleInnerRendered = useMemoizedFn(() => {
    console.log('inner rendered (this is placeholder console)')
  })
  const handleInsertEmoji = element => {
    const { selection } = editor
    const ele = {
      type: element.type,
      name: element.name,
      children: element.children
    }
    Transforms.insertNodes(editor, ele, { at: Range.end(selection) })
    Transforms.move(editor, {
      edge: 'end',
      distance: 1,
      unit: 'word'
    })
  }

  const handleElementPropertyChange = (element: CustomElement) => {
    if (element.id) {
      Transforms.setNodes(editor, element, {
        match: n => n.id === element.id
      })
    }
  }

  const handleOuterElementPropertyChange = (element: OuterElement) => {
    if (element.originId) {
      Transforms.setNodes(
        editor,
        { title: element.title },
        {
          at: [],
          match: n => n.originId && n.originId === element.originId,
          voids: true,
          mode: 'all'
        }
      )
    }
  }

  const handleDividerDragEnd = useMemoizedFn(
    (previousColumnWidthRatio: number, previousColumnPath: Path, nextColumnWidthRatio: number, nextColumnPath: Path) => {
      setDragHandle(undefined)
      setIsDraggingDivider(false)
      Transforms.setNodes(
        editor,
        {
          ratio: previousColumnWidthRatio
        },
        {
          at: previousColumnPath
        }
      )
      Transforms.setNodes(
        editor,
        {
          ratio: nextColumnWidthRatio
        },
        {
          at: nextColumnPath
        }
      )
    }
  )

  const handleDividerDragStart = useMemoizedFn(() => {
    setIsDraggingDivider(true)
    // setIsDragging(true)
  })

  const handleBlockMouseMove = useMemoizedFn((e: MouseEvent, element) => {
    if (!isDragging && !overlayVisible && !globalIsDragging) {
      editor.currentEnterElement = element
      dragManager.registerDragElement(e.currentTarget as HTMLElement, ReactEditor.findPath(editor, element))
      if (dragHandle?.targetId !== element.id || dragHandle?.visible === false) {
        const targetRect = e.currentTarget.getBoundingClientRect()
        setDragHandle({
          left: targetRect.x,
          top: targetRect.y,
          targetId: element.id,
          targetHeight: targetRect.height,
          visible: true
        })
      }
    }
  })

  const handleToggleOutline = useMemoizedFn(() => {
    setOutlineVisible(!outlineVisible)
  })

  const handleEditorValueChange = useMemoizedFn(value => {})

  const handleTitleChange = useMemoizedFn((e: FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || 'Untitled'
    titleRef.current = text
    if (note) {
      updateNote({
        id: noteId,
        title: text
      })
    }
    onTitleChange?.(text)
    emitter.emit('editor', {
      type: 'outerElementPropertyChange',
      data: {
        element: {
          originId: noteId,
          title: text
        }
      }
    })
  })

  const handleOpenSave = useMemoizedFn(() => {
    const title = titleRef.current
    if (note) {
      toast.error('Note has been saved!')
      return
    }
    if (title && title !== '' && title !== 'Untitled') {
      setSaveNoteVisible(true)
    } else {
      toast.error("Title can't be empty!")
    }
  })

  const handleSave = (confirm: boolean, collection: ICollection) => {
    toast.success('Note saved')
    setSaveNoteVisible(false)
    if (currentDocument && noteId && confirm) {
      const newDoc = produce(currentDocument, d => {
        d.noteIds = d?.noteIds || []
        if (!d.noteIds.includes(noteId)) {
          d.noteIds.push(noteId)
        }
      })
      updateDocument(newDoc)
    }
    addItemToCollection(
      {
        type: 'note',
        id: noteId
      },
      collection.id
    )

    const flattened = []
    const title = titleRef.current
    addMetaObject({
      type: 'note',
      noteId,
      title
    } as MetaNoteObject)
    serializeEditor(editor, editor, flattened)
    saveNote({
      id: noteId,
      title
    })?.then(note => {
      setNote(note)
      onSave?.()
    })
    flattened.forEach(i => {
      i.noteId = noteId
      if (['column', 'columnList'].includes(i.type)) {
        delete i.children
        delete i.plain
      }
      if (i.subBlockIds.length === 0) {
        delete i.subBlockIds
      }
    })
    // saveNoteAndBlocks(editor, flattened, title)
  }

  const handleAddSubPage = useMemoizedFn(() => {
    if (note === null) {
      toast.error('You have to save current note before adding new sub page!')
    } else {
      const subPageId = Id.getId()
      emitter.emit('editor', {
        type: 'insertNode',
        data: {
          element: {
            type: 'subPage',
            originId: subPageId,
            children: [{ text: '' }]
          }
        }
      })
      emitter.emit('editor', {
        type: 'insertTab',
        data: {
          noteId: subPageId,
          isNew: true,
          parentNoteId: noteId
        }
      })
    }
  })

  const handleBlockHandleMenu = (e: MouseEvent) => {
    editor.currentAddClickElement = editor.currentEnterElement
    overlayManager.setContent('blockHandleMenu')
    overlayManager.setPosition({
      left: e.clientX,
      top: e.clientY
    })
    overlayManager.open()
  }
  const handleMenuClick = (e: MouseEvent) => {
    overlayManager.setContent('blockDetailsMenu')
  }
  return (
    <div
      className={styles.Editor}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <TabTitle title={title || metaObject?.name || 'Unknown note'} />
      <Modal width={500} height={400} visible={saveNoteVisible} onClose={() => setSaveNoteVisible(false)}>
        <SaveNoteDialog onCancel={() => setSaveNoteVisible(false)} onSubmit={handleSave} />
      </Modal>
      {parentNotes.length > 1 && (
        <Content style={{ paddingLeft: '14px' }}>
          <Breadcrumb>
            {parentNotes.map(i => (
              <Breadcrumb.Item
                key={i.title}
                onClick={() => {
                  emitter.emit('editor', {
                    type: 'switchTab',
                    data: {
                      noteId: i.id
                    }
                  })
                }}
                type="button"
              >
                {i.title || t('editor.untitled')}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Content>
      )}
      <div ref={scrollElementRef} className={styles.Wrapper}>
        {metaObject?.coverImgSrc && (
          <Image
            className={css({
              width: '100% !important',
              height: 300,
              overflow: 'hidden',
              marginBottom: -50,
              flexShrink: 0,
              '> div': {
                ':first-child': {
                  transform: 'translateY(-30%)'
                }
              }
            })}
            src={metaObject.coverImgSrc}
          />
        )}
        <div role="inner-editor" className={classNames(styles.InnerEditorWrapper, mindmapVisible && styles.MindmapVisible)}>
          <Content className={styles.titleWrapper} flex column gap={20}>
            <Content
              gap={10}
              className={css({
                '> div': {
                  color: 'rgba(55,53,47,0.5)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    background: 'rgba(0,0,0,0.07)'
                  }
                }
              })}
              flex
              alignItems="flex-end"
            >
              {metaObject?.coverImgSrc && (
                <Image
                  className={css({
                    opacity: '1 !important'
                  })}
                  src={metaObject.coverImgSrc}
                />
              )}
              {!metaObject && (
                <Content flex gap={6}>
                  <Icon name="park-smiling-face" />
                  <span>Add icon</span>
                </Content>
              )}
              <Content flex gap={6}>
                <Icon name="park-add-picture" />
                <span>Add cover</span>
              </Content>
            </Content>
            <div
              onInput={onTitleChange}
              spellCheck="false"
              className={styles.title}
              placeholder={t('editor.untitled')}
              suppressContentEditableWarning={true}
              contentEditable={metaObject === null}
              style={{
                maxWidth: '100%',
                width: '100%'
              }}
            >
              {metaObject?.name || title}
            </div>
          </Content>
          <InnerEditor
            note={note}
            scrollElement={scrollElementRef.current}
            title={title}
            noteId={noteId}
            onTitleChange={handleTitleChange}
            editor={editor}
            onRendered={handleInnerRendered}
            defaultValue={initial}
            onChange={handleEditorValueChange}
            onDividerDragEnd={handleDividerDragEnd}
            onDividerDragStart={handleDividerDragStart}
            onBlockMouseMove={handleBlockMouseMove}
            onBlockMouseLeave={useMemoizedFn((e, element) => {
              setDragHandle({ ...dragHandle, visible: false })
            })}
            onNestedListItem={handleNestedListItem}
            onSave={handleOpenSave}
            onAddSubPage={handleAddSubPage}
            onToggleOutline={handleToggleOutline}
            isDragging={isDragging}
          />
        </div>
      </div>
      {renderOverlay()}
      <BlockHandle
        onAddClick={handleBlockHandleMenu}
        onDragClick={useCallback(() => {
          console.log('clsda')
          setIsDragging(true)
        }, [])}
        onMenuClick={handleMenuClick}
        {...dragHandle}
        visible={!isDragging && !outlineVisible && !mindmapVisible && dragHandle?.visible}
      />
    </div>
  )
})
