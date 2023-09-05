import { useDebounceFn, useMemoizedFn } from '@/hooks'
import isHotkey from 'is-hotkey'
import { FC, memo, RefObject, useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { Descendant, Editor, Node, Path, Transforms } from 'slate'
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, useSlateStatic } from './slate-react'
import EditorToolbar from './components/toolbar'
import HOTKEYS from './consts/hotkeys'
import { CustomEditor, CustomElement, EditorProps } from '~/typings'
import Divider from './Divider'
import { Block } from './elements'
import styles from './index.module.less'
import Id from '@/utils/id'
import { InlineElements } from './consts/elements'
import { KEY } from '@/consts/key'
import { EDITOR_TO_CHANGED, ID_TO_FIRST_LAYER_MAP, ID_TO_PATH_MAP } from './weakMaps'
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
import useEditorMention from '@/core/editor/hooks/useEditorMention'
import useEditorDeleteKey from '@/core/editor/hooks/keyboards/useEditorDeleteKey'
import useEditorArrowKey from '@/core/editor/hooks/keyboards/useEditorArrowKey'
import useEditorCopyKey from '@/core/editor/hooks/keyboards/useEditorCopyKey'
import useEditorSelectAllKey from '@/core/editor/hooks/keyboards/useEditorSelectAllKey'
import useEditorTabKey from '@/core/editor/hooks/keyboards/useEditorTabKey'
import { getSetting } from '@/core'
import { truncate } from 'lodash'
import { truncateString } from '@/utils/text'

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
    fontSize: '1em',
    lineHeight: 1.6,
    margin: '0.2em'
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
  toolbarOptions?: EditorProps['toolbarOptions']
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
    editorClassName,
    toolbarOptions
  }) => {
    const scrollElement = scrollElementRef?.current
    const renderInnerElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
    const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
    const editableRef = useRef<EditableProps['innerRef']>()
    const scopedEmitter = useScopedEventEmitter()
    const previousValue = useRef<Descendant[]>()
    const { handleSlashKeyDown } = useEditorSlashMenu(editor)
    const { handleMentionKey } = useEditorMention(editor)
    const instance = useEditorInstance()
    const handleDeleteKey = useEditorDeleteKey(instance)
    const handleArrowKey = useEditorArrowKey(instance)
    const handleCopyKey = useEditorCopyKey(instance)
    const handleSelectAllKey = useEditorSelectAllKey(instance)
    const handleTabKey = useEditorTabKey(instance)
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
        console.log(firstLayerMap)
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
      // if only default value, trigger for path index
      document.addEventListener('keydown', globalKeydownHandler)
      if (!editor.noteId) {
        editor.children = [...defaultValue]
        EDITOR_TO_CHANGED.set(editor, false)
        editor.contentInitialized = true
        editor.onChange()
        editor.history = { redos: [], undos: [] }
        editor.initialized = true
      } else {
        editor.onChange()
      }
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
          showToolbar={showToolbar}
          scrollElement={scrollElement}
          toolbarOptions={toolbarOptions}
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
                    if (!selectedText) return
                    const name = getSetting().label.showOriginalText
                      ? truncateString(selectedText)
                      : selectedText
                    const label = await instance.addLabel?.({
                      id: highlightId,
                      name: name || 'Unnamed Label',
                      selectedText
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
          onKeyDownCapture={e => {
            if (isHotkey(KEY.ArrowUp, e) || isHotkey(KEY.ArrowDown, e) || isHotkey(KEY.ArrowRight, e) || isHotkey(KEY.ArrowLeft, e)) {
              e.stopPropagation()
            }
          }}
          scrollElementRef={scrollElementRef}
          style={useMemo(
            () => ({
              paddingBottom: readonly || editor.noBottomPadding ? 0 : undefined,
              display: 'flex',
              flexDirection: 'column'
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
