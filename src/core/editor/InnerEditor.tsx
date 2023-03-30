import { useMemoizedFn, useMergedRef } from '@/hooks'
import isHotkey from 'is-hotkey'
import { FC, KeyboardEventHandler, memo, RefObject, useCallback, useEffect, useRef } from 'react'
import { Descendant, Editor, Path, Range, Transforms, Element as SlateElement, Node } from 'slate'
import { ReactEditor, Slate, RenderElementProps, RenderLeafProps, Editable, useSlateStatic } from './slate-react'
import EditorToolbar from './components/toolbar'
import HOTKEYS from './consts/hotkeys'
import { CustomEditor, CustomElement } from '~/typings'
import Divider from './Divider'
import Emoji from './elements/Emoji'
import { Block, Heading, Paragraph } from './elements'
import styles from './index.module.less'
import ListItem from './elements/listItem'
import MetaObject from './elements/meta'
import Image from './elements/image'
import ToDo from './elements/todo'
import Id from '@/utils/id'
import { CustomTransforms } from './utils/transform'
import { InlineElements } from './consts/elements'
import Media from './elements/media'
import { KEY } from '@/consts/key'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'
import moveMultiElements from './utils/moveMultiElements'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { EditableProps } from './slate-react/components/editable'
import { css } from '@emotion/css'
import Table from './elements/table/Table'
import TableCell from './elements/table/Cell'
import TableRow from './elements/table/Row'
import ClassName from '@/styles/classNames'
import classNames from 'classnames'
import useReadOnlyEditor from './hooks/useReadOnly'
import { useEventHandler } from '@/events'
import { DraggingElement, GlobalDragOverlayInstance, makeDragElements } from '../global'
import { GlobalEventHandler } from '@/events/globalEvent'

