import { useCapturePreviewImage, useClickOutside, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import Id from '@/utils/id'
import { FC, memo, MouseEventHandler, useCallback, useEffect, useMemo, useRef } from 'react'
import { createEditor, Editor as SlateEditor, Path, Transforms } from 'slate'
import { withHistory } from 'slate-history'
import { ReactEditor, withReact } from './slate-react'
import { CustomElement, EditorProps } from '~/typings'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import BlockHandle from './components/BlockHandle'
import useIsDragging from './hooks/useIsDragging'
import { withShortcuts, withCustomComponent, withHtml } from './plugins'
import { ID_TO_ELEMENTS_MAP } from './weakMaps'
import { normalizeEditorDragBlocksToGlobalDraggingDetails } from './hooks/drag/useEditorDrag'
import { useGlobalIsDragging } from '@/core'
import { createStore } from 'jotai/vanilla'
import { Provider, useSetAtom } from 'jotai/react'
import EditorTitle from './EditorTitle'
import rebuildDragSelect from './utils/rebuildDragSelect'
import useEditorInstance, { EditorInstanceAtom } from './hooks/useEditorInstance'
import { Rendevoz } from '../../rendevoz'
import { Content } from '@/components'
import EditorRightBar from './components/EditorRightBar'
import { EditorStateAtom } from './hooks/useEditorState'
import SidebarToolbar from '@/scenes/editor/HoverOutline'
import { EditorBlockHandleAtom } from './hooks/useBlockHandle'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import useEditorPluginHooks from './hooks/EditorPluginHooks'
import { GlobalPdfPrinterInstance } from '@/core/global/GlobalPdfPrinter'
import EditorHeader from '@/core/components/editor/EditorHeader'
import withColumns from '@/core/components/editor/plugins/withColumns'
import EditorClasses from '@/core/components/editor/consts/classes'
import useReadOnlyEditor from '@/core/components/editor/hooks/useReadOnly'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { DefaultEditorSettings } from '@/api/lifycycle/startup/initializeSettings'
import { default as Cla } from 'classnames'
import { EditorBarStateAtom } from '@/core/components/editor/hooks/useEditorBarState'
import { useAtomValue } from 'jotai'
import EditorPluginHooks from './hooks/EditorPluginHooks'

// function, get unique id everytime
const defaultSlateValue = () => [
  {
    id: Id.getId(),
    type: 'paragraph',
    children: [{ text: '' }]
  }
]
const pageWidthToSize = {
  'X-Small': '500px',
  Small: '650px',
  Medium: '800px',
  Large: '1000px',
  'X-Large': '1200px',
  Max: '100%'
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
    defaultValue,
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
    const defaultV = useMemo(() => defaultSlateValue(), [])
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
        if (element.type === 'synced') return
        if (element.type === 'table' && !(e.target as HTMLElement).hasAttribute('data-table-slot')) return
        e.stopPropagation()
        editor.currentEnterElement = element
        editor.currentDragElement = e.currentTarget as HTMLElement
        instance.dragManager.registerDragHtmlElement(e.currentTarget as HTMLElement)
        setBlockHandle(s => {
          if (s.targetId !== element.id || s.visible === false) {
            const scrollEle = scrollElementRef.current!
            const scrollBounding = scrollEle.getBoundingClientRect()
            const scrollElementRect = {
              left: scrollEle.offsetLeft,
              top: scrollEle.offsetTop,
              width: scrollEle.offsetWidth,
              height: scrollEle.offsetHeight
            }
            const targetEle = e.currentTarget as HTMLElement
            const targetBounding = targetEle.getBoundingClientRect()
            const targetRect = {
              left: targetEle.offsetLeft,
              top: targetEle.offsetTop,
              width: targetEle.offsetWidth,
              height: targetEle.offsetHeight
            }
            const targetLeft = ((targetBounding.x - scrollBounding.x) / scrollBounding.width) * scrollElementRect.width
            const targetTop = ((targetBounding.y - scrollBounding.y) / scrollBounding.height) * scrollElementRect.height
            let left = targetLeft - 4
            let top = targetTop
            const targetLineHeight = parseInt(window.getComputedStyle(targetEle.firstElementChild).lineHeight)
            if (element.type.startsWith('heading')) {
              left -= 20
            }
            if (element.type === 'table') {
              left -= 12
            }
            top += (targetLineHeight - 24) / 2
            return {
              ...s,
              left,
              top,
              targetId: element.id,
              targetHeight: targetRect.height,
              visible: true,
              showAdd: layout?.showBlockHandleAdd !== false
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
      if (editor.currentAddClickElement) {
        const isCurrentElementEmpty =
          editor.currentAddClickElement.type === 'parapgraph' && SlateEditor.isEmpty(editor, editor.currentAddClickElement)
        const currentElementPath = instance.getElementPathById?.(editor.currentAddClickElement.id)

        if (currentElementPath) {
          if (!isCurrentElementEmpty) {
            Transforms.insertNodes(
              editor,
              {
                type: 'paragraph',
                id: Id.getId(),
                children: [{ text: '' }]
              },
              { at: Path.next(currentElementPath) }
            )
          }
          const finalPath = isCurrentElementEmpty ? currentElementPath : Path.next(currentElementPath)
          setTimeout(() => {
            Transforms.select(editor, SlateEditor.start(editor, finalPath))
            ReactEditor.focus(editor)
            const finalNodeBounding = ReactEditor.toDOMNode(editor, SlateEditor.node(editor, finalPath)[0]).getBoundingClientRect()
            instance.overlayOps?.open('blockHandleMenu', {
              x: finalNodeBounding.x,
              y: finalNodeBounding.y + finalNodeBounding.height / 2
            })
          })
        }
      }
    }

    const handleMenuClick: MouseEventHandler = e => {
      ID_TO_ELEMENTS_MAP.get(editor)?.get(editor.currentEnterElement!.id)?.selectBlock()
      editor.currentAddClickElement = editor.currentEnterElement
      setIsDragging(false)
      const rect = e.currentTarget.getBoundingClientRect()
      instance.overlayOps?.open('blockDetailsMenu', {
        x: rect.left + 15,
        y: rect.top
      })
    }

    useClickOutside(() => {
      setBlockHandle(s => (s.visible === false ? s : { ...s, visible: false }))
    }, scrollElementRef)

    const barState = useAtomValue(EditorBarStateAtom)
    return (
      <Content
        flex
        fullWidth
        auto
        column
        style={{
          height: styles?.containerHeight ?? '100%',
          maxHeight: styles?.containerMaxHeight,
          ...styles?.containerStyle
        }}
      >
        {layout?.showHeader !== false && <EditorHeader title={stringTitle} editor={editor} />}
        {layout?.showHeader !== false && <SidebarToolbar editor={editor} />}
        <div
          ref={scrollElementRef}
          className={EditorClasses.ScrollWrapperClass}
          role="editor-container"
          style={{
            '--editor-max-width': pageWidthToSize[editorState.pageWidth] || '800px',
            '--editable-line-height': editorState.lineSpacing,
            fontFamily: editorState.typeface || 'Inter',
            padding: styles?.pageMinPadding ?? '0px 40px 0px 60px',
            width: barState.showRightBar ? `calc(100% - ${barState.rightBarWidth || 340}px` : undefined
          }}
        >
          {layout?.showTitle !== false && <EditorTitle stringTitle={stringTitle} {...title} editor={editor} />}
          <div
            role="inner-editor"
            className={Cla(EditorClasses.EditorWrapper, classNames?.editorContainerClassName)}
            style={{
              // paddingBottom: layout?.showBottomPadding === false ? 0 : undefined,
              '--block-bg': realReadOnly ? 'none' : undefined,
              '--font-size': editorState.fontSize,
              fontSize: editorState.fontSize,
              position: 'relative'
            }}
          >
            <InnerEditor
              defaultValue={defaultValue || defaultV}
              scrollElementRef={scrollElementRef}
              editor={editor}
              onChange={useMemoizedFn(v => editor.on({ type: 'valueChange', value: v }))}
              onBlockMouseMove={useMemoizedFn((e, element) => {
                throttleBlockMove.run(e, element)
              })}
              onBlockMouseLeave={useMemoizedFn(e => {
                if (e.pointerType === 'touch') {
                  return
                }
                setBlockHandle(s => ({ ...s, visible: false }))
              })}
            />
          </div>
        </div>

        <EditorPluginHooks editor={editor} scrollElementRef={scrollElementRef} />
        {layout?.showBlockHandle !== false && (
          <BlockHandle
            containerRef={scrollElementRef}
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
            outerVisible={!!(!isDragging && !realReadOnly)}
          />
        )}
        {layout?.showHeader !== false && <EditorRightBar />}
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
