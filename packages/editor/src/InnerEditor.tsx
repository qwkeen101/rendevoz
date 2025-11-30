import { useDebounceFn, useMemoizedFn } from '@/hooks'
import isHotkey from 'is-hotkey'
import { CSSProperties, forwardRef, memo, RefObject, useCallback, useLayoutEffect, useRef } from 'react'
import { Descendant, Editor, Node, NodeEntry, Path, Transforms } from 'slate'
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate } from './slate-react'
import EditorToolbar, { ToolbarConfig } from './components/EditorSelectionToolbar'
import HOTKEYS from './consts/hotkeys'
import { CustomEditor, IEditorInstance } from '~/typings'
import Divider from './components/Divider'
import { Block, Leaf } from './elements'
import Id from './utils/id'
import { useEditorComposing } from './slate-react/components/editable'
import classNames from 'classnames'
import { useGlobalIsDragging } from '../../global'
import useEditorInstance from './hooks/useEditorInstance'
import useReadOnlyEditor from '../hooks/useReadOnly'
import { assignProperties } from '../utils'
import { EditorStateAtom } from '../hooks/useEditorState'
import { selectAtom } from 'jotai/utils'
import { useAtomValue } from 'jotai/react'
import DecorationHelper from '../DecorationHelper'
import useIsSelecting from '../hooks/useIsSelecting'
import handleInsertMetasIntoEditor from '../hooks/handleInsertMetasIntoEditor'
import useEditorKeyEvents from '../hooks/keyboards/useEditorKeyEvents'
import EditorElements from '../elements/EditorElements'
import './textareaEditor.less'

export type InnerEditorProps = {
  editor: CustomEditor
  defaultValue: Descendant[]
  scrollElementRef?: RefObject<HTMLDivElement | null>
  onChange?: (value: Descendant[]) => void
  editorClassName?: string
  style?: CSSProperties
  textareaMode?: boolean
  onClick?: React.MouseEventHandler
  toolbarConfig?: import('./components/EditorSelectionToolbar').ToolbarConfig
  onToolbarEvent?: (event: { action: string }) => void
}
const editorState = selectAtom(EditorStateAtom, s => ({
  alwaysShowPlaceholder: s.layout?.alwaysShowPlaceholder,
  showToolbar: s.layout?.showToolbar,
  firstLinePlaceholder: s.layout?.firstLinePlaceholder
}))

