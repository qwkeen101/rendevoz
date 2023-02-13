import { useMemoizedFn } from '@/hooks'
import isHotkey from 'is-hotkey'
import { FC, KeyboardEventHandler, memo, RefObject, useCallback, useEffect, useRef } from 'react'
import { Descendant, Editor, Path, Range, Transforms, Element as SlateElement, Text, Node, NodeEntry } from 'slate'
import { ReactEditor, Slate, RenderElementProps, RenderLeafProps, Editable } from './slate-react'
import EditorToolbar from './components/toolbar'
import HOTKEYS from './consts/hotkeys'
import { CustomEditor, CustomElement } from './types'
import Divider from './Divider'
import Emoji from './elements/Emoji'
import { BookHighlight, Block, Heading, Paragraph } from './elements'
import { Spacer } from './elements/Spacer'
import SubPage from './elements/subPage'
import Thought from './elements/thought'
import styles from './index.module.less'
import ListItem from './elements/listItem'
import { Positions } from './utils/positions'
import MetaObject from './elements/meta'
import Image from './elements/image'
import ToDo from './elements/todo'
import Id from '@/utils/id'
import useMetaStore from '@/stores/meta.store'
import { CustomTransforms } from './utils/transform'
import { InlineElements } from './consts/elements'
import Media from './elements/media'
import { KEY } from '@/consts/key'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP, SELECTED_BLOCKS_MAP, SELECTED_ID_TO_ELEMENTS_SET } from './weakMaps'
import moveMultiElements from './utils/moveMultiElements'
import useEventEmitter from '@/events/useEventEmitter'
import { EditorEventHandler } from '@/events/editorEvent'
import { EditableProps } from './slate-react/components/editable'
import { css } from '@emotion/css'

