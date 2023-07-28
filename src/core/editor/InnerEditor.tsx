import { useDebounceFn, useMemoizedFn } from '@/hooks'
import isHotkey from 'is-hotkey'
import { FC, KeyboardEventHandler, memo, RefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import { Descendant, Editor, Node, Path, Range, Transforms } from 'slate'
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, useSlateStatic } from './slate-react'
import EditorToolbar from './components/toolbar'
import HOTKEYS from './consts/hotkeys'
import { CustomEditor, CustomElement } from '~/typings'
import Divider from './Divider'
import { Block } from './elements'
import styles from './index.module.less'
import Id from '@/utils/id'
import { InlineElements } from './consts/elements'
import { KEY } from '@/consts/key'
import { EDITOR_TO_CHANGED, ID_TO_ELEMENTS_MAP, ID_TO_FIRST_LAYER_MAP, ID_TO_PATH_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'
import moveMultiElements from './utils/moveMultiElements'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { EditableProps } from './slate-react/components/editable'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import classNames from 'classnames'
import useEditorSlashMenu from './hooks/useEditorSlashMenu'
import getCursorPosition from './utils/getCursorPosition'
import HoverObjectDetails from '../database/HoverObjectDetails'
import { DraggableElement, DraggingElement } from '../global'
import { Element } from './renderer/renderElement'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import useEditorInstance from './hooks/useEditorInstance'
import { transformTextContentToNameAndDescription } from '../global/globalDragOverlay/utils'

const EditableEditorClassName = css({
  p: {
    fontSize: '1em',
    margin: 0
  },
  figcaption: {
    color: Colors.Font.Secondary,
    fontSize: FontSize['12px'],
    margin: `0px ${FontSize['12px']}`,
    padding: 0,
    display: 'flex',
    justifyContent: 'center'
  }
})
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const ReadOnlyEditorClassName = css({
  // fontFamily: 'Muli, serif',
  '*': {
    textTransform: 'none'
  },
  pre: {
    '*': {
      whiteSpace: 'pre-wrap !important'
    }
  },
  figcaption: {
    color: Colors.Font.Secondary,
    fontSize: FontSize['12px'],
    margin: `0px ${FontSize['12px']}`,
    padding: 0,
    display: 'flex',
    justifyContent: 'center'
  },
  p: {
    fontSize: '1.15rem',
    marginBottom: '0.5rem',
    marginTop: '0.5rem',
    lineHeight: 1.6
  },
  'reach-inline-nav': {
    display: 'none'
  },
  img: {
    borderRadius: 6,
    maxWidth: '100%'
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
  cite: ClassName.description()
})

const CompactReadOnlyEditorClassName = css({
  p: {
    margin: '0px !important',
    lineHeight: '1.4 !important'
  },
  '.ParagraphBlock': {
    margin: '3px 0px',
    padding: '2px'
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
  readonly?: boolean
  compact?: boolean
  editorClassName?: string
}

const InnerEditor: FC<InnerEditorProps> = memo(
  ({
    editor,
    defaultValue,
    showToolbar,
    onBlockMouseEnter,
    onBlockMouseLeave,
    onBlockMouseMove,
    onChange,
    scrollElementRef,
    readonly,
    compact,
    editorClassName
  }) => {
    const scrollElement = scrollElementRef?.current
    const renderInnerElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
    const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
    const editableRef = useRef<EditableProps['innerRef']>()
    const scopedEmitter = useScopedEventEmitter()
    const previousValue = useRef<Descendant[]>()
    const { handleSlashKeyDown } = useEditorSlashMenu(editor)
    const instance = useEditorInstance()
    editor.innerRef = editableRef
    const { run: debounceIndex } = useDebounceFn(
      () => {
        const map = ID_TO_PATH_MAP.get(editor) || new Map<number, Path>()

        ID_TO_PATH_MAP.set(editor, map)

        for (const [node, path] of Node.elements(editor)) {
          node.id && map.set(node.id, path)
        }
      },
      { wait: 500 }
    )
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
        // normalize first layer ids to prevent path conflicts
        console.log(editor.children.length)
        editor.children.forEach((i, idx) => {
          if (firstLayerIdSet.has(i.id)) {
            Transforms.setNodes(editor, { id: Id.getId() }, { at: [idx] })
          }
          firstLayerIdSet.add(i.id)
          i.id && firstLayerMap.set(i.id, [idx])
        })

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
        onChange?.(value)
      }
    })
    const inlineKeys = [...Object.values(InlineElements), 'tableCell', 'tableRow', 'inline-metaObject', 'math']
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
    useEffect(() => {
      const keydownHandler = (e: KeyboardEvent) => {
        if (isHotkey(KEY.Backspace, e) || isHotkey(KEY.Delete, e)) {
          const selected = SELECTED_BLOCKS_MAP.get(editor)
          const isOverlayOpen = editor.overlayManager?.isOpen()
          const content = editor.overlayManager?.getContent()
          if (isOverlayOpen && content === 'slashMenu') {
            if (editor.selection && Range.isCollapsed(editor.selection) && isHotkey(KEY.Backspace, e)) {
              const prevDeleted = Editor.before(editor, editor.selection, {
                distance: 1,
                unit: 'character'
              })
              if (prevDeleted) {
                const prevText = Editor.string(editor, {
                  anchor: prevDeleted,
                  focus: editor.selection.focus
                })
                if (prevText === '/') {
                  editor.overlayManager?.close()
                }
              }
            }
          }
          if (selected && selected.size > 0) {
            e.preventDefault()
            e.stopPropagation()
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
      }
      document?.addEventListener('keydown', keydownHandler, true)
      return () => {
        document?.removeEventListener('keydown', keydownHandler, true)
      }
    }, [scrollElement])

    useEffect(() => {
      // if only default value, trigger for path index
      editor.onChange()
    }, [])

    const handleKeydown: KeyboardEventHandler<HTMLDivElement> = useMemoizedFn(e => {
      const { selection } = editor
      handleSlashKeyDown(e)
      if (selection && Range.isCollapsed(selection)) {
        if (isHotkey('left', e)) {
          e.preventDefault()
          const path = selection.anchor.path
          let distance = 1
          if (Path.hasPrevious(path) && Editor.isEdge(editor, selection.anchor, selection.anchor.path)) {
            const prevNode = Editor.node(editor, Path.previous(path))[0]
            if (['emoji'].includes(prevNode.type) || Editor.isVoid(editor, prevNode)) {
              distance = 2
            }
          }

          Transforms.move(editor, {
            unit: 'offset',
            reverse: true,
            distance
          })
          return
        }
        if (isHotkey('right', e)) {
          e.preventDefault()
          const path = selection.anchor.path
          let distance = 1
          if (Editor.hasPath(editor, Path.next(path)) && Editor.isEdge(editor, selection.anchor, selection.anchor.path)) {
            const nextNode = Editor.node(editor, Path.next(path))[0]
            if (['emoji'].includes(nextNode.type) || Editor.isVoid(editor, nextNode)) {
              distance = 2
            }
          }
          Transforms.move(editor, { unit: 'offset', distance })
          return
        }
      }
      if (isHotkey('tab', e)) {
        e.preventDefault()
        const currBlock = Editor.above(editor, {
          match: n => Editor.isBlock(editor, n)
        })
        const { selection } = editor
        if (!currBlock) return
        if (
          (currBlock[0].type === 'list-item' || currBlock[0].type === 'order-list-item' || currBlock?.[0].level > 0) &&
          selection &&
          Range.isCollapsed(selection)
        ) {
          Transforms.setNodes(editor, {
            level: currBlock[0].level ? (currBlock[0].level > 5 ? 6 : currBlock[0].level + 1) : 1
          })
        } else {
          Transforms.insertText(editor, '\u2003')
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
                    instance.deleteLabel?.(Number(highlightId))
                    editor.on({
                      type: 'highlightRemove',
                      highlightId: Number(highlightId)
                    })
                  } else {
                    const highlightId = Id.getId()
                    const selectedText = editor.selection ? Editor.string(editor, editor.selection) : undefined
                    const { name } = transformTextContentToNameAndDescription(selectedText)
                    const label = await instance.addLabel?.({
                      id: highlightId,
                      name: name || 'Unnamed Label'
                    })
                    if (label) {
                      editor.on({
                        type: 'highlight',
                        highlightId,
                        labelId: label.id
                      })
                    }
                    Editor.addMark(editor, 'highlight', highlightId)
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
                      top: cursorPosition.y
                    })
                  }
                }
                break
            }
          }}
        />
        <Editable
          innerRef={editableRef}
          readOnly={readonly}
          suppressContentEditableWarning={true}
          spellCheck="false"
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
            styles.editorWrapper,
            readonly ? ReadOnlyEditorClassName : EditableEditorClassName,
            compact && readonly && CompactReadOnlyEditorClassName,
            editorClassName
          )}
          scrollElementRef={scrollElementRef}
          style={useMemo(
            () => ({
              paddingBottom: readonly ? 0 : undefined
            }),
            [readonly]
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
      <HoverObjectDetails ref={attributes.ref || {}} objectId={leaf.highlight}>
        <DraggableElement
          onDragStart={() => editor.on({ type: 'highlightDrag', highlightId: leaf.highlight! })}
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
            className={classNames(styles.leaf, leaf.highlight && TextHighlightClassName)}
            style={{
              fontSize: leaf.fontSize || '1em',
              '--block-font-color': leaf.fontColor,
              background: leaf.backgroundColor
            }}
          >
            {children}
          </span>
        </DraggableElement>
      </HoverObjectDetails>
    )
  }
  return (
    <span
      {...attributes}
      className={styles.leaf}
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