const EditableEditorClassName = css({
  p: {
    fontSize: '1em',
    margin: 0
  }
})
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const ReadOnlyEditorClassName = css({
  fontFamily: 'Muli, serif',
  '*': {
    textTransform: 'none'
  },
  pre: {
    '*': {
      whiteSpace: 'pre-wrap !important'
    }
  },
  p: {
    fontSize: '1.15rem',
    marginBottom: '0.5rem',
    marginTop: '0.5rem',
    lineHeight: 1.8,
    color: '#28313b'
  },
  'reach-inline-nav': {
    display: 'none'
  },
  img: {
    borderRadius: 6,
    maxWidth: '100%',
    width: 'calc(100% - 120px)',
    margin: '10px 60px',
    height: '100%'
  },
  'h1,h2,h3,h4,h5,h6': {
    fontWeight: 600
  },
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
  cite: ClassName.description(),
  figcaption: {
    color: 'rgb(77,77,77)',
    fontSize: '0.8rem',
    margin: '0 0.8rem',
    padding: 0,
    display: 'flex',
    justifyContent: 'center'
  }
})
export type InnerEditorProps = {
  editor: CustomEditor
  defaultValue: Descendant[]
  scrollElementRef?: RefObject<HTMLDivElement | null>
  onChange?: (value: Descendant[]) => void
  showToolbar?: boolean
  onBlockMouseEnter: (e: MouseEvent, element: CustomElement) => void
  onBlockMouseLeave: (e: MouseEvent, element: CustomElement) => void
  onBlockMouseMove?: (e: MouseEvent, element: CustomElement) => void
  onLinkClick?: (e: MouseEvent) => void
  readonly?: boolean
}
const loopThroughTypes = ['tableRow', 'tableCell']
const InnerEditor: FC<InnerEditorProps> = memo(
  ({
    editor,
    defaultValue,
    showToolbar,
    onBlockMouseEnter,
    onLinkClick,
    onBlockMouseLeave,
    onBlockMouseMove,
    onChange,
    scrollElementRef,
    readonly
  }) => {
    const scrollElement = scrollElementRef?.current
    const renderInnerElement = useCallback(
      (props: RenderElementProps & { onLinkClick?: InnerEditorProps['onLinkClick'] }) => <Element {...props} />,
      []
    )
    const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
    const editableRef = useRef<EditableProps['innerRef']>()
    const scopedEmitter = useScopedEventEmitter()
    const previousValue = useRef<Descendant[]>()

    editor.innerRef = editableRef
    const handleChange = useMemoizedFn((value: Descendant[]) => {
      onChange?.(value)
      const prevValue = previousValue.current
      previousValue.current = value
      if (prevValue !== value) {
        if (editor.operations.some(i => Path.operationCanTransformPath(i)) || ID_TO_PATH_MAP.get(editor) === undefined) {
          const map = ID_TO_PATH_MAP.get(editor) || new Map<number, Path>()
          ID_TO_PATH_MAP.set(editor, map)
          requestIdleCallback(() => {
            for (const [node, path] of Node.elements(editor)) {
              node.id && map.set(node.id, path)
            }
          })
        }
      }
    })
    const inlineKeys = [...Object.values(InlineElements), 'tableCell', 'tableRow']
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
              {renderInnerElement({ children, element, attributes, onLinkClick })}
            </Block>
          )
        } else {
          return renderInnerElement({ children, element, attributes, onLinkClick })
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
    return (
      <Slate editor={editor} onChange={handleChange} value={defaultValue}>
        <EditorToolbar
          showToolbar={showToolbar}
          scrollElement={scrollElement}
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
          onHighlight={() => {
            const highlightId = Id.getId()
            editor.onHighlight?.(highlightId)
            const isActive = isMarkActive(editor, 'highlight')
            if (isActive) {
              Editor.removeMark(editor, 'highlight')
            } else {
              Editor.addMark(editor, 'highlight', highlightId)
            }
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
            scopedEmitter.emit('editor', { type: 'compositionStart' })
          }}
          onCompositionEnd={() => {
            scopedEmitter.emit('editor', { type: 'compositionEnd' })
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
          className={classNames(styles.editorWrapper, readonly ? ReadOnlyEditorClassName : EditableEditorClassName)}
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
const dividerClassName = css({
  width: '100%',
  height: '1px',
  borderBottom: '1px solid rgba(55,53,47,0.16)'
})
export const Element = (props: RenderElementProps & { onLinkClick: InnerEditorProps['onLinkClick'] }) => {
  const { element, attributes, children, onLinkClick } = props
  if (!element.hide) {
    switch (element.type) {
      case 'paragraph':
        return <Paragraph {...props} />
      case 'block-quote':
        return <blockquote>{children}</blockquote>
      case 'bulleted-list':
        return <ul>{children}</ul>
      case 'link':
        return (
          <span {...attributes} style={{ display: 'inline' }}>
            <a
              target="_blank"
              onClick={e => {
                if (onLinkClick) {
                  onLinkClick?.(e)
                  return
                }
                if (navigator.userAgent.indexOf('Electron') >= 0) {
                  window.open(element.url)
                  e.preventDefault()
                }
              }}
              href={element.url}
            >
              {children}
            </a>
          </span>
        )
      case 'figcaption':
        return <figcaption>{children}</figcaption>
      case 'pre':
        return <pre>{children}</pre>
      case 'table':
        return <Table {...props} />
      case 'tableCell':
        return <TableCell {...props} />
      case 'sup':
        return <sup {...attributes}>{children}</sup>
      case 'tableRow':
        return <TableRow {...props} />
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
      default:
        return <Paragraph {...props} />
    }
  }
}

const TextHighlightClassName = css({
  backgroundImage: `linear-gradient(
     0deg, 
     rgb(247, 219, 106) 0%, 
     rgb(247, 219, 106) 2px,
     rgba(247, 219, 106, 0.3) 2px, 
     rgba(247, 219, 106, 0.3) 100%
   ) !important`,
  backgroundRepeat: 'no-repeat !important',
  backgroundSize: '100% 90% !important',
  backgroundPosition: '0 75% !important',
  WebkitBackgroundClip: 'unset !important',
  cursor: 'pointer'
})
export const Leaf = (props: RenderLeafProps) => {
  const editor = useSlateStatic()
  const readOnly = useReadOnlyEditor()
  const spanRef = useRef<HTMLSpanElement>(null)
  let { leaf, attributes, children } = props
  const mergedRef = useMergedRef(attributes.ref || {}, spanRef)
  useEffect(() => {
    const { highlight } = leaf
    if (readOnly && highlight) {
      const span = spanRef.current
      const pointerDown = {
        current: false
      }
      const handler = new GlobalEventHandler()
      handler.on('globalDragPointerUp', () => {
        pointerDown.current = false
      })
      const pointerHandler = (e: PointerEvent) => {
        e.preventDefault()
        if (e.type === 'pointerdown') {
          pointerDown.current = true
        }
        if (e.type === 'pointerup') {
          pointerDown.current = false
        }
        if (e.type === 'pointermove') {
          if (pointerDown.current) {
            pointerDown.current = false
            editor.onHighlightDrag?.(highlight, editor)
          }
        }
      }
      if (span) {
        span.addEventListener('pointerdown', pointerHandler)
        span.addEventListener('pointermove', pointerHandler)
        span.addEventListener('pointerup', pointerHandler)
      }
      return () => {
        span?.removeEventListener('pointerdown', pointerHandler)
        span?.removeEventListener('pointermove', pointerHandler)
        span?.removeEventListener('pointerup', pointerHandler)
      }
    }
  }, [readOnly])

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

  return (
    <span
      ref={mergedRef}
      onClick={() => {
        if (leaf.highlight && readOnly) {
          editor.onHighlightClick?.(leaf.highlight as number)
        }
      }}
      data-highlight={leaf.highlight && readOnly ? String(leaf.highlight) : undefined}
      className={classNames(styles.leaf, leaf.highlight && readOnly && TextHighlightClassName)}
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