type InnerEditorProps = {
  editor: CustomEditor
  defaultValue: Descendant[]
  scrollElementRef?: RefObject<HTMLDivElement | null>
  onChange?: (value: Descendant[]) => void
  onBlockMouseEnter: (e: MouseEvent, element: CustomElement) => void
  onBlockMouseLeave: (e: MouseEvent, element: CustomElement) => void
  onBlockMouseMove?: (e: MouseEvent, element: CustomElement) => void
  onNestedListItem: (isNested: boolean) => void
  readonly?: boolean
}
const InnerEditor: FC<InnerEditorProps> = memo(
  ({
    editor,
    defaultValue,
    onBlockMouseEnter,
    onBlockMouseLeave,
    onBlockMouseMove,
    onChange,
    onNestedListItem,
    scrollElementRef,
    readonly
  }) => {
    const scrollElement = scrollElementRef?.current
    const renderInnerElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
    const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
    const editableRef = useRef<EditableProps['innerRef']>()
    const emitter = useEventEmitter()
    const editorEventHandler = new EditorEventHandler()
    const previousValue = useRef<Descendant[]>()
    editorEventHandler.on('jumpToBlock', data => {
      if (data.noteId === editor.noteId) {
        emitter.removeInterval()
        let entry: NodeEntry | undefined = undefined
        for (const e of Node.descendants(editor)) {
          if (e[0].id === data.blockId) {
            entry = e
            break
          }
        }
        console.log(entry)
        if (entry) {
          const idx = entry[1][0]
          if (idx !== undefined) {
            editableRef.current?.scrollTo(idx)

            const selectBlock = () => {
              requestIdleCallback(() => {
                const elementsMap = ID_TO_ELEMENTS_MAP.get(editor)
                const ele = elementsMap?.get(data.blockId)
                if (ele) {
                  ele.selectBlock()
                } else {
                  selectBlock()
                }
              })
            }
            selectBlock()
          }
        }
      }
    })
    useEffect(() => {
      emitter.addListener('editor', editorEventHandler)
      return () => {
        emitter.removeListener('editor', editorEventHandler)
      }
    }, [])
    const { addMetaObject, addMetaLink, getMetaObjectByObjectId } = useMetaStore()
    editor.innerRef = editableRef
    const handleChange = useMemoizedFn((value: Descendant[]) => {
      onChange?.(value)
      const prevValue = previousValue.current
      previousValue.current = value
      if (prevValue !== value) {
        if (editor.operations.some(i => Path.operationCanTransformPath(i)) || ID_TO_PATH_MAP.get(editor) === undefined) {
          const map = ID_TO_PATH_MAP.get(editor) || new Map<number, Path>()
          ID_TO_PATH_MAP.set(editor, map)
          for (const [node, path] of Node.elements(editor, { pass: n => !('id' in n[0]) })) {
            map.set(node.id, path)
          }
        }
      }
    })
    const inlineKeys = Object.values(InlineElements)
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
              data-spec-type="common-block"
              blockId={element.id}
              key={element.id}
              id={String(element.id)}
              element={element}
              onMouseEnter={onBlockMouseEnter}
              onMouseLeave={onBlockMouseLeave}
              onMouseMove={onBlockMouseMove}
              onNestedListItem={onNestedListItem}
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
    const handleKeydown: KeyboardEventHandler<HTMLDivElement> = useMemoizedFn(e => {
      const { selection } = editor
      if (selection && Range.isCollapsed(selection)) {
        if (isHotkey('left', e)) {
          e.preventDefault()
          const path = selection.anchor.path
          let distance = 1
          if (
            Path.hasPrevious(path) &&
            ['emoji'].includes(Editor.node(editor, Path.previous(path))[0].type) &&
            Editor.isEdge(editor, selection.anchor, selection.anchor.path)
          )
            distance = 2
          Transforms.move(editor, { unit: 'offset', reverse: true, distance })
          return
        }
        if (isHotkey('right', e)) {
          e.preventDefault()
          const path = selection.anchor.path
          let distance = 1
          if (
            Editor.hasPath(editor, Path.next(path)) &&
            ['emoji'].includes(Editor.node(editor, Path.next(path))[0].type) &&
            Editor.isEdge(editor, selection.anchor, selection.anchor.path)
          )
            distance = 2
          Transforms.move(editor, { unit: 'offset', distance })
          return
        }
      }
      if (isHotkey('tab', e)) {
        e.preventDefault()
        const currBlock = Editor.above(editor, { match: n => Editor.isBlock(editor, n) })
        const { selection } = editor
        if (!currBlock) return
        if (
          (currBlock[0].type === 'list-item' || currBlock?.[0].level > 0) &&
          selection &&
          Editor.isStart(editor, selection?.anchor, currBlock?.[1])
        ) {
          Transforms.setNodes(editor, {
            level: currBlock[0].level ? (currBlock[0].level > 5 ? 6 : currBlock[0].level + 1) : 1
          })
        } else {
          Transforms.insertText(editor, '\u2003')
        }
      }
      if (isHotkey(KEY.Backspace, e) || isHotkey(KEY.Delete, e)) {
        const selected = SELECTED_BLOCKS_MAP.get(editor)
        if (selected && selected.size > 0) {
          e.preventDefault()
          if (selected.size === ID_TO_PATH_MAP.get(editor)?.size) {
            Transforms.removeNodes(editor, {
              at: Editor.range(editor, [0], [editor.children.length - 1])
            })
            SELECTED_BLOCKS_MAP.set(editor, new Map())
            return
          }
          const ids = Array.from(selected.keys())
          const elements: [CustomElement, Path][] = []
          const eles = ID_TO_ELEMENTS_MAP.get(editor)
          ids.forEach(id => {
            const ele = eles?.get(id)
            if (ele) {
              elements.push([ele.getElement(), ID_TO_PATH_MAP.get(editor)?.get(id)])
              selected.delete(id)
            }
          })
          moveMultiElements(editor, elements, [editor.children.length - 1], 'bottom', false)
          Transforms.removeNodes(editor, {
            at: {
              anchor: {
                path: [editor.children.length - elements.length],
                offset: 0
              },
              focus: Editor.end(editor, [])
            }
          })
          Transforms.deselect(editor)
        }
      }
      if (isHotkey('mod+a', e)) {
        e.preventDefault()
        const selectedBlocksMap = SELECTED_BLOCKS_MAP.get(editor)
        ID_TO_PATH_MAP.get(editor)?.forEach((v, k) => {
          selectedBlocksMap?.set(k, null)
        })
        ID_TO_ELEMENTS_MAP.get(editor)?.forEach(i => {
          i.selectBlock()
        })
      }
      if (isHotkey('mod+c', e)) {
        const selected = SELECTED_BLOCKS_MAP.get(editor)
        if (selected && selected.size > 0) {
          e.preventDefault()
          const idToPath = ID_TO_PATH_MAP.get(editor)
          const elements = Array.from(selected.keys())
            .map(id => {
              const path = idToPath?.get(id)
              if (!path) return
              const node = Editor.node(editor, path)[0]
              return node
            })
            .filter(i => i !== undefined) as CustomElement[]
          editor.currentCopyElements = elements
        }
      }
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, e)) {
          e.preventDefault()
          const mark = HOTKEYS[hotkey]
          toggleMark(editor, mark)
        }
      }
    })
    const handleMetaObject = useMemoizedFn(() => {
      const { selection } = editor
      if (selection) {
        if (Range.isExpanded(selection)) {
          const selectedText = Editor.string(editor, selection)
          const [start, end] = Range.edges(selection)
          const startPoint = Editor.pointRef(editor, start)
          Transforms.splitNodes(editor, {
            match: Text.isText
          })
          addMetaObject({
            keyword: selectedText,
            type: 'normal'
          }).then(obj => {
            const noteMeta = getMetaObjectByObjectId(editor.noteId)
            addMetaLink({
              sourceId: noteMeta?.id,
              sourceType: 'note',
              targetId: obj.id,
              targetType: 'knowledge'
            })
            Transforms.insertNodes(
              editor,
              {
                type: 'metaObject',
                id: Id.getId(),
                originId: obj.id,
                children: [
                  {
                    text: ''
                  }
                ]
              },
              {
                at: startPoint.unref()
              }
            )
          })
        }
      }
    })
    return (
      <Slate editor={editor} onChange={handleChange} value={defaultValue}>
        <EditorToolbar
          scrollElement={scrollElement}
          onMetaObject={handleMetaObject}
          onChangeFontSize={fontSize => changeFontSize(editor, fontSize)}
          onChangeFontColor={color => {
            if (color === '#000000') {
              Editor.removeMark(editor, 'fontColor')
            } else {
              Editor.addMark(editor, 'fontColor', color)
            }
          }}
          onChangeBackgroundColor={color => {
            if (color === '#ffffff') {
              Editor.removeMark(editor, 'backgroundColor')
            } else {
              Editor.addMark(editor, 'backgroundColor', color)
            }
          }}
          onRedo={() => editor.redo()}
          onUndo={() => editor.undo()}
          onBold={() => {
            toggleMark(editor, 'bold')
          }}
          onLink={() => {
            const selectedText = CustomTransforms.getSelectedText(editor)
            if (selectedText) {
              CustomTransforms.replaceSelectedNode(editor, {
                type: 'link',
                url: 'https://www.baidu.com',
                children: [
                  {
                    text: selectedText
                  }
                ]
              })
            }
          }}
          onItalic={() => toggleMark(editor, 'italic')}
          onUnderline={() => toggleMark(editor, 'underline')}
        />
        <Editable
          innerRef={editableRef}
          readOnly={readonly}
          // scrollSelectionIntoView={() => {}}
          suppressContentEditableWarning={true}
          spellCheck="false"
          onCompositionStart={() => {
            if (Positions.isEndSpacer(editor) || Positions.isStartSpacer(editor)) {
              editor.insertBreak()
            }
          }}
          onCopy={() => {
            editor.currentCopyElement = undefined
            editor.currentCopyElements = undefined
            // return true
            return false
          }}
          onPaste={e => {
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
          }}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeydown}
          className={styles.editorWrapper}
          scrollElementRef={scrollElementRef}
          style={{
            paddingBottom: readonly ? 0 : undefined
          }}
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

