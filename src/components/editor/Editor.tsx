import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import Id from '@/utils/id'
import { CSSProperties, FC, memo, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEditor, Transforms, Descendant } from 'slate'
import { withHistory } from 'slate-history'
import { withReact, ReactEditor } from './slate-react'
import { CustomEditor, CustomElement } from './types'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import styles from './index.module.less'
import BlockHandle from './components/BlockHandle'
import useIsDragging from './hooks/useIsDragging'
import { notesAtom } from '@/stores/note.store'
import { NoteStore } from '@/stores'
import { withYjs, YjsEditor } from './yjs'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import withShortcuts from './plugins/withShortcuts'
import withCustomComponent from './plugins/withCustomComponent'
import withEmitter from './plugins/withEmitter'
import withHtml from './plugins/withHtml'
import { ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'
import _ from 'lodash'
import { metaObjectsAtom } from '@/stores/meta.store'
import useLocalSyncValue from './hooks/useSyncValue'
import useEditorDrag from './hooks/useEditorDrag'
import { useGlobalIsDragging } from '../globalDragOverlay/GlobalDragOverlay'
import useEditorOverlay from './components/overlay/useEditorOverlay'
import withHandler from './plugins/withHandler'
import useEditorSelect from './hooks/useEditorSelect'
import { atom, createStore } from 'jotai/vanilla'
import { Provider, useAtomValue } from 'jotai/react'
import useStoreValue from './hooks/useStoreValue'
import { globalStore } from '@/stores'
import EditorTitle from './EditorTitle'
import { selectAtom } from 'jotai/utils'

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
  onChange?: (e: Descendant[]) => void
  onClick?: () => void
  onTitleChange?: (title: string) => void
  onEditorInitialized?: (editor: CustomEditor) => void
  initialValue?: Descendant[]
  id: string
  noteId: number
  readonly?: boolean
  showTitle?: boolean
  onContentRendered?: (editor: CustomEditor) => void
  titleStyle?: CSSProperties
  titleContainerStyle?: CSSProperties
  innerEditorStyle?: CSSProperties
}
export interface IEditorRef {
  insertNode: (element: CustomElement) => void
  elementPropertyChange: (element: CustomElement) => void
  outerElementPropertyChange: (element: CustomElement) => void
  resetEditor: (value: Descendant[], title?: string) => void
  jumpToBlock: (blockId: number) => void
}
export const GlobalProviderMap = new Map()
export const EditorV1: FC<EditorProps> = memo(
  ({
    id,
    noteId,
    readonly,
    onContentRendered,
    showTitle = true,
    titleContainerStyle,
    titleStyle,
    onTitleChange,
    innerEditorStyle,
    onEditorInitialized
  }) => {
    const [isDragging, setIsDragging] = useIsDragging()
    const [globalIsDragging] = useGlobalIsDragging()
    const scrollElementRef = useRef<HTMLDivElement>(null)
    const [dragHandle, setDragHandle] = useState<DragHandleProps>()
    const emitter = useGlobalEventEmitter()
    const noteAtom = useMemo(() => selectAtom(notesAtom, n => n.get(noteId)), [noteId])
    const note = useAtomValue(noteAtom, { store: globalStore })
    const metaAtom = useMemo(() => (note?.metaId ? selectAtom(metaObjectsAtom, m => m.get(note?.metaId!)) : atom(null)), [note?.metaId])
    const metaObject = useAtomValue(metaAtom, { store: globalStore })
    const { fetchNoteById } = NoteStore
    useEffect(() => {
      const keyDownHandler = () => {
        setDragHandle(h => (h?.visible ? { ...h, visible: false } : h))
      }
      const pointerDownHandler = (e: PointerEvent) => {
        const textbox = scrollElementRef.current?.querySelector('[role="textbox"]')
        const lastEleRect = textbox?.lastElementChild?.getBoundingClientRect()
        if (lastEleRect && e.clientY > lastEleRect.bottom) {
          Transforms.insertNodes(
            editor,
            {
              type: 'paragraph',
              children: [{ text: '' }],
              id: Id.getId()
            },
            {
              at: [editor.children.length]
            }
          )
          Transforms.select(editor, [editor.children.length - 1])
        }
      }
      document.addEventListener('keydown', keyDownHandler)
      scrollElementRef.current?.addEventListener('pointerdown', pointerDownHandler)
      return () => {
        document.removeEventListener('keydown', keyDownHandler)
        scrollElementRef.current?.removeEventListener('pointerdown', pointerDownHandler)
      }
    }, [])
    useEffect(() => {
      fetchNoteById(noteId)
    }, [noteId])

    const { sharedType, doc, provider } = useMemo(() => {
      const doc = new Y.Doc()
      let provider
      if (!GlobalProviderMap.has(noteId)) {
        provider = new IndexeddbPersistence(String(noteId), doc)
        GlobalProviderMap.set(noteId, provider)
      } else {
        // share the same provider
        provider = GlobalProviderMap.get(noteId)
      }
      const sharedType = provider.doc.get('content', Y.XmlText)
      return { doc, provider, sharedType }
    }, [noteId])

    const handler = (e: { type: string; data: any }) => {
      if (e.type === 'addMetaObject') {
        overlayManager.setContent('metaQuery')
        overlayManager.open()
      }
    }

    const editor = useMemo(() => {
      const editor = withVoid(
        withHtml(
          withCustomComponent(
            withShortcuts(
              withHandler(
                withEmitter(withHistory(withReact(withYjs(createEditor(), sharedType, { autoConnect: false }))), emitter),
                handler
              )
            )
          )
        )
      )
      ID_TO_ELEMENTS_MAP.set(editor, new Map())
      SELECTED_BLOCKS_MAP.set(editor, new Map())
      onEditorInitialized?.(editor)
      return editor
    }, [sharedType])

    useLocalSyncValue(editor)

    useStoreValue(note, editor, provider, doc, sharedType, onContentRendered)

    const { dragManager, renderIndicator } = useEditorDrag(editor, scrollElementRef.current)

    const { renderOverlay, overlayManager, popoverVisible } = useEditorOverlay(editor, scrollElementRef.current)

    useEditorSelect(editor, overlayManager, scrollElementRef.current)

    useEffect(() => {
      editor.id = id
      editor.noteId = noteId
      return () => {
        // disconnect
        if (YjsEditor.connected(editor)) {
          YjsEditor.disconnect(editor)
        }
      }
    }, [editor])

    useMemo(() => {
      editor.note = note
    }, [note])

    useMemo(() => {
      if (readonly) {
        editor.readonly = true
      }
    }, [editor, readonly])

    const handleBlockMouseMove = useMemoizedFn((e: MouseEvent, element: CustomElement) => {
      if (!isDragging && !globalIsDragging) {
        editor.currentEnterElement = element
        dragManager.registerDragHtmlElement(e.currentTarget as HTMLElement, ReactEditor.findPath(editor, element))
        if (dragHandle?.targetId !== element.id || dragHandle?.visible === false) {
          const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          setDragHandle({
            left: targetRect.x - 5,
            top: targetRect.y,
            targetId: element.id,
            targetHeight: targetRect.height,
            visible: true
          })
        }
      }
    })

    const handleBlockHandleMenu: MouseEventHandler = e => {
      editor.currentAddClickElement = editor.currentEnterElement
      overlayManager.setContent('blockHandleMenu')
      const rect = e.currentTarget.getBoundingClientRect()
      overlayManager.setPosition({
        left: rect.left + 10,
        top: rect.top
      })
      overlayManager.open()
    }

    const handleMenuClick: MouseEventHandler = e => {
      editor.currentAddClickElement = editor.currentEnterElement
      setIsDragging(false)
      overlayManager.setContent('blockDetailsMenu')
      const rect = e.currentTarget.getBoundingClientRect()
      overlayManager.setPosition({
        left: rect.left + 10,
        top: rect.top
      })
      overlayManager.open()
    }
    useEffect(() => {
      onTitleChange?.(metaObject?.name || note?.title || 'Untitled')
    }, [metaObject?.name, note?.title])
    return (
      <div className={styles.editor}>
        {/* {metaObject?.coverImgSrc && (
          <Image
            className={css({
              width: '100% !important',
              height: !readonly ? 300 : 200,
              overflow: 'hidden',
              marginBottom: !readonly ? -50 : 0,
              flexShrink: 0,
              '> div': {
                ':first-child': {
                  transform: 'translateY(-30%)'
                }
              }
            })}
            src={metaObject.coverImgSrc}
          />
        )} */}

        <div ref={scrollElementRef} className={styles.scrollWrapper}>
          {showTitle && (
            <EditorTitle
              titleContainerStyle={titleContainerStyle}
              titleStyle={titleStyle}
              noteId={noteId}
              description={metaObject?.description}
              titleEditable={!metaObject}
              title={metaObject?.name || note?.title || 'Untitled'}
            />
          )}
          <div
            role="inner-editor"
            className={styles.InnerEditorWrapper}
            style={{ padding: readonly ? '0px' : undefined, '--block-bg': readonly ? 'none' : undefined, ...innerEditorStyle }}
          >
            <InnerEditor
              readonly={readonly}
              scrollElementRef={scrollElementRef}
              editor={editor}
              defaultValue={initial}
              onBlockMouseMove={handleBlockMouseMove}
              onBlockMouseLeave={useMemoizedFn((e, element) => {
                setDragHandle({ ...dragHandle, visible: false })
              })}
            />
          </div>
        </div>
        {renderOverlay()}
        {renderIndicator}
        <BlockHandle
          onAddClick={handleBlockHandleMenu}
          onDragClick={useCallback(() => {
            setIsDragging(true)
          }, [setIsDragging])}
          onMenuClick={handleMenuClick}
          {...dragHandle}
          visible={!!(!isDragging && dragHandle?.visible && !popoverVisible && !readonly)}
        />
      </div>
    )
  }
)

export const Editor: FC<EditorProps> = memo(props => {
  const store = useMemo(() => createStore(), [])
  return (
    <Provider store={store}>
      <EditorV1 {...props} />
    </Provider>
  )
})
