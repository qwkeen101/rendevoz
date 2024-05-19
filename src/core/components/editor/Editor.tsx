import { useClickOutside, useGlobalAtomValue, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import Id from '@/utils/id'
import { FC, memo, MouseEventHandler, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { createEditor, Editor as SlateEditor, Path, Transforms } from 'slate'
import { HistoryEditor, withHistory } from 'slate-history'
import { ReactEditor, withReact } from './slate-react'
import { EditorProps } from '~/typings'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import BlockHandle from './components/BlockHandle'
import useIsDragging from './hooks/useIsDragging'
import { withShortcuts, withCustomComponent, withHtml } from './plugins'
import { ID_TO_ELEMENTS_MAP } from './weakMaps'
import { normalizeEditorDragBlocksToGlobalDraggingDetails } from './hooks/drag/useEditorDrag'
import { enableCustomEditorStateAtom, useGlobalIsDragging } from '@/core'
import { createStore } from 'jotai/vanilla'
import { Provider, useSetAtom } from 'jotai/react'
import EditorTitle from './EditorTitle'
import rebuildDragSelect from './utils/rebuildDragSelect'
import useEditorInstance, { EditorInstanceAtom, EditorStoreContext } from './hooks/useEditorInstance'
import { Rendevoz } from '../../rendevoz'
import { Content } from '@/components'
import { EditorStateAtom } from './hooks/useEditorState'
import { EditorBlockHandleAtom } from './hooks/useBlockHandle'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import EditorHeader from '@/core/components/editor/EditorHeader'
import withNormalize from '@/core/components/editor/plugins/withNormalize'
import EditorClasses from '@/core/components/editor/consts/classes'
import useReadOnlyEditor from '@/core/components/editor/hooks/useReadOnly'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { DefaultEditorSettings } from '@/api/lifycycle/initializeApp/initializeSettings'
import { default as Cla } from 'classnames'
import { EditorBarStateAtom } from '@/core/components/editor/hooks/useEditorBarState'
import { useAtomValue } from 'jotai'
import EditorPluginHooks from './hooks/EditorPluginHooks'
import { t } from 'i18next'
import GetEditorBlockHandle from '@/core/components/editor/hooks/getEditorBlockHandle'
import './editorStyles.less'
import EditorSidebar from '@/core/components/editor/components/sidebar/EditorSidebar'
import QuickLabelPopover from '@/core/components/editor/components/QuickLabelPopover'
import PageConfigContext from '@/core/components/PageConfigContext'

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
    placeholder,
    defaultValue,
    readOnly,
    layout,
    onClick,
    textboxMode,
    state,
    title,
    onReadOnlyChange,
    stringTitle = 'Untitled',
    styles,
    initialScrollOffset,
    classNames,
    defaultReadOnly = false
  }) => {
    const barState = useAtomValue(EditorBarStateAtom)
    const [isDragging, setIsDragging] = useIsDragging()
    const [globalIsDragging] = useGlobalIsDragging()
    const scrollElementRef = useRef<HTMLDivElement>(null)
    const defaultV = useMemo(() => defaultSlateValue(), [])
    const enableCustomFormat = useGlobalAtomValue(enableCustomEditorStateAtom)
    const userSetting = KeyvalueStore.useValue('editorSettings')
    const defaultEditorSetting = enableCustomFormat ? userSetting || DefaultEditorSettings : DefaultEditorSettings
    const setBlockHandle = useSetAtom(EditorBlockHandleAtom)
    const DragState = Rendevoz.Actions.State.Drag
    const setEditorState = useSetAtom(EditorStateAtom)
    const isDraggingDivider = useSelectAtomValue(EditorStateAtom, s => s.isDraggingDivider)
    const instance = useEditorInstance()
    const sidebarVisible = barState.sidebarActive !== 'hide'
    const pageConfig = useContext(PageConfigContext)
    useEffect(() => {
      if (textboxMode !== undefined) {
        setEditorState(s => ({ ...s, textboxMode }))
      }
    }, [textboxMode])
    useLayoutEffect(() => {
      const scrollEle = scrollElementRef.current
      const resizeObserver = new ResizeObserver(c => {
        const entry = c[0]
        if (scrollEle) {
          scrollEle.style.setProperty('--editor-padding-left', window.getComputedStyle(scrollEle)?.paddingLeft)
        }
        scrollElementRef.current?.style.setProperty('--editor-width', `${entry.borderBoxSize[0].inlineSize}px`)
      })

      if (scrollEle) {
        resizeObserver.observe(scrollEle)
      }
      const keyDownHandler = () => {
        setBlockHandle(s => (s.visible ? { ...s, visible: false } : s))
      }
      setEditorState(s => ({ ...s, readOnly: defaultReadOnly }))
      document.addEventListener('keydown', keyDownHandler)
      return () => {
        resizeObserver.disconnect()
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

    const withInstance = e => {
      e.instance = instance
      return e
    }
    const editor = useMemo(() => {
      const editor = withVoid(
        withHtml(withCustomComponent(withShortcuts(withInstance(withNormalize(withHistory(withReact(createEditor())))))))
      )
      ID_TO_ELEMENTS_MAP.set(editor, new Map())
      onInstanceInitialized?.(instance)
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
      let enV = true
      setEditorState(s => {
        enV = s.layout?.virtualizer ?? true
        return {
          ...s,
          layout: {
            ...s.layout,
            virtualizer: false
          }
        }
      })
      setTimeout(() => {
        const ele = scrollElementRef.current!
        const p = ele.parentElement!
        document.body.appendChild(ele)
        const originalTheme = document.documentElement.getAttribute('theme')
        document.documentElement.setAttribute('theme', 'light')
        document.documentElement.classList.add('print-editor')
        const afterPrint = () => {
          document.documentElement.classList.remove('print-editor')
          document.documentElement.setAttribute('theme', originalTheme || 'light')
          p.appendChild(ele)
          setEditorState(s => ({ ...s, layout: { ...s.layout, virtualizer: enV } }))
          window.removeEventListener('afterprint', afterPrint)
        }
        window.addEventListener('afterprint', afterPrint)
        window.print()
      })
    }
    instance.getTitle = () => {
      return stringTitle
    }
    const handleContainerPointerMove = useMemoizedFn((e: PointerEvent) => {
      if (!globalIsDragging && !isDraggingDivider && !readOnly) {
        if (!e.currentTarget) return
        if (!scrollElementRef.current?.contains(e.target)) {
          setBlockHandle(s => ({ ...s, visible: false }))
          return
        }
        const result = GetEditorBlockHandle(e, instance, editor)
        if (!result) {
          setBlockHandle(s => ({ ...s, visible: false }))
          return
        }
        const element = result.element
        editor.currentEnterElement = element
        const targetEle =
          (result.node.classList.contains('selectable') ? result.node : result.node.querySelector('.selectable')) || result.node
        if (!targetEle) return
        setBlockHandle(s => {
          const scrollEle = scrollElementRef.current!
          const scrollBounding = scrollEle.getBoundingClientRect()
          const scrollElementRect = {
            left: scrollEle.offsetLeft,
            top: scrollEle.offsetTop,
            width: scrollEle.offsetWidth,
            height: scrollEle.offsetHeight
          }
          const targetBounding = targetEle.getBoundingClientRect()
          const targetRect = {
            left: targetEle.offsetLeft,
            top: targetEle.offsetTop,
            width: targetEle.offsetWidth,
            height: targetEle.offsetHeight
          }
          const targetLeft = ((targetBounding.x - scrollBounding.x) / scrollBounding.width) * scrollElementRect.width
          const targetTop = ((targetBounding.y - scrollBounding.y) / scrollBounding.height) * scrollElementRect.height + scrollEle.scrollTop
          let left = targetLeft - 4
          let top = targetTop
          const targetLineHeight = parseInt(window.getComputedStyle(targetEle.firstElementChild).lineHeight)
          if (element.type.startsWith('heading')) {
            left -= 20
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
        })
      }
    })

    const throttleBlockMove = useThrottleFn(handleContainerPointerMove, { wait: 10 })

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
      if (editor.currentEnterElement) {
        instance.selectOps?.selectBlock(editor.currentEnterElement.id)
        editor.currentAddClickElement = editor.currentEnterElement
        setIsDragging(false)
        const rect = e.currentTarget.getBoundingClientRect()
        instance.overlayOps?.open('blockDetailsMenu', {
          x: rect.left + 15,
          y: rect.top
        })
      }
    }

    !textboxMode &&
      useClickOutside(() => {
        setBlockHandle(s => (s.visible === false ? s : { ...s, visible: false }))
      }, scrollElementRef)

    if (textboxMode) {
      return (
        <>
          <EditorPluginHooks editor={editor} scrollElementRef={scrollElementRef} />
          <div
            onClick={onClick}
            ref={scrollElementRef}
            role="editor-container"
            style={{
              '--placeholder': `"${placeholder ?? t('editor.Type for commands')}"`,
              '--editable-line-height': editorState.lineSpacing,
              fontFamily: editorState.typeface || 'Inter',
              '--font-size': editorState.fontSize,
              ...styles?.containerStyle
            }}
          >
            <InnerEditor
              style={{
                '--block-bg': realReadOnly ? 'none' : undefined,
                fontSize: editorState.fontSize,
                position: 'relative',
                width: 'var(--editor-max-width)',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}
              editorClassName={classNames?.editorContainerClassName}
              defaultValue={defaultValue || defaultV}
              scrollElementRef={scrollElementRef}
              editor={editor}
              onChange={useMemoizedFn(v => editor.on({ type: 'valueChange', value: v }))}
            />
          </div>
        </>
      )
    }
    return (
      <>
        {layout?.showHeader !== false && pageConfig.editorHeader !== false && <EditorSidebar />}
        <EditorPluginHooks editor={editor} scrollElementRef={scrollElementRef} />
        <QuickLabelPopover />
        <Content
          flex
          auto
          onClick={onClick}
          column
          style={{
            height: styles?.containerHeight ?? '100%',
            maxHeight: styles?.containerMaxHeight,
            width: sidebarVisible ? `calc(100% - ${barState.sidebarWidth}px` : '100%',
            marginLeft: sidebarVisible ? barState.sidebarWidth : undefined,
            ...styles?.containerStyle
          }}
        >
          {layout?.showHeader !== false && pageConfig.editorHeader !== false && <EditorHeader title={stringTitle} editor={editor} />}
          <div
            ref={scrollElementRef}
            onPointerMove={e => {
              throttleBlockMove.run(e)
            }}
            className={EditorClasses.ScrollWrapperClass}
            role="editor-container"
            style={{
              '--placeholder': `"${placeholder ?? t('editor.Type for commands')}"`,
              '--editor-max-width': pageWidthToSize[editorState.pageWidth] || '800px',
              '--editable-line-height': editorState.lineSpacing,
              fontFamily: editorState.typeface || 'Inter',
              '--page-padding': styles?.pageMinPadding ?? readOnly ? '0px 40px' : '0px 40px 0px 60px',
              padding: 'var(--page-padding)',
              '--font-size': editorState.fontSize,
              ...styles?.editorContainerStyle
            }}
          >
            {layout?.showTitle !== false && (
              <EditorTitle
                showProps={layout?.showProps}
                propsMetaId={layout?.propsMetaId}
                stringTitle={stringTitle}
                {...title}
                editor={editor}
              />
            )}
            <div
              className={Cla(EditorClasses.EditorWrapper, classNames?.editorContainerClassName)}
              style={{
                '--block-bg': realReadOnly ? 'none' : undefined,
                fontSize: editorState.fontSize,
                position: 'relative'
              }}
            >
              <InnerEditor
                defaultValue={defaultValue || defaultV}
                scrollElementRef={scrollElementRef}
                editor={editor}
                onChange={useMemoizedFn(v => editor.on({ type: 'valueChange', value: v }))}
              />
            </div>
          </div>

          {layout?.showBlockHandle !== false && (
            <BlockHandle
              containerRef={scrollElementRef}
              onAddClick={handleBlockHandleMenu}
              onDragClick={useCallback(
                e => {
                  HistoryEditor.withoutSaving(editor, () => {
                    Transforms.deselect(editor)
                  })
                  if (instance.values.selectedBlocks.size > 0) {
                    const rebuild = rebuildDragSelect(instance, e)
                    if (rebuild) {
                      DragState.addDragElements?.(rebuild)
                    }
                  } else {
                    const dragElement = editor.currentEnterElement
                    if (dragElement) {
                      const dragDOM = ReactEditor.toDOMNode(editor, dragElement)
                      const cloned = dragDOM.cloneNode(true)
                      const rect = dragDOM.getBoundingClientRect()
                      const wrapper = document.createElement('div')
                      wrapper.style.width = `${rect.width}px`
                      wrapper.style.height = `${rect.height}px`
                      wrapper.appendChild(cloned)
                      wrapper.classList.add('disable-all-pointer-events')
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
        </Content>
      </>
    )
  }
)

export const Editor: FC<EditorProps> = memo(props => {
  const defaultSidebarChanged = useRef(false)
  const store = useMemo(() => {
    const store = createStore()
    store.set(EditorInstanceAtom, {
      values: {
        selectedBlocks: new Map(),
        editorLevelStore: store,
        labelNoteRendered: new Set()
      }
    })
    store.set(EditorStateAtom, { ...props })
    if (props.state?.defaultActiveSidebar) {
      defaultSidebarChanged.current = true
      const defaultProps = store.get(EditorBarStateAtom)
      store.set(EditorBarStateAtom, {
        ...defaultProps,
        sidebarActive: props.state.defaultActiveSidebar ?? defaultProps.sidebarActive
      })
    }
    return store
  }, [])
  useEffect(() => {
    const currentState = store.get(EditorStateAtom)
    store.set(EditorStateAtom, { ...currentState, ...props })
    if (props.state?.defaultActiveSidebar && !defaultSidebarChanged.current) {
      defaultSidebarChanged.current = true
      const defaultProps = store.get(EditorBarStateAtom)
      store.set(EditorBarStateAtom, {
        ...defaultProps,
        sidebarActive: props.state.defaultActiveSidebar ?? defaultProps.sidebarActive
      })
    }
  }, [props])
  return (
    <Provider store={store}>
      <EditorStoreContext.Provider value={store}>
        <EditorV1 {...props} />
      </EditorStoreContext.Provider>
    </Provider>
  )
})
