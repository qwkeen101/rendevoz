import { useDebounceFn, useMemoizedFn, useSelectAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import isHotkey from 'is-hotkey'
import { CSSProperties, FC, memo, RefObject, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Descendant, Editor, Node, Path, Transforms } from 'slate'
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, useSlateStatic } from './slate-react'
import EditorToolbar from './components/EditorSelectionToolbar'
import HOTKEYS from './consts/hotkeys'
import { CustomEditor, CustomElement } from '~/typings'
import Divider from './Divider'
import { Block } from './elements'
import Id from '@/utils/id'
import { InlineElements } from './consts/elements'
import { EDITOR_TO_CHANGED, ID_TO_FIRST_LAYER_EXCEPET_HIDEN_MAP, ID_TO_FIRST_LAYER_MAP, ID_TO_PATH_MAP } from './weakMaps'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { defaultScrollSelectionIntoView, EditableProps } from './slate-react/components/editable'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import classNames from 'classnames'
import useEditorSlashMenu from './hooks/useEditorSlashMenu'
import { DraggableElement, DraggingElement } from '../../global'
import { Element } from './renderer/renderElement'
import useEditorInstance from './hooks/useEditorInstance'
import useEditorMention from '@/core/components/editor/hooks/useEditorMention'
import useEditorDeleteKey from '@/core/components/editor/hooks/keyboards/useEditorDeleteKey'
import useEditorArrowKey from '@/core/components/editor/hooks/keyboards/useEditorArrowKey'
import useEditorCopyKey from '@/core/components/editor/hooks/keyboards/useEditorCopyKey'
import useEditorSelectAllKey from '@/core/components/editor/hooks/keyboards/useEditorSelectAllKey'
import useEditorTabKey from '@/core/components/editor/hooks/keyboards/useEditorTabKey'
import useEditorSaveKey from '@/core/components/editor/hooks/keyboards/useEditorSaveKey'
import useReadOnlyEditor from '@/core/components/editor/hooks/useReadOnly'
import EditorClasses from '@/core/components/editor/consts/classes'
import { assignProperties } from '@/utils'
import { Colors } from '@/consts'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import { DEFAULT_BACKGROUND_COLORS } from '@/components/picker/colorPicker'
import useGlobalKey from '@/core/components/editor/hooks/keyboards/useGlobalKey'
import { SettingAtom } from '@/core'

const ReadOnlyEditorClassName = css({
  table: {
    width: '100%',
    borderSpacing: 0,
    border: 'none',
    tr: {
      border: 'none'
    },
    td: {
      '.ParagraphBlock': {
        marginBottom: 2
      },
      padding: '0.5em'
    }
  },
  '.ParagraphBlock': {
    borderRadius: 0,
    paddingLeft: 0
  },
  cite: ClassName.description()
})
const AddSpacingClassName = css({
  '.ParagraphBlock': {
    marginBottom: 'calc((var(--font-size) / 16 * 1rem) - 3px)'
  }
})
export type InnerEditorProps = {
  editor: CustomEditor
  defaultValue: Descendant[]
  scrollElementRef?: RefObject<HTMLDivElement | null>
  onChange?: (value: Descendant[]) => void
  showToolbar?: boolean
  editorClassName?: string
  style?: CSSProperties
}

