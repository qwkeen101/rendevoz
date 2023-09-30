import { useCapturePreviewImage, useClickOutside, useDebounceEffect, useMemoizedFn } from '@/hooks'
import Id from '@/utils/id'
import { FC, memo, MouseEventHandler, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { createEditor, Node } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from './slate-react'
import { CustomElement, EditorProps } from '~/typings'
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
import { ID_TO_ELEMENTS_MAP } from './weakMaps'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import { normalizeEditorDragBlocksToGlobalDraggingDetails } from './hooks/drag/useEditorDrag'
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
import withColumns from '@/core/editor/plugins/withColumns'
import { useLatest } from 'react-use'
import { Colors } from '@/consts'

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
    noBottomPadding,
    on,
    defaultReadOnly,
    innerEditorClassName,
    showHeader,
    toolbarOptions
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
      if (note && !note.metaId) {
        const noteMetaObject = Array.from(MetaStore.getMetaObjectsMap().values()).find(i => i.objectId === note.id)
        if (noteMetaObject) {
          ObjectStore('note').updateOne({ id: note.id, metaId: noteMetaObject.id })
        }
      }
    }, [note])
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
      setEditorState(s => ({ ...s, innerReadOnly: defaultReadOnly }))
    }, [defaultReadOnly])
    const readOnly = readonly || editorState.innerReadOnly

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
    const instance = useEditorInstance()
    const withInstance = e => {
      e.instance = instance
      return e
    }
    const editor = useMemo(() => {
      const editor = withVoid(
        withHtml(
          withCustomComponent(
            withShortcuts(withHandler(withInstance(withEmitter(withColumns(withHistory(withReact(createEditor()))), emitter)), handler))
          )
        )
      )
      ID_TO_ELEMENTS_MAP.set(editor, new Map())
      return editor
    }, [])

    const { dragManager, renderIndicator, renderOverlay, popoverVisible, overlayManager } = useEditorPluginHooks({
      editor,
      scrollElementRef,
      noteId
    })

    editor.type = type
    editor.editorMode = type
    editor.id = id
    editor.noteId = noteId
    editor.readonly = !!readOnly
    editor.note = note
    editor.instance = instance
    editor.noBottomPadding = noBottomPadding
    editor.on = event =>
      on?.({
        ...event,
        editor,
        instance
      })

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
            if (element.type === 'table') {
              left -= 12
            }
            // if (instance.toggleOps?.isTogglableElement(element) && instance.toggleOps?.haveToggledChildren(elementPath)) {
            //   left -= 10
            // }
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
      ID_TO_ELEMENTS_MAP.get(editor)?.get(editor.currentEnterElement!.id)?.selectBlock()
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
    useClickOutside(() => {
      setBlockHandle(s => (s.visible === false ? s : { ...s, visible: false }))
    }, scrollElementRef)
    const { captureImage } = useCapturePreviewImage()
    const latestNote = useLatest(note)
    useLayoutEffect(() => {
      // return () => {
      setTimeout(() => {
        const str = Node.string(editor)
        if (str) {
          const node = scrollElementRef.current?.querySelector('[role="textbox"]')
          if (node) {
            const c = window.getComputedStyle(document.body).getPropertyValue('--global-background')
            captureImage(latestNote.current?.metaId, node, {
              width: 350,
              height: 350,
              backgroundColor: c
            })
          }
        }
      }, 1000)
      // }
    }, [])
    return (
      <Content fullWidth fullHeight flex column>
        {showHeader !== false && <EditorHeader title={realTitle} />}
        <Content flex fullWidth auto style={{ height: 0 }}>
          {showHeader !== false && <SidebarToolbar editor={editor} />}
          <div className={styles.editor} role="editor-container">
            <div
              ref={scrollElementRef}
              className={styles.scrollWrapper}
              style={{
                '--editor-max-width': note?.width === 'full' ? '100%' : '800px'
              }}
            >
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
                  fontSize: note?.fontSize,
                  width: '100%',
                  ...innerEditorStyle
                }}
              >
                <InnerEditor
                  toolbarOptions={toolbarOptions}
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
                  onBlockMouseLeave={e => {
                    if (e.pointerType === 'touch') {
                      return
                    }
                    setBlockHandle(s => ({ ...s, visible: false }))
                  }}
                  editorClassName={innerEditorClassName}
                />
              </div>
            </div>
            {renderOverlay()}
            {renderIndicator}
            {showBlockHandle !== false && (
              <BlockHandle
                onAddClick={handleBlockHandleMenu}
                onDragClick={useCallback(
                  e => {
                    if (instance.values.selectedBlocks.size > 0) {
                      const rebuild = rebuildDragSelect(instance, e)
                      if (rebuild) {
                        DragState.addDragElements?.(rebuild)
                      }
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
                    DragState.setDraggingDetails?.(normalizeEditorDragBlocksToGlobalDraggingDetails(instance))
                    DragState.startDrag?.()
                  },
                  [setIsDragging]
                )}
                onMenuClick={handleMenuClick}
                outerVisible={!!(!isDragging && !popoverVisible && !readonly && showBlockHandle)}
              />
            )}
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
    store.set(EditorInstanceAtom, {
      values: {
        selectedBlocks: new Map()
      }
    })
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
