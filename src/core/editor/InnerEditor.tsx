import { useDebounceFn, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import isHotkey from 'is-hotkey'
import { FC, memo, PointerEventHandler, RefObject, useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { Descendant, Editor, Node, Path, Transforms } from 'slate'
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, useSlateStatic } from './slate-react'
import EditorToolbar from './components/toolbar'
import HOTKEYS from './consts/hotkeys'
import { CustomEditor, CustomElement } from '~/typings'
import Divider from './Divider'
import { Block } from './elements'
import Id from '@/utils/id'
import { InlineElements } from './consts/elements'
import { KEY } from '@/consts/key'
import { EDITOR_TO_CHANGED, ID_TO_FIRST_LAYER_EXCEPET_HIDEN_MAP, ID_TO_FIRST_LAYER_MAP, ID_TO_PATH_MAP } from './weakMaps'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { EditableProps } from './slate-react/components/editable'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import classNames from 'classnames'
import useEditorSlashMenu from './hooks/useEditorSlashMenu'
import getCursorPosition from './utils/getCursorPosition'
import { DraggableElement, DraggingElement } from '../global'
import { Element } from './renderer/renderElement'
import useEditorInstance from './hooks/useEditorInstance'
import useEditorMention from '@/core/editor/hooks/useEditorMention'
import useEditorDeleteKey from '@/core/editor/hooks/keyboards/useEditorDeleteKey'
import useEditorArrowKey from '@/core/editor/hooks/keyboards/useEditorArrowKey'
import useEditorCopyKey from '@/core/editor/hooks/keyboards/useEditorCopyKey'
import useEditorSelectAllKey from '@/core/editor/hooks/keyboards/useEditorSelectAllKey'
import useEditorTabKey from '@/core/editor/hooks/keyboards/useEditorTabKey'
import useEditorSaveKey from '@/core/editor/hooks/keyboards/useEditorSaveKey'
import useReadOnlyEditor from '@/core/editor/hooks/useReadOnly'
import EditorClasses from '@/core/editor/consts/classes'
import { assignProperties } from '@/utils'

const ReadOnlyEditorClassName = css({
  table: {
    width: '100%',
    borderSpacing: 0,
    table: {
      border: 'none',
      tr: {
        border: 'none'
      },
      td: {
        border: 'none'
      }
    }
  },
  'img,p,pre,blockquote,iframe': {
    marginBottom: 'calc((var(--font-size) / 16 * 1rem) - 6px)'
  },
  tbody: {
    tr: {
      borderBottom: '1px solid rgba(40,49,59,0.12)'
    },
    td: {
      padding: '0.5em'
    }
  },
  blockquote: {
    fontStyle: 'italic',
    fontSize: '1.15rem'
  },
  cite: ClassName.description()
})

export type InnerEditorProps = {
  editor: CustomEditor
  defaultValue: Descendant[]
  scrollElementRef?: RefObject<HTMLDivElement | null>
  onChange?: (value: Descendant[]) => void
  showToolbar?: boolean
  onBlockMouseEnter: (e: PointerEvent, element: CustomElement) => void
  onBlockMouseLeave: (e: PointerEvent, element: CustomElement) => void
  onBlockMouseMove?: (e: PointerEvent, element: CustomElement) => void
  readonly?: boolean
  compact?: boolean
  onPointerLeave?: PointerEventHandler
  editorClassName?: string
}

const InnerEditor: FC<InnerEditorProps> = memo(
  ({
    editor,
    defaultValue,
    onBlockMouseEnter,
    onBlockMouseLeave,
    onBlockMouseMove,
    onChange,
    scrollElementRef,
    editorClassName,
    onPointerLeave
  }) => {
    const scrollElement = scrollElementRef?.current
    const renderInnerElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
    const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
    const editableRef = useRef<EditableProps['innerRef']>()
    const scopedEmitter = useScopedEventEmitter()
    const previousValue = useRef<Descendant[]>()
    const readOnly = useReadOnlyEditor()
    const { handleSlashKeyDown } = useEditorSlashMenu(editor)
    const { handleMentionKey } = useEditorMention(editor)
    const instance = useEditorInstance()
    const handleDeleteKey = useEditorDeleteKey(instance)
    const handleArrowKey = useEditorArrowKey(instance)
    const handleCopyKey = useEditorCopyKey(instance)
    const handleSaveKey = useEditorSaveKey(instance)
    const handleSelectAllKey = useEditorSelectAllKey(instance)
    const handleTabKey = useEditorTabKey(instance)
    editor.innerRef = editableRef
    const index = () => {
      const map = new Map<number, Path>()

      ID_TO_PATH_MAP.set(editor, map)

      for (const [node, path] of Node.elements(editor)) {
        node.id && map.set(node.id, path)
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
      let shouldChange = false
      // already triggered
      if (EDITOR_TO_CHANGED.get(editor) === true) return
      EDITOR_TO_CHANGED.set(editor, true)
      if (!(editor.operations.length === 1 && editor.operations[0].type === 'set_selection')) {
        const firstLayerIdSet = new Set<number>()
        const firstLayerMap = ID_TO_FIRST_LAYER_MAP.get(editor) || new Map<number, Path>()

        ID_TO_FIRST_LAYER_MAP.set(editor, firstLayerMap)

        firstLayerMap.clear()
        firstLayerIdSet.clear()

        const firstLayerArr = []
        // normalize first layer ids to prevent path conflicts

        editor.children.forEach((i, idx) => {
          if (firstLayerIdSet.has(i.id)) {
            Transforms.setNodes(editor, { id: Id.getId() }, { at: [idx] })
          }
          if (i.id) {
            firstLayerIdSet.add(i.id)
            firstLayerMap.set(i.id, [idx])
            if (!i.hide) {
              firstLayerArr.push(i)
            }
          }
        })
        ID_TO_FIRST_LAYER_EXCEPET_HIDEN_MAP.set(editor, new Map(firstLayerArr.map((i, idx) => [i.id, idx])))
        scopedEmitter.emit('editor', {
          type: 'valueChange'
        })
        shouldChange = true
      }
      const prevValue = previousValue.current
      previousValue.current = value
      if (prevValue !== value) {
        if (editor.operations.some(i => Path.operationCanTransformPath(i)) || ID_TO_PATH_MAP.get(editor) === undefined) {
          debounceIndex()
        }
      }
      if (shouldChange) {
        if (value !== defaultValue) {
          onChange?.(value)
        }
      }
    })
    const inlineKeys = [...Object.values(InlineElements), 'tableCell', 'tableRow', 'inline-metaObject', 'math', 'inline-metapicker']
    const renderElement = useCallback(
      ({ children, element, attributes }: RenderElementProps) => {
        if (element.hide === true) return null
        if (element.type === 'columnList') {
          return (
            <Block
              data-type="block"
              key={element.id}
              blockId={element.id}
              data-spec-type="columnList"
              id={String(element.id)}
              type="columnList"
              element={element}
              attributes={attributes}
              scrollElementRef={scrollElementRef}
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
                blockId={element.id}
                ratio={element.ratio}
                data-spec-type="column"
                element={element}
                type="column"
                attributes={attributes}
                scrollElementRef={scrollElementRef}
              >
                {children}
              </Block>
            </>
          )
        }
        if (!inlineKeys.includes(element.type)) {
          return (
            <Block
              data-type="block"
              data-spec-type={element.type}
              blockId={element.id}
              key={element.id}
              id={String(element.id)}
              element={element}
              onMouseEnter={onBlockMouseEnter}
              onMouseLeave={onBlockMouseLeave}
              onMouseMove={onBlockMouseMove}
              attributes={attributes}
              type={element.type}
              scrollElementRef={scrollElementRef}
            >
              {renderInnerElement({ children, element, attributes })}
            </Block>
          )
        } else {
          return renderInnerElement({ children, element, attributes })
        }
      },
      [scrollElement]
    )

    useLayoutEffect(() => {
      EDITOR_TO_CHANGED.set(editor, false)
      handleChange(defaultValue)
      index()
      document.addEventListener('keydown', globalKeydownHandler)
      return () => {
        document.removeEventListener('keydown', globalKeydownHandler)
      }
    }, [])

    const handleKeydown = useMemoizedFn((e: KeyboardEvent) => {
      handleMentionKey(e)
      handleSlashKeyDown(e)
      handleDeleteKey(e)
      handleArrowKey(e)
      handleCopyKey(e)
      handleSelectAllKey(e)
      handleSaveKey(e)
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, e)) {
          e.preventDefault()
          const mark = HOTKEYS[hotkey]
          toggleMark(editor, mark)
        }
      }
    })
    const globalKeydownHandler = useMemoizedFn((e: KeyboardEvent) => {
      handleTabKey(e)
    })
    return (
      <Slate editor={editor} onChange={handleChange} value={defaultValue}>
        <EditorToolbar
          scrollElement={scrollElement}
          on={async event => {
            switch (event.action) {
              case 'bold':
              case 'code':
              case 'italic':
              case 'underline':
                toggleMark(editor, event.action)
                break
              case 'highlight':
                {
                  const isActive = isMarkActive(editor, 'highlight')
                  if (isActive) {
                    const highlightId = Editor.marks(editor)['highlight']
                    Editor.removeMark(editor, 'highlight')
                    instance.labelOps?.deleteLabel(Number(highlightId))
                  } else {
                    const highlightId = Id.getId()
                    const selectedText = editor.selection ? Editor.string(editor, editor.selection) : ''
                    if (!selectedText) return
                    Editor.addMark(editor, 'highlight', highlightId)
                    const label = await instance.labelOps?.addLabel?.({
                      id: highlightId,
                      selectedText
                    })
                    // if successfully add label
                    if (!label) {
                      Editor.removeMark(editor, 'highlight')
                    }
                  }
                }
                break
              case 'redo':
                editor.redo()
                break
              case 'undo':
                editor.undo()
                break
              case 'changeBackgroundColor':
                if (event.backgroundColor === '#ffffff') {
                  Editor.removeMark(editor, 'backgroundColor')
                } else {
                  Editor.addMark(editor, 'backgroundColor', event.backgroundColor)
                }
                break
              case 'changeFontColor':
                if (event.fontColor === '#000000') {
                  Editor.removeMark(editor, 'fontColor')
                } else {
                  Editor.addMark(editor, 'fontColor', event.fontColor)
                }
                break
              case 'changeFontSize':
                changeFontSize(editor, event.fontSize)
                break
              case 'link':
                {
                  const cursorPosition = getCursorPosition(editor)
                  if (cursorPosition) {
                    editor.overlayManager?.setContent('linkForm')
                    editor.overlayManager?.open()
                    editor.overlayManager?.setPosition({
                      left: cursorPosition.x,
                      top: cursorPosition.y + 5
                    })
                  }
                }
                break
            }
          }}
        />
        <Editable
          innerRef={editableRef}
          readOnly={readOnly}
          suppressContentEditableWarning={true}
          spellCheck="false"
          onPointerLeave={onPointerLeave}
          onCompositionStart={useCallback(() => {
            scopedEmitter.emit('editor', { type: 'compositionStart' })
          }, [])}
          onCompositionEnd={useCallback(() => {
            scopedEmitter.emit('editor', { type: 'compositionEnd' })
          }, [])}
          onCopy={useCallback(() => {
            editor.currentCopyElement = undefined
            editor.currentCopyElements = undefined
            return false
          }, [])}
          onPaste={useCallback(e => {
            const copyElement = editor.currentCopyElement
            const copyElements = editor.currentCopyElements
            if (copyElement) {
              const newEle = {
                ...copyElement,
                id: Id.getId()
              }
              Transforms.insertNodes(editor, newEle)
              e.preventDefault()
              return true
            }
            if (copyElements) {
              const newEles = copyElements.map(i => ({
                ...i,
                id: Id.getId()
              }))
              Transforms.insertNodes(editor, newEles)
              e.preventDefault()
              return true
            }
            return false
          }, [])}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeydown}
          className={classNames(
            EditorClasses.TextBoxClass,
            EditorClasses.DefaultContentClass,
            readOnly && ReadOnlyEditorClassName,
            editorClassName
          )}
          onKeyDownCapture={e => {
            if (isHotkey(KEY.ArrowUp, e) || isHotkey(KEY.ArrowDown, e) || isHotkey(KEY.ArrowRight, e) || isHotkey(KEY.ArrowLeft, e)) {
              e.stopPropagation()
            }
          }}
          scrollElementRef={scrollElementRef}
          style={useMemo(
            () => ({
              paddingBottom: readOnly || editor.noBottomPadding ? 0 : undefined,
              display: 'flex',
              flexDirection: 'column'
            }),
            [readOnly]
          )}
        ></Editable>
      </Slate>
    )
  }
)
const toggleMark = (editor: CustomEditor, mark: string) => {
  const isActive = isMarkActive(editor, mark)
  if (isActive) {
    Editor.removeMark(editor, mark)
  } else {
    Editor.addMark(editor, mark, true)
  }
}

