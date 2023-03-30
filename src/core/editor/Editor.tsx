import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import Id from '@/utils/id'
import React, { CSSProperties, FC, memo, MouseEventHandler, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEditor, Transforms, Descendant, Editor as SlateEditor, Node } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from './slate-react'
import { CustomEditor, CustomElement, EditorInstance } from '~/typings'
import InnerEditor, { InnerEditorProps } from './InnerEditor'
import withVoid from './plugins/withVoid'
import styles from './index.module.less'
import BlockHandle from './components/BlockHandle'
import useIsDragging from './hooks/useIsDragging'
import { notesAtom } from '@/stores/note.store'
import { NoteStore } from '@/stores'
import { YjsEditor } from './yjs'
import withShortcuts from './plugins/withShortcuts'
import withCustomComponent from './plugins/withCustomComponent'
import withEmitter from './plugins/withEmitter'
import withHtml from './plugins/withHtml'
import { ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'
import _ from 'lodash'
import { metaObjectsAtom } from '@/stores/meta.store'
import useLocalSyncValue from './hooks/useSyncValue'
import useEditorDrag, { normalizeEditorDragBlocksToGlobalDraggingDetails } from './hooks/useEditorDrag'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/core'
import useEditorOverlay from './components/overlay/useEditorOverlay'
import withHandler from './plugins/withHandler'
import useEditorSelect from './hooks/useEditorSelect'
import { atom, createStore } from 'jotai/vanilla'
import { Provider, useAtomValue } from 'jotai/react'
import useStoreValue from './hooks/useStoreValue'
import { globalStore } from '@/stores'
import EditorTitle from './EditorTitle'
import { selectAtom } from 'jotai/utils'
import rebuildDragSelect from './utils/rebuildDragSelect'
import { ReadOnlyEditorAtom } from './hooks/useReadOnly'
import { CustomText } from '~/typings/editor/baseTypes'

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
  onEditorInstanceInitialized?: (i: EditorInstance) => void
  onHighlightDrag?: (highlightId: number, editor: CustomEditor) => void
  onHighlight?: (highlightId: number, editor: CustomEditor) => void
  initialValue?: Descendant[]
  id: string
  noteId?: number
  readonly?: boolean
  showTitle?: boolean
  onContentRendered?: (editor: CustomEditor) => void
  titleStyle?: CSSProperties
  titleContainerStyle?: CSSProperties
  title?: string | ReactNode
  titleEditable?: boolean
  innerEditorStyle?: CSSProperties
  showToolbar?: boolean
  onLinkClick?: InnerEditorProps['onLinkClick']
}
export interface IEditorRef {
  insertNode: (element: CustomElement) => void
  elementPropertyChange: (element: CustomElement) => void
  outerElementPropertyChange: (element: CustomElement) => void
  resetEditor: (value: Descendant[], title?: string) => void
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
    initialValue = initial,
    onEditorInitialized,
    showToolbar,
    title,
    onLinkClick,
    titleEditable,
    onHighlightDrag,
    onHighlight,
    onEditorInstanceInitialized
  }) => {
    const [isDragging, setIsDragging] = useIsDragging()
    const [globalIsDragging] = useGlobalIsDragging()
    const scrollElementRef = useRef<HTMLDivElement>(null)
    const [dragHandle, setDragHandle] = useState<DragHandleProps>()
    const emitter = useGlobalEventEmitter()
    const noteAtom = useMemo(() => (noteId ? selectAtom(notesAtom, n => n.get(noteId)) : atom(null)), [noteId])
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
      if (noteId) {
        fetchNoteById(noteId)
      }
    }, [noteId])

    // const { sharedType, doc, provider } = useMemo(() => {
    //   const doc = new Y.Doc()
    //   let provider
    //   if (!GlobalProviderMap.has(noteId)) {
    //     provider = new IndexeddbPersistence(String(noteId), doc)
    //     GlobalProviderMap.set(noteId, provider)
    //   } else {
    //     // share the same provider
    //     provider = GlobalProviderMap.get(noteId)
    //   }
    //   const sharedType = provider.doc.get('content', Y.XmlText)
    //   return { doc, provider, sharedType }
    // }, [noteId])

    const handler = (e: { type: string; data: any }) => {
      if (e.type === 'addMetaObject') {
        overlayManager.setContent('metaQuery')
        overlayManager.open()
      }
    }

    const editor = useMemo(() => {
      const editor = withVoid(
        withHtml(withCustomComponent(withShortcuts(withHandler(withEmitter(withHistory(withReact(createEditor())), emitter), handler))))
      )
      ID_TO_ELEMENTS_MAP.set(editor, new Map())
      SELECTED_BLOCKS_MAP.set(editor, new Map())
      onEditorInitialized?.(editor)
      return editor
    }, [])

    editor.onHighlight = id => onHighlight?.(id, editor)

    const editorInstance = useMemo(() => {
      const instance = {
        editor
      } as EditorInstance
      setTimeout(() => onEditorInstanceInitialized?.(instance))
      return instance
    }, [])

    editorInstance.goToHighlight = id => {
      const date = Date.now()
      const goTo = () => {
        const iter = Node.texts(editor)
        for (const value of iter) {
          if (value && 'highlight' in value[0] && value[0].highlight === id) {
            console.log(value, id)
            const [v, path] = value
            if (path) {
              console.log(editor.innerRef)
              editor.innerRef?.current.scrollTo(path[0])
            }
            break
          }
        }
      }
      const loop = () =>
        requestIdleCallback(() => {
          const curr = Date.now()
          // timeout: 1s
          if (curr - date > 1000) {
            return
          }
          if (editor.contentInitialized) {
            goTo()
          } else {
            loop()
          }
        })
      loop()
    }

    useLocalSyncValue(editor)

    useStoreValue(note, editor, onContentRendered)

    const { dragManager, renderIndicator } = useEditorDrag(editor, scrollElementRef.current)

    const { renderOverlay, overlayManager, popoverVisible } = useEditorOverlay(editor, scrollElementRef.current)

    useEditorSelect(editor, overlayManager, scrollElementRef.current)

    editor.id = id
    editor.noteId = noteId
    editor.readonly = !!readonly
    editor.onHighlightDrag = onHighlightDrag
    if (note) {
      editor.note = note
    }
    const handleBlockMouseMove = useMemoizedFn((e: MouseEvent, element: CustomElement) => {
      if (!isDragging && !globalIsDragging) {
        e.stopPropagation()
        if (element.type === 'table' && !(e.target as HTMLElement).hasAttribute('data-table-slot')) return
        editor.currentEnterElement = element
        editor.currentDragElement = e.currentTarget as HTMLElement
        dragManager.registerDragHtmlElement(e.currentTarget as HTMLElement)
        if (dragHandle?.targetId !== element.id || dragHandle?.visible === false) {
          const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          const left = targetRect.x - 5
          setDragHandle({
            left,
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
          {showTitle &&
            (typeof title === 'string' || typeof title === 'undefined' ? (
              <EditorTitle
                titleContainerStyle={titleContainerStyle}
                titleStyle={titleStyle}
                noteId={noteId}
                description={metaObject?.description}
                titleEditable={titleEditable !== false && !metaObject}
                title={title || metaObject?.name || note?.title || 'Untitled'}
              />
            ) : (
              title
            ))}
          <div
            role="inner-editor"
            className={styles.InnerEditorWrapper}
            style={{ padding: readonly ? '0px 50px' : undefined, '--block-bg': readonly ? 'none' : undefined, ...innerEditorStyle }}
          >
            <InnerEditor
              readonly={readonly}
              showToolbar={showToolbar}
              scrollElementRef={scrollElementRef}
              editor={editor}
              defaultValue={initialValue}
              onBlockMouseMove={handleBlockMouseMove}
              onLinkClick={onLinkClick}
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
          onDragClick={useCallback(
            e => {
              const selectedBlocksSet = SELECTED_BLOCKS_MAP.get(editor)
              if (selectedBlocksSet && selectedBlocksSet.size > 0) {
                GlobalDragOverlayInstance.addDragElements?.(rebuildDragSelect(editor, e) || document.createElement('div'))
              } else {
                const dragHTMLElement = editor.currentDragElement
                if (dragHTMLElement) {
                  const cloned = dragHTMLElement.cloneNode(true)
                  const rect = dragHTMLElement.getBoundingClientRect()
                  const wrapper = document.createElement('div')
                  wrapper.style.width = `${rect.width}px`
                  wrapper.style.height = `${rect.height}px`
                  wrapper.appendChild(cloned)
                  GlobalDragOverlayInstance.addDragElements?.(wrapper)
                }
              }
              GlobalDragOverlayInstance.setDraggingDetails?.(normalizeEditorDragBlocksToGlobalDraggingDetails(editor))
              GlobalDragOverlayInstance.startDrag?.()
            },
            [setIsDragging]
          )}
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
  useEffect(() => {
    store.set(ReadOnlyEditorAtom, props.readonly)
  }, [props.readonly])
  return (
    <Provider store={store}>
      <EditorV1 {...props} />
    </Provider>
  )
})
