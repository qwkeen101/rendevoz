import { useMemoizedFn } from '@/hooks'
import Id from './utils/id'
import { cloneElement, FC, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { createEditor } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from './slate-react'
import { CustomEditor, EditorProps } from '~/typings'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import BlockHandle from './components/BlockHandle'
import { withShortcuts, withCustomComponent, withHtml, withDeleteBackward } from './plugins'
import { GlobalSetting } from '@/core'
import { createStore } from 'jotai'
import { Provider, useSetAtom } from 'jotai/react'
import EditorTitle from './components/EditorTitle'
import useEditorInstance, { EditorInstanceAtom, EditorStoreContext } from './hooks/useEditorInstance'
import { EditorStateAtom } from './hooks/useEditorState'
import EditorHeader from '../components/EditorHeader'
import withNormalize from '../plugins/withNormalize'
import EditorClasses from '../consts/classes'
import useReadOnlyEditor from '../hooks/useReadOnly'
import EditorPluginHooks from './hooks/EditorPluginHooks'
import { t } from 'i18next'
import './editorStyles.less'
import EditorSidebar from '../components/sidebar/EditorSidebar'
import QuickLabelPopover from '../components/QuickLabelPopover'
import PageConfigContext from '@/core/components/PageConfigContext'
import EditorSearch from '../components/EditorSearch'
import trans from '@/consts/trans'
import classnames from 'classnames'

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

const EditorResizeObserver = new ResizeObserver(entries => {
  entries.forEach(i => {
    const ele = i.target as HTMLElement
    ele.style.setProperty('--editor-width', `${i.borderBoxSize[0].inlineSize}px`)
  })
})

export const EditorV1: FC<EditorProps> = memo(
  ({
    id,
    onInstanceInitialized,
    on,
    onOperationApplied,
    placeholder,
    defaultValue,
    classNames,
    readOnly,
    layout,
    onClick,
    textboxMode,
    state,
    title,
    plugins,
    onReadOnlyChange,
    stringTitle,
    styles,
    defaultReadOnly = false
  }) => {
    const scrollElementRef = useRef<HTMLDivElement>(null)
    const innerEditorRef = useRef<HTMLDivElement>(null)
    const defaultV = useMemo(() => defaultSlateValue(), [])
    const userSetting = GlobalSetting.useSelectSettingAtom('editorSettings')
    const setEditorState = useSetAtom(EditorStateAtom)
    const instance = useEditorInstance()
    instance.values.scrollElementRef = scrollElementRef
    const pageConfig = useContext(PageConfigContext)
    useLayoutEffect(() => {
      const scrollEle = scrollElementRef.current
      if (scrollEle) {
        EditorResizeObserver.observe(scrollEle)
      }
      setEditorState(s => ({ ...s, readOnly: defaultReadOnly }))
      return () => {
        if (scrollEle) {
          EditorResizeObserver.unobserve(scrollEle)
        }
      }
    }, [])

    useEffect(() => {
      if (readOnly !== undefined) {
        setEditorState(s => ({ ...s, readOnly }))
      }
    }, [readOnly])

    const editor = useMemo(() => {
      const withInstance = (e: CustomEditor) => {
        e.instance = instance
        return e
      }
      const editor = withVoid(
        withHtml(
          withDeleteBackward(withCustomComponent(withShortcuts(withInstance(withNormalize(withHistory(withReact(createEditor())))))))
        )
      )
      onInstanceInitialized?.(instance)
      editor.nodeToDecorations = new Map()
      return editor
    }, [])

    editor.onOperationApplied = onOperationApplied
    editor.id = id
    editor.instance = instance
    instance.editor = editor
    instance.on = async event =>
      on?.({
        ...event,
        editor,
        instance
      })
    instance.getTitle = () => {
      return stringTitle || t(trans.Untitled)
    }
    const memoedOnChange = useMemoizedFn(v => instance.on({ type: 'valueChange', value: v }))
    const finalValue = defaultValue || defaultV
    if (textboxMode) {
      if (layout?.emptyPlaceholder) {
        if (!finalValue.length || finalValue.every(i => instance.blockOps?.isBlockEmpty(i))) {
          return layout.emptyPlaceholder
        }
      }
      return (
        <>
          <EditorPluginHooks plugins={plugins} editor={editor} scrollElementRef={scrollElementRef} />
          <InnerEditor
            onClick={onClick}
            textareaMode
            editorClassName={classNames?.editorContainerClassName}
            style={{
              '--editor-max-width': '100%',
              '--block-bg': 'none',
              position: 'relative',
              width: 'var(--editor-max-width)',
              outline: 'none',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              lineHeight: state?.lineSpacing ?? 1.57,
              '--placeholder': `"${layout?.firstLinePlaceholder ?? placeholder ?? t('editor.Type for commands')}"`,
              fontSize: state?.fontSize ?? 14,
              ...styles?.containerStyle
            }}
            defaultValue={defaultValue || defaultV}
            scrollElementRef={scrollElementRef}
            editor={editor}
            onChange={memoedOnChange}
          />
        </>
      )
    }
    const showHeader = layout?.showHeader !== false && pageConfig.editorHeader !== false
    const editorState = {
      fontSize: state?.fontSize || userSetting.fontSize,
      lineSpacing: state?.lineSpacing || userSetting.lineSpacing,
      pageWidth: state?.pageWidth || userSetting.pageWidth
    }
    // readonly can be set innerly
    const realReadOnly = useReadOnlyEditor()
    useEffect(() => {
      if (readOnly !== undefined && realReadOnly !== readOnly) {
        onReadOnlyChange?.(!!realReadOnly)
      }
    }, [realReadOnly])
    if (layout?.emptyPlaceholder) {
      if (!finalValue.length || finalValue.every(i => instance.blockOps?.isBlockEmpty(i))) {
        return layout.emptyPlaceholder
      }
    }
    return cloneElement(
      showHeader ? <div></div> : <></>,
      {
        className: 'flex w-full h-full'
      },
      <>
        <EditorPluginHooks editor={editor} scrollElementRef={scrollElementRef} />
        <QuickLabelPopover />
        <div
          onClick={onClick}
          className={'flex flex-col relative flex-1 overflow-hidden'}
          style={{
            height: styles?.containerHeight ?? '100%',
            maxHeight: styles?.containerMaxHeight,
            ...styles?.containerStyle
          }}
        >
          {showHeader && <EditorHeader title={stringTitle} editor={editor} />}
          <div
            ref={scrollElementRef}
            className={classnames(EditorClasses.ScrollWrapperClass, classNames?.editorContainerClassName)}
            role="editor-container"
            style={{
              '--editor-padding-left': styles?.pageMinPadding ?? (readOnly || pageConfig.editorAdd === false ? '35px' : '60px'),
              paddingLeft: 'var(--editor-padding-left)',
              paddingRight: styles?.pageMinPadding ?? (readOnly || pageConfig.editorAdd === false ? '35px' : '35px'),
              '--editor-max-width': pageWidthToSize[editorState.pageWidth] || '800px',
              fontSize: editorState.fontSize,
              '--placeholder': `"${layout?.firstLinePlaceholder ?? placeholder ?? t('editor.Type for commands')}"`,
              ...styles?.editorContainerStyle
            }}
          >
            {layout?.showTitle !== false && (
              <EditorTitle
                {...title}
                titleContainerStyle={{
                  padding: showHeader ? '3.2em 0 0.6em' : '1em 0 0.25em',
                  ...title?.titleContainerStyle
                }}
                showProps={layout?.showProps}
                propsMetaId={layout?.propsMetaId}
                stringTitle={stringTitle}
                editor={editor}
              />
            )}
            <div
              style={{
                maxWidth: 'var(--editor-max-width)',
                lineHeight: editorState.lineSpacing
              }}
              className={'w-full shrink-0'}
            >
              <InnerEditor
                defaultValue={defaultValue || defaultV}
                scrollElementRef={scrollElementRef}
                editor={editor}
                ref={innerEditorRef}
                onChange={memoedOnChange}
              />
            </div>
          </div>
          {layout?.showBlockHandle !== false && <BlockHandle editor={editor} scrollElementRef={scrollElementRef} />}
        </div>
        {showHeader && (
          <>
            <EditorSidebar />
            <EditorSearch />
          </>
        )}
      </>
    )
  }
)

export const Editor: FC<EditorProps> = memo(props => {
  const pageConfig = useContext(PageConfigContext)
  const defaultOpenSidebar = pageConfig.defaultOpenSidebar !== false
  const store = useMemo(() => {
    const store = createStore()
    store.set(EditorInstanceAtom, {
      values: {
        selectedBlocks: new Map(),
        editorLevelStore: store,
        displayMode: props.layout?.displayMode,
        ID_TO_ELEMENT: new Map(),
        ID_TO_PATH: new Map()
      }
    })
    const current = store.get(EditorStateAtom)
    store.set(EditorStateAtom, {
      ...current,
      ...props,
      sidebarActive: props.state?.defaultActiveSidebar ?? current.sidebarActive,
      sidebarVisible: defaultOpenSidebar ? props.state?.defaultSidebarVisible ?? current.sidebarVisible : current.sidebarVisible
    })
    return store
  }, [])
  useEffect(() => {
    store.set(EditorStateAtom, { ...store.get(EditorStateAtom), ...props })
  }, [props])
  return (
    <Provider store={store}>
      <EditorStoreContext.Provider value={store}>
        <EditorV1 {...props} />
      </EditorStoreContext.Provider>
    </Provider>
  )
})