const changeFontSize = (editor: CustomEditor, fontSize: string) => {
  if (fontSize === 'default') {
    Editor.removeMark(editor, 'fontSize')
    Array.from(Editor.nodes(editor, { mode: 'lowest' }))
      .filter(i => i[0].type === 'emoji')
      .map(i => i[1])
      .forEach(i => {
        Transforms.setNodes(
          editor,
          {
            fontSize: undefined
          },
          {
            at: i
          }
        )
      })
    return
  }
  editor.fontSize = fontSize
  Editor.addMark(editor, 'fontSize', fontSize)
  Array.from(Editor.nodes(editor, { mode: 'lowest' }))
    .filter(i => i[0].type === 'emoji')
    .map(i => i[1])
    .forEach(i => {
      Transforms.setNodes(
        editor,
        {
          fontSize: fontSize
        },
        {
          at: i
        }
      )
    })
}

const isMarkActive = (editor: CustomEditor, mark: string) => {
  const marks = Editor.marks(editor)
  return marks ? mark in marks : false
}

const TextHighlightClassName = css({
  backgroundImage: `linear-gradient(
     0deg,
     rgb(247, 219, 106) 0%,
     rgb(247, 219, 106) 2px,
     rgba(247, 219, 106, 0.3) 2px,
     rgba(247, 219, 106, 0.3) 100%
   )`,
  backgroundRepeat: 'no-repeat !important',
  backgroundSize: '100% 90% !important',
  backgroundPosition: '0 75% !important',
  WebkitBackgroundClip: 'unset !important',
  cursor: 'pointer'
})
export const Leaf = (props: RenderLeafProps) => {
  const editor = useSlateStatic()
  let { leaf, attributes, children } = props

  if (leaf.sup) {
    children = <sup>{children}</sup>
  }

  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  if (leaf.highlight) {
    return (
      <DraggableElement
        onDragStart={() => editor.on({ type: 'labelDrag', labelId: leaf.highlight! })}
        hoverElement={<DraggingElement text={editor.type === 'note' ? 'Drop to add note label' : 'Drop to add webpage label'} />}
      >
        <span
          {...attributes}
          onClick={() => {
            if (leaf.highlight) {
              editor.onHighlightClick?.(leaf.highlight as number)
            }
          }}
          data-highlight={leaf.highlight ? String(leaf.highlight) : undefined}
          className={classNames(leaf.highlight && TextHighlightClassName)}
          style={{
            fontSize: leaf.fontSize || '1em',
            '--block-font-color': leaf.fontColor,
            background: leaf.backgroundColor
          }}
        >
          {children}
        </span>
      </DraggableElement>
    )
  }
  return (
    <span
      {...attributes}
      style={{
        fontSize: leaf.fontSize || '1em',
        '--block-font-color': leaf.fontColor,
        background: leaf.backgroundColor
      }}
    >
      {children}
    </span>
  )
}

export default InnerEditor
