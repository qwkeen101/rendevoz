import { useMemoizedFn } from '@/hooks'
import Id from '@/utils/id'
import React, { CSSProperties, FC, memo, MouseEventHandler, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEditor, Transforms, Descendant } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from './slate-react'
import { CustomEditor, CustomElement, IEditorEvent, IEditorInstance } from '~/typings'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import styles from './index.module.less'
import BlockHandle from './components/BlockHandle'
import useIsDragging from './hooks/useIsDragging'
import { MetaStore, ObjectStore } from '@/stores'
import withShortcuts from './plugins/withShortcuts'
import withCustomComponent from './plugins/withCustomComponent'
import withEmitter from './plugins/withEmitter'
import withHtml from './plugins/withHtml'
import { ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'
import _ from 'lodash'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import useLocalSyncValue from './hooks/useSyncValue'
import useEditorDrag, { normalizeEditorDragBlocksToGlobalDraggingDetails } from './hooks/useEditorDrag'
import { useGlobalIsDragging } from '@/core'
import useEditorOverlay from './components/overlay/useEditorOverlay'
import withHandler from './plugins/withHandler'
import useEditorSelect from './hooks/useEditorSelect'
import { createStore } from 'jotai/vanilla'
import { Provider, useAtomValue } from 'jotai/react'
import useStoreValue from './hooks/useStoreValue'
import { globalStore } from '@/stores'
import EditorTitle from './EditorTitle'
import rebuildDragSelect from './utils/rebuildDragSelect'
import { ReadOnlyEditorAtom } from './hooks/useReadOnly'
import useEditorInstance, { EditorInstanceAtom, useAssignEditorInstance } from './hooks/useEditorInstance'
import { Rendevoz } from '../rendevoz'
import useAutoInsertEndline from './hooks/useAutoInsertEndline'
import EditorSearchPanel from '@/scenes/editor/Search'
import { EditorBarStateAtom } from './hooks/useEditorBarState'
import { Content } from '@/components'
import { waitFor } from '@/utils/functions'

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
  on?: (
    event: IEditorEvent & {
      editor: CustomEditor
      instance: IEditorInstance
    }
  ) => void
  initialValue?: Descendant[]
  id: string
  noteId?: number
  readonly?: boolean
  showTitle?: boolean
  onInstanceIntialized?: (instance: IEditorInstance) => void
  titleStyle?: CSSProperties
  titleContainerStyle?: CSSProperties
  title?: string | ReactNode
  titleEditable?: boolean
  innerEditorStyle?: CSSProperties
  innerEditorClassName?: string
  showToolbar?: boolean
  showBlockHandle?: boolean
  compact?: boolean
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
    showTitle = true,
    titleContainerStyle,
    titleStyle,
    innerEditorStyle,
    initialValue = initial,
    showToolbar,
    title,
    titleEditable,
    showBlockHandle = true,
    onInstanceIntialized,
    compact,
    on,
    innerEditorClassName
  }) => {
    const [isDragging, setIsDragging] = useIsDragging()
    const [globalIsDragging] = useGlobalIsDragging()
    const scrollElementRef = useRef<HTMLDivElement>(null)
    const [dragHandle, setDragHandle] = useState<DragHandleProps>()
    const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
    const noteAtom = ObjectStore('note').createAtom(noteId)
    const note = useAtomValue(noteAtom, { store: globalStore })
    const DragState = Rendevoz.Actions.State.Drag
    const metaObject = MetaStore.useValue(note?.metaId || (note?.id && globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(note?.id)))

    useEffect(() => {
      const keyDownHandler = () => {
        setDragHandle(h => (h?.visible ? { ...h, visible: false } : h))
      }
      document.addEventListener('keydown', keyDownHandler)
      return () => {
        document.removeEventListener('keydown', keyDownHandler)
      }
    }, [])

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

    useAutoInsertEndline(scrollElementRef, editor)

    const instance = useEditorInstance()

    editor.on = event =>
      on?.({
        ...event,
        editor,
        instance
      })

    useEffect(() => {
      waitFor(
        () => Object.keys(instance).length > 0,
        () => {
          onInstanceIntialized?.(instance)
        }
      )
    }, [])

    useLocalSyncValue(editor)

    useStoreValue(note, editor, e => {
      editor.on({ type: 'contentRetrieved' })
    })

    const { dragManager, renderIndicator } = useEditorDrag(editor, scrollElementRef.current)

    const { renderOverlay, overlayManager, popoverVisible } = useEditorOverlay(editor, scrollElementRef.current)

    useEditorSelect(editor, overlayManager, scrollElementRef.current)

    editor.overlayManager = overlayManager
    editor.id = id
    editor.noteId = noteId
    editor.readonly = !!readonly
    if (note) {
      editor.note = note
    }
    useAssignEditorInstance(editor)

    const handleBlockMouseMove = useMemoizedFn((e: MouseEvent, element: CustomElement) => {
      if (!isDragging && !globalIsDragging) {
        if (element.type === 'table' && !(e.target as HTMLElement).hasAttribute('data-table-slot')) return
        e.stopPropagation()
        editor.currentEnterElement = element
        editor.currentDragElement = e.currentTarget as HTMLElement
        dragManager.registerDragHtmlElement(e.currentTarget as HTMLElement)
        if (dragHandle?.targetId !== element.id || dragHandle?.visible === false) {
          const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          let left = targetRect.x - 5
          if (element.type.startsWith('heading')) {
            left -= 20
          }
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
      editor.on({ type: 'titleChange', value: metaObject?.name || note?.title || 'Untitled' })
    }, [metaObject?.name, note?.title])

    return (
      <Content flex fullWidth fullHeight>
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
              style={{ padding: readonly ? '0px 50px' : undefined, '--block-bg': readonly ? 'none' : undefined, ...innerEditorStyle }}
            >
              <InnerEditor
                compact={compact}
                readonly={readonly}
                showToolbar={showToolbar}
                scrollElementRef={scrollElementRef}
                editor={editor}
                onChange={v => editor.on({ type: 'valueChange', value: v })}
                defaultValue={initialValue}
                onBlockMouseMove={handleBlockMouseMove}
                editorClassName={innerEditorClassName}
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
            {...dragHandle}
            visible={!!(!isDragging && dragHandle?.visible && !popoverVisible && !readonly && showBlockHandle)}
          />
        </div>
        <EditorSearchPanel />
      </Content>
    )
  }
)

export const Editor: FC<EditorProps> = memo(props => {
  const store = useMemo(() => {
    const store = createStore()
    store.set(EditorInstanceAtom, {})
    return store
  }, [])
  useEffect(() => {
    store.set(ReadOnlyEditorAtom, props.readonly)
  }, [props.readonly])
  return (
    <Provider store={store}>
      <EditorV1 {...props} />
    </Provider>
  )
})