const InnerEditor: FC<InnerEditorProps> = memo(
  ({ editor, defaultValue, style, onChange, scrollElementRef, editorClassName }) => {
    const scrollElement = scrollElementRef?.current
    const renderInnerElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
    const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
    const editableRef = useRef<EditableProps['innerRef']>()
    const scopedEmitter = useScopedEventEmitter()
    const previousValue = useRef<Descendant[]>()
    const readOnly = useReadOnlyEditor()
    const { handleMentionKey } = useEditorMention(editor)
    const instance = useEditorInstance()
    const { handleSlashKeyDown } = useEditorSlashMenu(instance)
    const handleDeleteKey = useEditorDeleteKey(instance)
    const handleArrowKey = useEditorArrowKey(instance)
    const handleCopyKey = useEditorCopyKey(instance)
    const handleSaveKey = useEditorSaveKey(instance)
    const handleSelectAllKey = useEditorSelectAllKey(instance)
    const handleTabKey = useEditorTabKey(instance)
    const canScrollIntoView = useSelectAtomValue(EditorStateAtom, s => s.layout?.canScrollIntoView) ?? true
    useGlobalKey()
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
      if (value.length === 0) {
        Transforms.insertNodes(editor, { type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }, { at: [0] })
        return
      }
      let shouldChange = false
      // already triggered
      if (EDITOR_TO_CHANGED.get(editor) === true) return
      EDITOR_TO_CHANGED.set(editor, true)
      if (!(editor.operations.length === 1 && editor.operations[0].type === 'set_selection')) {
        const firstLayerIdSet = new Set<number>()
        const firstLayerMap = new Map<number, Path>()

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
    const addParagraphSpacing = useSelectGlobalAtomValue(SettingAtom, s => s.editor.addSpacingInReaderMode)
    const globalKeydownHandler = useMemoizedFn((e: KeyboardEvent) => {
      handleTabKey(e)
    })

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

    useLayoutEffect(() => {
      EDITOR_TO_CHANGED.set(editor, false)
      handleChange(defaultValue)
      index()
      document.addEventListener('keydown', globalKeydownHandler)
      return () => {
        document.removeEventListener('keydown', globalKeydownHandler)
      }
    }, [])

    return (
      <Slate editor={editor} onChange={handleChange} value={defaultValue}>
        <EditorToolbar
          scrollElement={scrollElement}
          on={useMemoizedFn(async event => {
            switch (event.action) {
              case 'bold':
              case 'code':
              case 'italic':
              case 'underline':
              case 'cloze':
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
                    const selectedText = editor.selection ? Editor.string(editor, editor.selection, { voids: true }) : ''
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
                    return highlightId
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
                if (event.backgroundColor === Colors.Background.Blank) {
                  Editor.removeMark(editor, 'backgroundColor')
                } else {
                  Editor.addMark(editor, 'backgroundColor', event.backgroundColor)
                }
                break
              case 'changeFontColor':
                if (event.fontColor === Colors.Font.Blank) {
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
                  const blockPos = instance.blockOps?.getCurrentCursorBounding()
                  if (blockPos) {
                    instance.overlayOps?.open('linkForm', {
                      x: blockPos.x,
                      y: blockPos.y
                    })
                  }
                }
                break
            }
          })}
        />
        <Editable
          readOnly={readOnly}
          suppressContentEditableWarning={true}
          spellCheck="false"
          style={style}
          onCopy={useCallback(() => {
            editor.currentCopyElement = undefined
            editor.currentCopyElements = undefined
            return false
          }, [])}
          onBlur={() => {
            editor.on({
              type: 'blur'
            })
          }}
          onPaste={useCallback(e => {
            const copyElement = editor.currentCopyElement
            const copyElements = editor.currentCopyElements
            console.log(copyElement, copyElements)
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
          scrollSelectionIntoView={(editor, domRange) => {
            console.log(canScrollIntoView)
            if (canScrollIntoView) {
              defaultScrollSelectionIntoView(editor, domRange)
            }
          }}
          className={classNames(
            EditorClasses.TextBoxClass,
            EditorClasses.DefaultContentClass,
            readOnly && ReadOnlyEditorClassName,
            editorClassName,
            readOnly && addParagraphSpacing && AddSpacingClassName
          )}
          scrollElementRef={scrollElementRef}
        ></Editable>
      </Slate>
    )
  },
  (prev, curr) => prev.defaultValue === curr.defaultValue
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
     ${Colors.Emphasis.Emphasis} 0%,
     ${Colors.Emphasis.Emphasis} 1.5px,
     rgba(247, 219, 106, 0.3) 1.5px,
     rgba(247, 219, 106, 0.3) 100%
   )`,
  transition: 'background-color 0.5s ease',
  backgroundRepeat: 'no-repeat !important',
  backgroundSize: '100% 90% !important',
  backgroundPosition: '0 75% !important',
  WebkitBackgroundClip: 'unset !important',
  cursor: 'pointer'
})
export const Leaf = (props: RenderLeafProps) => {
  const editor = useSlateStatic()
  const [disableCloze, setDisableCloze] = useState(false)
  let { leaf, attributes, children } = props
  const style: CSSProperties = {
    fontWeight: leaf.bold ? 'bold' : undefined,
    fontStyle: leaf.italic ? 'italic' : undefined,
    padding: leaf.code ? '0.2em 0.4em' : undefined,
    color: leaf.cloze && !disableCloze ? 'transparent' : leaf.code ? '#EB5757' : undefined,
    borderRadius: leaf.code ? 4 : undefined,
    textDecoration: leaf.underline ? 'underline' : undefined,
    fontSize: leaf.fontSize || leaf.code ? '0.85em' : '1em',
    '--block-font-color': leaf.fontColor,
    backgroundColor:
      leaf.cloze && !disableCloze ? 'var(--emphasis)' : leaf.code ? 'rgba(135,131,120,0.15)' : Colors.getAdaptColor(leaf.backgroundColor),
    cursor: leaf.cloze ? 'pointer' : undefined,
    boxShadow: leaf.cloze && disableCloze ? '0 0 0 1px var(--emphasis)' : undefined
  }
  const handleClick = e => {
    if (leaf.highlight) {
      e.preventDefault()
      editor.onHighlightClick?.(leaf.highlight)
    }
    if (leaf.cloze) {
      e.preventDefault()
      setDisableCloze(!disableCloze)
    }
  }
  if (leaf.sup) {
    children = <sup>{children}</sup>
  }
  if (leaf.highlight) {
    return (
      <DraggableElement
        onDragStart={() => editor.on({ type: 'labelDrag', labelId: leaf.highlight! })}
        hoverElement={<DraggingElement text={editor.type === 'note' ? 'Drop to add note label' : 'Drop to add webpage label'} />}
      >
        <span
          {...attributes}
          onClick={handleClick}
          data-highlight={leaf.highlight}
          className={classNames(leaf.highlight && TextHighlightClassName)}
          style={style}
        >
          {children}
        </span>
      </DraggableElement>
    )
  }
  return (
    <span {...attributes} onClick={handleClick} style={style}>
      {children}
    </span>
  )
}

export default InnerEditor
