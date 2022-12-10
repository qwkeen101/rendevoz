import { EditorEventHandler } from '@/events/editorEvent'
import useEventEmitter from '@/events/useEventEmitter'
import { useDebounceFn, useMemoizedFn, useRafFn, useUnMount } from '@/hooks'
import Id from '@/utils/id'
import classNames from 'classnames'
import { FC, FormEvent, memo, MouseEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createEditor, Editor, Transforms, Descendant, Path, Range } from 'slate'
import { withHistory } from 'slate-history'
import { withReact, ReactEditor } from 'slate-react'
import { searchBlock } from '../dragReposition/utils/algorithm'
import { getElementId } from '../dragReposition/utils/element'
import { getDistanceBetweenPointAndScrollableElement, getDistanceBetweenElementAndScrollableElement } from './utils/scroll'
import { CustomElement } from './customTypes'
import { useSelectedEditorRef } from './hooks/useSelectedEditorRef'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import styles from './index.module.less'
import BlockHandle from './components/blockHandle'
import EditorOverlay from './components/overlay'
import useIsDragging from './hooks/useIsDragging'
import { serializeEditor } from './utils/database/serialize'
import useNoteStore from '@/stores/note.store'
import useCurrentDocument from '../../hooks/components/useCurrentDocument'
import useDocumentStore from '@/stores/document.store'
import { withYjs, withYHistory, slateNodesToInsertDelta, YjsEditor } from '@slate-yjs/core'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import Modal from '../base/modal'
import SaveNoteDialog from '../dialogs/SaveNoteDialog'
import toast from 'react-hot-toast'
import produce from 'immer'
import { ICollection, INote, MetaNoteObject } from '~/typings/data'
import useCollectionStore from '@/stores/collection.store'
import withShortcuts from './plugins/withShortcuts'
import withCustomComponent from './plugins/withCustomComponent'
import { Breadcrumb, Content } from '../base'
import withEmitter from './plugins/withEmitter'
import withHtml from './plugins/withHtml'
import { useTranslation } from 'react-i18next'
import { SELECT_AREA_MAP, ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'
import { Noop } from '@/common/types'
import useIsSelecting from './hooks/useIsSelecting'
import ScrollManager from './ScrollManager'
import { Position } from '@/types'
import _ from 'lodash'
import DragManager from './DragManager'
import useMetaStore from '@/stores/meta.store'
import TabTitle from '../layout/TabTitle'
import useLatest from '@/hooks/utils/useLatest'
import { useEffectOnce } from '@/hooks/utils/useEffectOnce'
import useLocalSyncValue from './hooks/useSyncValue'

type DragHandleProps = {
  left: number
  top: number
  targetHeight: number
  targetId: number
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
  const [outlineVisible, setOutlineVisible] = useState(false)
  const [mindmapVisible, setMindmapVisible] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [saveNoteVisible, setSaveNoteVisible] = useState(false)
  const [parentNotes, setParentNotes] = useState<INote[]>([])
  const [title, setTitle] = useState<string>()
  const [isSelecting, setIsSelecting] = useIsSelecting()
  const scrollManager = useMemo(() => new ScrollManager(), [])
  const dragManager = useMemo(() => new DragManager(), [])
  const titleRef = useRef<string>()
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const draggingLayerRef = useRef<HTMLDivElement>()
  const blockElementsRef = useRef<Map<globalThis.Element, { left: number; top: number; height: number; width: number }>>(new Map())
  const blockElementsArrayRef = useRef<HTMLElement[]>([])
  const [dragHandle, setDragHandle] = useState<DragHandleProps>()
  const emitter = useEventEmitter()
  // const handler = useMemo(() => new EditorEventHandler(), [])
  const selectedRef = useSelectedEditorRef()
  const { getNoteById, saveNote, findParentNotes, updateNote, saveNoteAndBlocks } = useNoteStore()
  const [note, setNote] = useState<INote | null>(null)
  const [currentDocument] = useCurrentDocument()
  const { updateDocument } = useDocumentStore()
  const { addItemToCollection } = useCollectionStore()
  const { addMetaObject } = useMetaStore()
  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (scrollElement) {
      scrollManager.registerScrollElement(scrollElement)
      dragManager.registerScrollElement(scrollElement)
      scrollElement.addEventListener('mousedown', handleStartSelecting)
      return () => {
        scrollElement.removeEventListener('mousedown', handleStartSelecting)
      }
    }
  })
  const handleStartSelecting = (e: MouseEvent) => {
    // click on blank wrapper space, start selecting
    if (e.target === e.currentTarget) {
      document.body.style.cursor = 'default'
      setIsSelecting(true)
      const scrollElement = scrollElementRef.current
      if (!scrollElement) return
      blockElementsArrayRef.current = []
      blockElementsRef.current.clear()
      Array.from(scrollElement.querySelector(`[role="textbox"]`)?.querySelectorAll('[data-spec-type="common-block"]') || []).forEach(i => {
        const { left, top, width, height } = i.getBoundingClientRect()
        const distance = getDistanceBetweenPointAndScrollableElement({ x: left, y: top }, scrollElement)
        blockElementsArrayRef.current.push(i)
        blockElementsRef.current.set(i, {
          left: distance.left,
          top: distance.top,
          width,
          height
        })
      })
      const distanceToScrollElement = getDistanceBetweenElementAndScrollableElement(
        {
          left: e.clientX,
          top: e.clientY,
          x: e.clientX,
          y: e.clientY,
          right: e.clientX,
          bottom: e.clientY,
          width: 0,
          height: 0
        },
        scrollElement
      )
      if (distanceToScrollElement) {
        SELECT_AREA_MAP.set(editor, {
          startPoint: { ...distanceToScrollElement },
          endPoint: { ...distanceToScrollElement },
          ...distanceToScrollElement
        })
      }
    }
  }
  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mousemove', handleSelecting2)
      document.addEventListener('mouseup', handleEndSelecting)
      document.addEventListener('click', handleEndSelecting, true)
      return () => {
        document.removeEventListener('mousemove', handleSelecting2)
        document.removeEventListener('mouseup', handleEndSelecting)
        // document.removeEventListener('click', handleEndSelecting)
      }
    }
  }, [isSelecting])
  const handleSelecting = useMemoizedFn((e: MouseEvent) => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) {
      return
    }
    e.preventDefault()
    if (scrollManager.canScroll()) {
      scrollManager.startScroll(e)
    }
    const prevRect = SELECT_AREA_MAP.get(editor)
    if (!prevRect) return

    const startPoint = prevRect.startPoint as Required<Position>
    const endPoint = getDistanceBetweenPointAndScrollableElement(
      {
        x: e.clientX,
        y: e.clientY
      },
      scrollElement
    )
    const currRect = {
      startPoint,
      endPoint,
      left: Math.min(startPoint.left, endPoint.left),
      top: Math.min(startPoint.top, endPoint.top),
      right: Math.min(startPoint.left, endPoint.left) + Math.abs(endPoint.left - startPoint.left),
      bottom: Math.min(startPoint.top, endPoint.top) + Math.abs(endPoint.top - startPoint.top)
    }
    SELECT_AREA_MAP.set(editor, currRect)
    emitter.emit('editor', {
      type: 'toggleOverlay',
      data: {
        content: 'selectArea'
      }
    })
    // start search selected blocks
    const firstBlock = blockElementsArrayRef.current[0]
    const lastBlock = blockElementsArrayRef.current[blockElementsArrayRef.current.length - 1]
    const firstBlockRect = blockElementsRef.current.get(firstBlock)
    const lastBlockRect = blockElementsRef.current.get(lastBlock)
    const blocksMap = ID_TO_ELEMENTS_MAP.get(editor)
    if (!firstBlockRect || !lastBlockRect) return
    if (currRect.bottom < firstBlockRect.top) {
      const prevSelectedBlocks = SELECTED_BLOCKS_MAP.get(editor)
      if (prevSelectedBlocks) {
        Array.from(prevSelectedBlocks.values()).forEach(i => {
          const id = getElementId(i)
          blocksMap?.get(id)?.collisionSelectBlock()
        })
      }
      return
    }
    if (currRect.top > lastBlockRect.top + lastBlockRect.height) return
    const blockEntriesArray = Array.from(blockElementsRef.current.entries())
    const topBlock = searchBlock(blockEntriesArray, currRect.top)
    const bottomBlock = searchBlock(blockEntriesArray, currRect.bottom)
    const topIdx = topBlock === -1 ? 0 : blockElementsArrayRef.current.findIndex(i => i === topBlock)
    let finalBottomBlock = bottomBlock
    if (bottomBlock !== -1) {
      finalBottomBlock = _.findLast(blockEntriesArray, i => {
        return i[1].top === blockElementsRef.current.get(bottomBlock)?.top ? true : false
      })?.[0]
    }

    const bottomIdx =
      finalBottomBlock === -1
        ? blockElementsArrayRef.current.length
        : blockElementsArrayRef.current.findIndex(i => i === finalBottomBlock) + 1
    const blocks = blockElementsArrayRef.current.slice(topIdx, bottomIdx)
    const prevSelectedBlocks = SELECTED_BLOCKS_MAP.get(editor)
    if (prevSelectedBlocks) {
      Array.from(prevSelectedBlocks.values())
        .filter(i => !blocks.some(o => o === i))
        .forEach(i => {
          const id = getElementId(i)
          blocksMap?.get(id)?.collisionSelectBlock()
        })
    }

    blocks.forEach(i => {
      const id = getElementId(i)
      blocksMap?.get(id)?.collisionSelectBlock()
    })
  })

  const handleEndSelecting = useMemoizedFn((e: MouseEvent) => {
    if (e.type === 'click') {
      e.stopPropagation()
      document.removeEventListener('click', handleEndSelecting, true)
    }
    SELECT_AREA_MAP.delete(editor)
    document.body.style.cursor = 'auto'
    emitter.emit('editor', {
      type: 'toggleOverlay',
      data: {
        content: 'selectArea'
      }
    })
    setIsSelecting(false)
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

  const editor = useMemo(() => {
    return withVoid(
      withHtml(
        withCustomComponent(
          withShortcuts(
            withEmitter(withHistory(withReact(withYHistory(withYjs(createEditor(), sharedType, { autoConnect: false })))), emitter)
          )
        )
      )
    )
  }, [sharedType])
  useLocalSyncValue(editor)
  const elementsMap = ID_TO_ELEMENTS_MAP.get(editor)
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
  useEffect(() => {
    if (isDragging) {
      draggingLayerRef.current && dragManager.registerDragLayer(draggingLayerRef.current)
    }
  }, [isDragging])

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

  const handleDragDrop = useMemoizedFn(() => {
    if (dragManager.drop()) {
      setDragHandle(undefined)
    }
  })

  const handleStartDragging = () => {
    setIsDragging(true)
    dragManager.prepareDragging()
    document.addEventListener('mousemove', handleDragging2)
    document.addEventListener('mouseup', handleEndDragging)
  }

  const handleDragging = useMemoizedFn((e: MouseEvent) => {
    if (scrollManager.canScroll()) {
      scrollManager.startScroll(e)
    }
    const indicator = dragManager.drag(e)
    indicator && dragManager.changeIndicator(indicator, e)
  })

  const throttledHandleDragging = useRafFn(handleDragging)
  const throttledHandleSelecting = useRafFn(handleSelecting)

  const handleSelecting2 = useMemoizedFn((e: MouseEvent) => {
    try {
      e.preventDefault()
      throttledHandleSelecting(e)
    } catch (e) {
      console.error(e)
    }
  })
  const handleDragging2 = useMemoizedFn((e: MouseEvent) => {
    try {
      e.preventDefault()
      throttledHandleDragging(e)
    } catch (e) {
      console.log(e)
    }
  })

  const handleEndDragging = useMemoizedFn(() => {
    document.removeEventListener('mousemove', handleDragging2)
    document.removeEventListener('mouseup', handleEndDragging)
    try {
      handleDragDrop()
    } catch (e) {
      console.log(e)
    }
    setIsDragging(false)
  })

  const handleDividerDragEnd = useMemoizedFn(
    (previousColumnWidthRatio: number, previousColumnPath: Path, nextColumnWidthRatio: number, nextColumnPath: Path) => {
      setDragHandle(undefined)
      setIsDragging(false)
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
    setIsDragging(true)
  })

  const handleMouseEnter = useMemoizedFn((e: MouseEvent, element) => {
    if (!isDragging && !overlayVisible) {
      dragManager.registerDragElement(e.currentTarget as HTMLElement, ReactEditor.findPath(editor, element))
      const targetRect = e.currentTarget.getBoundingClientRect()
      setDragHandle({
        left: targetRect.x,
        top: targetRect.y,
        targetId: element.id,
        targetHeight: targetRect.height
      })
    }
  })

  const handleToggleMindmap = useMemoizedFn(() => {
    setMindmapVisible(!mindmapVisible)
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
  const handleAddMetaObject = useMemoizedFn(() => {
    Editor.insertBreak(editor)
    Editor.insertText(editor, '$ ')
    setTimeout(() => {
      emitter.emit('editor', {
        type: 'toggleOverlay',
        data: {
          content: 'metaObject',
          noteId: noteId
        }
      })
    }, 100)
  })
  const handleBlockHandleMenu = (e: MouseEvent) => {
    emitter.emit('editor', {
      type: 'toggleOverlay',
      data: {
        left: e.clientX,
        top: e.clientY,
        content: 'blockHandleMenu'
      }
    })
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
      <TabTitle title={title} />
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
        <div role="inner-editor" className={classNames(styles.InnerEditorWrapper, mindmapVisible && styles.MindmapVisible)}>
          <InnerEditor
            titleMarginTop={titleMarginTop}
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
            onBlockMouseEnter={handleMouseEnter}
            onNestedListItem={handleNestedListItem}
            onSave={handleOpenSave}
            onAddSubPage={handleAddSubPage}
            onToggleMindmap={handleToggleMindmap}
            onToggleOutline={handleToggleOutline}
            isDragging={isDragging}
          />
        </div>
      </div>
      <EditorOverlay
        onVisiblityChange={visibility => {
          setOverlayVisible(visibility)
          if (overlayVisible) {
            setDragHandle(undefined)
          }
        }}
        visible={overlayVisible}
        editor={editor}
        scrollElement={scrollElementRef.current}
        onAddMetaObject={handleAddMetaObject}
      />
      <BlockHandle
        onAddClick={handleBlockHandleMenu}
        onDragClick={handleStartDragging}
        {...dragHandle}
        visible={!isDragging && !outlineVisible && !mindmapVisible}
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none' }} role="dragging-layer">
        <div style={{ pointerEvents: 'auto', position: 'relative', zIndex: 0 }}>
          {isDragging && <div style={{ position: 'absolute', top: 0, left: 0 }} ref={draggingLayerRef}></div>}
        </div>
      </div>
    </div>
  )
})
