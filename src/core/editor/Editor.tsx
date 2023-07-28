import { useMemoizedFn } from '@/hooks'
import Id from '@/utils/id'
import { CSSProperties, FC, memo, MouseEventHandler, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'
import { createEditor, Descendant } from 'slate'
import { withHistory } from 'slate-history'
import { ReactEditor, withReact } from './slate-react'
import { CustomEditor, CustomElement, EditorProps, IEditorEvent, IEditorInstance } from '~/typings'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import styles from './index.module.less'
import BlockHandle from './components/BlockHandle'
import useIsDragging from './hooks/useIsDragging'
import { globalStore, MetaStore, ObjectStore } from '@/stores'
import withShortcuts from './plugins/withShortcuts'
import withCustomComponent from './plugins/withCustomComponent'
import withEmitter from './plugins/withEmitter'
import withHtml from './plugins/withHtml'
import { ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import { normalizeEditorDragBlocksToGlobalDraggingDetails } from './hooks/useEditorDrag'
import { useGlobalIsDragging } from '@/core'
import withHandler from './plugins/withHandler'
import { createStore } from 'jotai/vanilla'
import { Provider, useSetAtom } from 'jotai/react'
import EditorTitle from './EditorTitle'
import rebuildDragSelect from './utils/rebuildDragSelect'
import { ReadOnlyEditorAtom } from './hooks/useReadOnly'
import useEditorInstance, { EditorInstanceAtom } from './hooks/useEditorInstance'
import { Rendevoz } from '../rendevoz'
import { Content } from '@/components'
import { waitFor } from '@/utils/functions'
import EditorRightBar from './components/EditorRightBar'
import { EditorStateAtom } from './hooks/useEditorState'
import SidebarToolbar from '@/scenes/editor/HoverOutline'
import { EditorBlockHandleAtom } from './hooks/useBlockHandle'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import useEditorPluginHooks from './hooks/useEditorPluginHooks'
import { GlobalPdfPrinterInstance } from '@/core/global/GlobalPdfPrinter'
import EditorHeader from '@/core/editor/EditorHeader'
import { useAtom } from 'jotai'

const initial = [
  {
    id: Id.getId(),
    type: 'paragraph',
    children: [{ text: '' }]
  }
]

export const GlobalProviderMap = new Map()
export const EditorV1: FC<EditorProps> = memo(
  ({
    id,
    noteId,
    readonly,
    showTitle = true,
    titleContainerStyle,
    titleStyle,
    innerEditorStyle,
    initialValue = initial,
    showToolbar,
    title,
    titleEditable,
    stringTitle,
    type = 'note',
    showBlockHandle = true,
    onInstanceInitialized,
    compact,
    on,
    defaultReadOnly,
    innerEditorClassName,
    showHeader
  }) => {
    const [isDragging, setIsDragging] = useIsDragging()
    const [globalIsDragging] = useGlobalIsDragging()
    const scrollElementRef = useRef<HTMLDivElement>(null)
    const setBlockHandle = useSetAtom(EditorBlockHandleAtom)
    const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
    const note = ObjectStore('note').useValue(noteId)
    const DragState = Rendevoz.Actions.State.Drag
    const metaObject = MetaStore.useValue(note?.metaId || (note?.id && globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(note?.id)))
    const [editorState, setEditorState] = useAtom(EditorStateAtom)
    useEffect(() => {
      const keyDownHandler = () => {
        setBlockHandle(s => (s.visible ? { ...s, visible: false } : s))
      }
      waitFor(
        () => !!editor.contentInitialized,
        () => {
          onInstanceInitialized?.(instance)
        }
      )
      document.addEventListener('keydown', keyDownHandler)
      return () => {
        document.removeEventListener('keydown', keyDownHandler)
      }
    }, [])
    useEffect(() => {
      setEditorState(s => ({ ...s, outReadOnly: readonly }))
    }, [readonly])
    useEffect(() => {
      console.log('set state')
      setEditorState(s => ({ ...s, innerReadOnly: defaultReadOnly }))
    }, [defaultReadOnly])
    const readOnly = readonly || editorState.innerReadOnly
    console.log(readOnly, readonly, editorState.innerReadOnly, defaultReadOnly)
    const setReadOnlyEditor = useSetAtom(ReadOnlyEditorAtom)
    useEffect(() => {
      setReadOnlyEditor(readOnly)
    }, [readOnly])
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
      return editor
    }, [])

    const { dragManager, renderIndicator, renderOverlay, popoverVisible, overlayManager } = useEditorPluginHooks({
      editor,
      scrollElementRef,
      noteId
    })

    editor.type = type
    editor.id = id
    editor.noteId = noteId
    editor.readonly = !!readOnly
    editor.on = event =>
      on?.({
        ...event,
        editor,
        instance
      })

    const instance = useEditorInstance()

    const realTitle = stringTitle || metaObject?.name || note?.title || 'Untitled'

    instance.printToPDF = () => {
      GlobalPdfPrinterInstance.print?.({ type: 'note', noteId: noteId, title: realTitle })
    }
    instance.getTitle = () => {
      return realTitle
    }
    const handleBlockMouseMove = useMemoizedFn((e: MouseEvent, element: CustomElement) => {
      if (!globalIsDragging) {
        if (!e.currentTarget) return
        if (element.type === 'table' && !(e.target as HTMLElement).hasAttribute('data-table-slot')) return
        e.stopPropagation()
        editor.currentEnterElement = element
        editor.currentDragElement = e.currentTarget as HTMLElement
        dragManager.registerDragHtmlElement(e.currentTarget as HTMLElement)

        setBlockHandle(s => {
          if (s.targetId !== element.id || s.visible === false) {
            const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            let left = targetRect.x - 5
            if (element.type.startsWith('heading')) {
              left -= 20
            }
            return {
              ...s,
              left,
              top: targetRect.y,
              targetId: element.id,
              targetHeight: targetRect.height,
              visible: true
            }
          } else {
            return s
          }
        })
      }
    })

    const throttleBlockMove = useThrottleFn(handleBlockMouseMove, { wait: 10 })

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
      editor.on({
        type: 'titleChange',
        value: metaObject?.name || note?.title || 'Untitled'
      })
    }, [metaObject?.name, note?.title])

    return (
      <Content fullWidth fullHeight flex column>
        {showHeader !== false && <EditorHeader title={realTitle} />}
        <Content flex fullWidth auto style={{ height: 0 }}>
          {showHeader !== false && <SidebarToolbar editor={editor} />}
          <div className={styles.editor} role="editor-container">
            <div ref={scrollElementRef} className={styles.scrollWrapper}>
              {showTitle &&
                (typeof title === 'string' || typeof title === 'undefined' ? (
                  <EditorTitle
                    titleContainerStyle={titleContainerStyle}
                    titleStyle={titleStyle}
                    noteId={noteId}
                    description={metaObject?.description}
                    titleEditable={titleEditable !== false && (!metaObject || metaObject.type === 'note')}
                    title={title || metaObject?.name || note?.title || 'Untitled'}
                    editor={editor}
                  />
                ) : (
                  title
                ))}
              <div
                role="inner-editor"
                className={styles.InnerEditorWrapper}
                style={{
                  padding: readOnly ? '0px 20px' : undefined,
                  '--block-bg': readOnly ? 'none' : undefined,
                  ...innerEditorStyle
                }}
              >
                <InnerEditor
                  compact={compact}
                  readonly={readOnly}
                  showToolbar={showToolbar}
                  scrollElementRef={scrollElementRef}
                  editor={editor}
                  onChange={v => editor.on({ type: 'valueChange', value: v })}
                  defaultValue={initialValue}
                  onBlockMouseMove={(e, element) => {
                    e.stopPropagation()
                    throttleBlockMove.run(e, element)
                  }}
                  editorClassName={innerEditorClassName}
                  onBlockMouseLeave={useCallback(() => {
                    setBlockHandle(s => ({ ...s, visible: false }))
                  }, [])}
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
                    DragState.addDragElements?.(rebuildDragSelect(editor, e) || document.createElement('div'))
                  } else {
                    const dragHTMLElement = editor.currentDragElement
                    if (dragHTMLElement) {
                      const cloned = dragHTMLElement.cloneNode(true)
                      const rect = dragHTMLElement.getBoundingClientRect()
                      const wrapper = document.createElement('div')
                      wrapper.style.width = `${rect.width}px`
                      wrapper.style.height = `${rect.height}px`
                      wrapper.appendChild(cloned)
                      DragState.addDragElements?.(wrapper)
                    }
                  }
                  DragState.setDraggingDetails?.(normalizeEditorDragBlocksToGlobalDraggingDetails(editor))
                  DragState.startDrag?.()
                },
                [setIsDragging]
              )}
              onMenuClick={handleMenuClick}
              outerVisible={!!(!isDragging && !popoverVisible && !readonly && showBlockHandle)}
            />
          </div>
          {showHeader !== false && <EditorRightBar />}
        </Content>
      </Content>
    )
  }
)

export const Editor: FC<EditorProps> = memo(({ type = 'note', ...props }) => {
  const store = useMemo(() => {
    const store = createStore()
    store.set(EditorInstanceAtom, {})
    store.set(EditorStateAtom, { ...props, type })
    return store
  }, [])
  useEffect(() => {
    const currentState = store.get(EditorStateAtom)
    store.set(EditorStateAtom, { ...props, ...currentState, type })
  }, [props])
  return (
    <Provider store={store}>
      <EditorV1 {...props} type={type} />
    </Provider>
  )
})