const changeFontSize = (editor: CustomEditor, fontSize: number) => {
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
  return marks ? marks[mark] === true : false
}
const dividerClassName = css({
  width: '100%',
  height: '1px',
  borderBottom: '1px solid rgba(55,53,47,0.16)'
})
export const Element = (props: RenderElementProps) => {
  const { element, attributes, children } = props
  if (!element.hide) {
    switch (element.type) {
      case 'paragraph':
        return <Paragraph {...props} />
      case 'block-quote':
        return <blockquote>{children}</blockquote>
      case 'bulleted-list':
        return <ul>{children}</ul>
      case 'book-highlight':
        return <BookHighlight {...props} />
      case 'link':
        return (
          <span {...attributes} style={{ display: 'inline' }}>
            <a
              target="_blank"
              onClick={() => {
                if (navigator.userAgent.indexOf('Electron') >= 0) {
                  window.open('https://www.baidu.com')
                }
              }}
              href={element.url}
            >
              {children}
            </a>
          </span>
        )
      case 'divider':
        return (
          <div contentEditable={false} className={dividerClassName}>
            {children}
          </div>
        )
      case 'heading-one':
      case 'heading-two':
      case 'heading-three':
      case 'heading-four':
      case 'heading-five':
      case 'heading-six':
        return <Heading {...props} />
      case 'metaObject':
        return <MetaObject {...props} />
      case 'image':
        return <Image {...props} />
      case 'to-do':
        return <ToDo {...props} />
      case 'list-item':
        return <ListItem {...props} />
      case 'pdf':
      case 'note':
        return <Media {...props} />
      case 'thought':
        return <Thought {...props}>{children}</Thought>
      case 'emoji':
        return <Emoji {...props} />
      case 'subPage':
        return <SubPage {...props} />
      default:
        return <Paragraph {...props} />
    }
  }
}

export const Leaf = (props: RenderLeafProps) => {
  let { leaf, attributes, children } = props
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

  return (
    <span
      className={styles.leaf}
      style={{
        fontSize: leaf.fontSize || '1em',
        '--block-font-color': leaf.fontColor,
        background: leaf.backgroundColor
      }}
      {...attributes}
    >
      {children}
    </span>
  )
}

export default InnerEditor
