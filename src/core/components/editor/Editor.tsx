import { useCapturePreviewImage, useClickOutside, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import Id from '@/utils/id'
import { FC, memo, MouseEventHandler, useCallback, useEffect, useMemo, useRef } from 'react'
import { createEditor } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from './slate-react'
import { CustomElement, EditorProps } from '~/typings'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import BlockHandle from './components/BlockHandle'
import useIsDragging from './hooks/useIsDragging'
import { withShortcuts, withCustomComponent, withHtml } from './plugins'
import { EDITOR_TO_CHANGED, ID_TO_ELEMENTS_MAP } from './weakMaps'
import { normalizeEditorDragBlocksToGlobalDraggingDetails } from './hooks/drag/useEditorDrag'
import { useGlobalIsDragging } from '@/core'
import { createStore } from 'jotai/vanilla'
import { Provider, useSetAtom } from 'jotai/react'
import EditorTitle from './EditorTitle'
import rebuildDragSelect from './utils/rebuildDragSelect'
import useEditorInstance, { EditorInstanceAtom } from './hooks/useEditorInstance'
import { Rendevoz } from '../../rendevoz'
import { Content } from '@/components'
import { waitFor } from '@/utils/functions'
import EditorRightBar from './components/EditorRightBar'
import { EditorStateAtom } from './hooks/useEditorState'
import SidebarToolbar from '@/scenes/editor/HoverOutline'
import { EditorBlockHandleAtom } from './hooks/useBlockHandle'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import useEditorPluginHooks from './hooks/useEditorPluginHooks'
import { GlobalPdfPrinterInstance } from '@/core/global/GlobalPdfPrinter'
import EditorHeader from '@/core/components/editor/EditorHeader'
import withColumns from '@/core/components/editor/plugins/withColumns'
import EditorClasses from '@/core/components/editor/consts/classes'
import useReadOnlyEditor from '@/core/components/editor/hooks/useReadOnly'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { DefaultEditorSettings } from '@/api/lifycycle/startup/initializeSettings'
import { default as Cla } from 'classnames'

// function, get unique id everytime
const defaultSlateValue = () => [
  {
    id: Id.getId(),
    type: 'paragraph',
    children: [{ text: '' }]
  }
]
const pageWidthToSize = {
  'X-Small': 500,
  Small: 650,
  Medium: 800,
  Large: 1000,
  'X-Large': 1200
}
/**
 * Editor core, controlled component / uncontrolled
 * Can be independent component outside Rendevoz
 * Slate can not be a controlled component, but we can manage to make that happen
 */
export const EditorV1: FC<EditorProps> = memo(
  ({
    id,
    onInstanceInitialized,
    on,
    onOperationApplied,
    defaultValue = defaultSlateValue(),
    readOnly,
    layout,
    state,
    title,
    onReadOnlyChange,
    stringTitle = 'Untitled',
    styles,
    initialScrollOffset,
    classNames,
    defaultReadOnly = false
  }) => {
    const [isDragging, setIsDragging] = useIsDragging()
    const [globalIsDragging] = useGlobalIsDragging()
    const scrollElementRef = useRef<HTMLDivElement>(null)
    const defaultEditorSetting = KeyvalueStore.useValue('editorSettings') || DefaultEditorSettings
    const setBlockHandle = useSetAtom(EditorBlockHandleAtom)
    const DragState = Rendevoz.Actions.State.Drag
    const setEditorState = useSetAtom(EditorStateAtom)
    const isDraggingDivider = useSelectAtomValue(EditorStateAtom, s => s.isDraggingDivider)

    useEffect(() => {
      const keyDownHandler = () => {
        setBlockHandle(s => (s.visible ? { ...s, visible: false } : s))
      }
      setEditorState(s => ({ ...s, readOnly: defaultReadOnly }))
      onInstanceInitialized?.(instance)
      document.addEventListener('keydown', keyDownHandler)
      return () => {
        document.removeEventListener('keydown', keyDownHandler)
      }
    }, [])

    useEffect(() => {
      if (readOnly !== undefined) {
        setEditorState(s => ({ ...s, readOnly }))
      }
    }, [readOnly])

    // readonly can be set innerly
    const realReadOnly = useReadOnlyEditor()

    useEffect(() => {
      if (readOnly !== undefined && realReadOnly !== readOnly) {
        onReadOnlyChange?.(!!realReadOnly)
      }
    }, [realReadOnly])

    const editorState = realReadOnly
      ? {
          typeface: state?.typeface || defaultEditorSetting.readerMode.typeface,
          fontSize: state?.fontSize || defaultEditorSetting.readerMode.fontSize,
          lineSpacing: state?.lineSpacing || defaultEditorSetting.readerMode.lineSpacing,
          pageWidth: state?.pageWidth || defaultEditorSetting.readerMode.pageWidth
        }
      : {
          typeface: state?.typeface || defaultEditorSetting.editMode.typeface,
          fontSize: state?.fontSize || defaultEditorSetting.editMode.fontSize,
          lineSpacing: state?.lineSpacing || defaultEditorSetting.editMode.lineSpacing,
          pageWidth: state?.pageWidth || defaultEditorSetting.editMode.pageWidth
        }
    const instance = useEditorInstance()
    const withInstance = e => {
      e.instance = instance
      return e
    }
    const editor = useMemo(() => {
      const editor = withVoid(
        withHtml(withCustomComponent(withShortcuts(withInstance(withColumns(withHistory(withReact(createEditor())))))))
      )
      ID_TO_ELEMENTS_MAP.set(editor, new Map())
      return editor
    }, [])

    const { dragManager, renderIndicator, renderOverlay, popoverVisible, overlayManager } = useEditorPluginHooks({
      editor,
      scrollElementRef
    })
    editor.onOperationApplied = onOperationApplied
    editor.id = id
    editor.instance = instance
    editor.initialScrollOffset = initialScrollOffset
    editor.on = event =>
      on?.({
        ...event,
        editor,
        instance
      })

    instance.printToPDF = () => {
      GlobalPdfPrinterInstance.print?.({ type: 'note', value: editor.children, title: stringTitle })
    }
    instance.getTitle = () => {
      return stringTitle
    }
    const handleBlockMouseMove = useMemoizedFn((e: MouseEvent, element: CustomElement) => {
      if (!globalIsDragging && !isDraggingDivider) {
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

    useClickOutside(() => {
      setBlockHandle(s => (s.visible === false ? s : { ...s, visible: false }))
    }, scrollElementRef)

    const { captureImage } = useCapturePreviewImage()

    // useLayoutEffect(() => {
    //   // return () => {
    //   setTimeout(() => {
    //     const str = Node.string(editor)
    //     if (str) {
    //       const node = scrollElementRef.current?.querySelector('[role="textbox"]')
    //       if (node) {
    //         const c = window.getComputedStyle(document.body).getPropertyValue('--global-background')
    //         captureImage(latestNote.current?.metaId, node, {
    //           width: 350,
    //           height: 350,
    //           backgroundColor: c
    //         })
    //       }
    //     }
    //   }, 1000)
    //   // }
    // }, [])
    return (
      <Content fullWidth fullHeight flex column style={styles?.outestContainerStyle}>
        {layout?.showHeader !== false && <EditorHeader title={stringTitle} editor={editor} />}
        <Content flex fullWidth auto style={{ height: styles?.containerHeight ?? 0 }}>
          {layout?.showHeader !== false && <SidebarToolbar editor={editor} />}
          <div className={EditorClasses.Editor} role="editor-container">
            <div
              ref={scrollElementRef}
              className={EditorClasses.ScrollWrapperClass}
              style={{
                '--editor-max-width': `${pageWidthToSize[editorState.pageWidth] || 800}px`,
                '--editable-line-height': editorState.lineSpacing,
                fontFamily: editorState.typeface || 'Inter',
                padding: styles?.pageMinPadding ?? '0px 40px 0px 60px'
              }}
            >
              {layout?.showTitle !== false && <EditorTitle stringTitle={stringTitle} {...title} editor={editor} />}
              <div
                role="inner-editor"
                className={Cla(EditorClasses.EditorWrapper, classNames?.editorContainerClassName)}
                style={{
                  paddingBottom: layout?.showBottomPadding === false ? 0 : undefined,
                  '--block-bg': realReadOnly ? 'none' : undefined,
                  '--font-size': editorState.fontSize,
                  fontSize: editorState.fontSize
                }}
              >
                <InnerEditor
                  defaultValue={defaultValue}
                  scrollElementRef={scrollElementRef}
                  editor={editor}
                  onChange={v => editor.on({ type: 'valueChange', value: v })}
                  onBlockMouseMove={(e, element) => {
                    throttleBlockMove.run(e, element)
                  }}
                  onBlockMouseLeave={e => {
                    if (e.pointerType === 'touch') {
                      return
                    }
                    setBlockHandle(s => ({ ...s, visible: false }))
                  }}
                />
              </div>
            </div>
            {renderOverlay()}
            {renderIndicator}
            {layout?.showBlockHandle !== false && (
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
                    normalizeEditorDragBlocksToGlobalDraggingDetails(instance).then(res => {
                      DragState.setDraggingDetails?.(res)
                      DragState.startDrag?.()
                    })
                  },
                  [setIsDragging]
                )}
                onMenuClick={handleMenuClick}
                outerVisible={!!(!isDragging && !popoverVisible && !realReadOnly)}
              />
            )}
          </div>
          {layout?.showHeader !== false && <EditorRightBar />}
        </Content>
      </Content>
    )
  }
)

export const Editor: FC<EditorProps> = memo(props => {
  const store = useMemo(() => {
    const store = createStore()
    store.set(EditorInstanceAtom, {
      values: {
        selectedBlocks: new Map()
      }
    })
    store.set(EditorStateAtom, { ...props })
    return store
  }, [])
  useEffect(() => {
    const currentState = store.get(EditorStateAtom)
    store.set(EditorStateAtom, { ...currentState, ...props })
  }, [props])
  return (
    <Provider store={store}>
      <EditorV1 {...props} />
    </Provider>
  )
})