const Element = (props: RenderElementProps) => {
  const renderer = EditorElements[props.element.type]?.renderElement
  if (!renderer) return null
  return renderer(props)
}
const renderInnerElement = (props: RenderElementProps) => <Element {...props} />
const renderLeaf = (props: RenderLeafProps) => <Leaf {...props} />
const InnerEditor = memo(
  forwardRef<HTMLDivElement, InnerEditorProps>(
    ({ editor, defaultValue, style, onChange, onClick, scrollElementRef, editorClassName, textareaMode, toolbarConfig, onToolbarEvent }, ref) => {
      const scrollElement = scrollElementRef?.current
      const previousValue = useRef<Descendant[]>()
      const readOnly = useReadOnlyEditor()
      const instance = useEditorInstance()
      const handleKeyEvents = useEditorKeyEvents(instance)
      const { alwaysShowPlaceholder, showToolbar, firstLinePlaceholder } = useAtomValue(editorState)
      const isComposing = useEditorComposing()
      const [isSelecting] = useIsSelecting()
      const [isGlobalDragging] = useGlobalIsDragging()
      const index = () => {
        instance.values.ID_TO_PATH.clear()
        for (const [node, path] of Node.elements(editor)) {
          node.id && instance.values.ID_TO_PATH.set(node.id, path)
        }
      }
      const { run: debounceIndex } = useDebounceFn(
        () => {
          index()
        },
        { wait: 500 }
      )
      assignProperties(instance, {
        indexPath: () => {
          index()
        }
      })

      const handleChange = useMemoizedFn((value: Descendant[]) => {
        if (value.length === 0) {
          Transforms.insertNodes(editor, { type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }, { at: [0] })
          return
        }
        let shouldChange = false
        // already trigger change, early exit
        if (editor.changeHandled) return
        editor.changeHandled = true
        if (!(editor.operations.length === 1 && editor.operations[0].type === 'set_selection')) {
          // normalize first layer ids to prevent path conflicts
          const allFirstLayerIds = new Set<number>()
          editor.children.forEach((i, idx) => {
            if (!('id' in i) || allFirstLayerIds.has(i.id)) {
              Transforms.setNodes(editor, { id: Id.getId() }, { at: [idx] })
            } else {
              allFirstLayerIds.add(i.id)
            }
          })
          instance.emitEvent?.('valueChange')
          shouldChange = true
        }
        const prevValue = previousValue.current
        previousValue.current = value
        if (prevValue !== value) {
          if (editor.operations.some(i => Path.operationCanTransformPath(i))) {
            debounceIndex()
          }
        }
        if (shouldChange) {
          if (value !== defaultValue) {
            onChange?.(value)
          }
        }
      })
      const renderElement = useCallback(
        ({ children, element, attributes }: RenderElementProps) => {
          if (element.hide === true) return null
          if (element.type === 'columnList') {
            return (
              <Block
                data-type="block"
                key={element.id}
                data-spec-type="columnList"
                id={String(element.id)}
                type="columnList"
                element={element}
                attributes={attributes}
                isSelecting={isSelecting}
              >
                {children}
              </Block>
            )
          }
          if (element.type === 'column') {
            return (
              <>
                <Divider currentPath={ReactEditor.findPath(editor, element)} />
                <Block
                  data-type="column"
                  id={String(element.id)}
                  key={element.id}
                  ratio={element.ratio}
                  data-spec-type="column"
                  element={element}
                  type="column"
                  attributes={attributes}
                >
                  {children}
                </Block>
              </>
            )
          }
          if (!Editor.isInline(editor, element) && !['tableRow', 'tableCell'].includes(element.type)) {
            return (
              <Block
                data-type="block"
                data-spec-type={element.type}
                key={element.id}
                id={String(element.id)}
                element={element}
                attributes={attributes}
                type={element.type}
                isGlobalDragging={isGlobalDragging}
                alwaysShowPlaceholder={alwaysShowPlaceholder}
                firstLinePlaceholder={firstLinePlaceholder}
                isComposing={isComposing}
                isSelecting={isSelecting}
              >
                {renderInnerElement({ children, element, attributes })}
              </Block>
            )
          } else {
            return renderInnerElement({ children, element, attributes })
          }
        },
        [alwaysShowPlaceholder, isSelecting, isComposing, isGlobalDragging]
      )
      const handleKeydown = useMemoizedFn((e: KeyboardEvent) => {
        handleKeyEvents(e)
        for (const hotkey in HOTKEYS) {
          if (isHotkey(hotkey, e)) {
            e.preventDefault()
            const mark = HOTKEYS[hotkey]
            toggleMark(editor, mark)
          }
        }
      })

      useLayoutEffect(() => {
        handleChange(defaultValue)
        index()
      }, [])
      const decorate = useCallback(
        ([node, path]: NodeEntry) => {
          if (editor.nodeToDecorations?.has(node)) {
            const ranges = editor.nodeToDecorations.get(node) || []

            return ranges
          }
          return []
        },
        [editor.nodeToDecorations]
      )
      return (
        <Slate editor={editor} onChange={handleChange} value={defaultValue}>
          {showToolbar !== false && (
            <EditorToolbar
              scrollElement={scrollElement}
              config={toolbarConfig}
              onEvent={onToolbarEvent}
            />
          )}
          <DecorationHelper />
          <Editable
            ref={textareaMode ? scrollElementRef : ref}
            decorate={decorate}
            readOnly={readOnly}
            suppressContentEditableWarning={true}
            style={style}
            onBlur={() => {
              instance.on({
                type: 'blur'
              })
            }}
            onPaste={e => {
              return handlePaste(e, editor, instance)
            }}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onClick={onClick}
            onKeyDown={handleKeydown}
            className={classNames(
              'w-full h-auto editor-styles relative flex flex-col',
              readOnly && 'readOnlyEditor',
              editorClassName,
              textareaMode && 'textareaEditor'
            )}
            scrollElementRef={scrollElementRef}
          ></Editable>
        </Slate>
      )
    }
  ),
  (prev, curr) => prev.defaultValue === curr.defaultValue
)

const handlePaste = (e: ClipboardEvent, editor: CustomEditor, instance: IEditorInstance) => {
  const data = e.clipboardData
  if (!data) return false
  const html = data.getData('text/html')
  if (html) {
    const metas = Global.metaOps?.getCopiedMetaObjectsSync(html)
    if (metas?.length) {
      const inserted = handleInsertMetasIntoEditor(metas, undefined, false)
      Transforms.insertFragment(editor, inserted)
      e.preventDefault()
      return true
    }
  }
  return false
}

const toggleMark = (editor: CustomEditor, mark: string) => {
  const isActive = isMarkActive(editor, mark)
  if (isActive) {
    Editor.removeMark(editor, mark)
  } else {
    Editor.addMark(editor, mark, true)
  }
}

const isMarkActive = (editor: CustomEditor, mark: string) => {
  const marks = Editor.marks(editor)
  return marks ? mark in marks : false
}

export default InnerEditor
