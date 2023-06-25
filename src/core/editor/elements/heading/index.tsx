import { Icon } from '@/components'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { useDebounceFn, useToggle } from '@/hooks'
import { cloneElement, FC, ReactElement, useEffect, useRef, useState } from 'react'
import { Editor, Path, Range, Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { CustomElement, HeadingElement } from '~/typings'
import { useEventHandler } from '@/events'
import useReadOnlyEditor from '../../hooks/useReadOnly'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import useEditorInstance from '../../hooks/useEditorInstance'
import { debounce, head } from 'lodash'
import { useSetAtom } from 'jotai'
import { EditorStateAtom } from '../../hooks/useEditorState'
import { ID_TO_VISIBLE_HEADING_MAP } from '../../weakMaps'

const HeadingToLevel: Partial<Record<CustomElement['type'], number>> = {
  'heading-one': 1,
  'heading-two': 2,
  'heading-three': 3,
  'heading-four': 4,
  'heading-five': 5,
  'heading-six': 6
}
const HeadingToElement: Partial<Record<CustomElement['type'], ReactElement>> = {
  'heading-one': <h1></h1>,
  'heading-two': <h2></h2>,
  'heading-three': <h3></h3>,
  'heading-four': <h4></h4>,
  'heading-five': <h5></h5>,
  'heading-six': <h6></h6>
}
const Heading: FC<RenderElementProps> = ({ element, children }) => {
  const { folded } = element as HeadingElement
  const editor = useSlateStatic()
  const isEmpty = Editor.isEmpty(editor, element) ? true : false
  const [isComposing, setIsComposing] = useState(false)
  const [showAction, toggleShowAction] = useToggle(false)
  const [containElements, setContainElements] = useState(0)
  const isReadOnly = useReadOnlyEditor()
  const emitter = useScopedEventEmitter()
  const handler = useEventHandler('editor')
  const instance = useEditorInstance()
  const headingRef = useRef<HTMLElement>(null)
  const setEditorState = useSetAtom(EditorStateAtom)
  const calculateContainElements = () => {
    let currentPath = ReactEditor.findPath(editor, element)
    let containEles = 0
    const parentEle = Editor.node(editor, Path.parent(currentPath))[0]
    let currIdx = parentEle.children.findIndex(i => i === element) + 1
    while (parentEle.children[currIdx] && !parentEle.children[currIdx]?.type?.startsWith('heading')) {
      currentPath = Path.next(currentPath)
      currIdx += 1
      containEles += 1
    }
    setContainElements(containEles)
  }

  const debounceCal = useDebounceFn(calculateContainElements, { wait: 300 })

  useEffect(() => {
    handler.on('valueChange', () => {
      debounceCal.run()
    })
    handler.on('compositionEnd', () => {
      setIsComposing(false)
    })
    handler.on('compositionStart', () => {
      const path = ReactEditor.findPath(editor, element)
      if (editor.selection && Range.includes(editor.selection, path)) {
        setIsComposing(true)
      }
    })
    const ID_TO_HEADING = ID_TO_VISIBLE_HEADING_MAP.get(editor) || new Map()
    ID_TO_HEADING.set(element.id, headingRef.current)
    ID_TO_VISIBLE_HEADING_MAP.set(editor, ID_TO_HEADING)
    emitter.addListener('editor', handler)
    calculateContainElements()
    return () => {
      ID_TO_HEADING.delete(element.id)
      emitter.removeListener('editor', handler)
    }
  }, [])

  const action = () => {
    return (
      <span
        contentEditable={false}
        style={{
          position: 'absolute',
          left: -25,
          opacity: showAction ? 1 : 0,
          transition: 'opacity 0.2s ease',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      >
        <div
          onClick={e => {
            Transforms.deselect(editor)
            e.stopPropagation()
            e.preventDefault()
            let currentPath = ReactEditor.findPath(editor, element)
            const parentEle = Editor.node(editor, Path.parent(currentPath))[0]
            let currIdx = parentEle.children.findIndex(i => i === element) + 1
            while (parentEle.children[currIdx] && !parentEle.children[currIdx].type.startsWith('heading')) {
              currentPath = Path.next(currentPath)
              editor.apply({
                type: 'set_node',
                path: currentPath,
                properties: {
                  hide: folded
                },
                newProperties: {
                  hide: !folded
                }
              })
              currIdx += 1
            }
            Transforms.setNodes(
              editor,
              {
                folded: !folded
              },
              { at: ReactEditor.findPath(editor, element) }
            )
          }}
        >
          <Icon
            theme="filled"
            name="park-right-one"
            size={20}
            style={{
              cursor: 'pointer',
              transform: !folded ? 'rotate(90deg)' : undefined,
              transition: 'transform 0.3s ease'
            }}
          />
        </div>
      </span>
    )
  }

  return cloneElement(
    HeadingToElement[element.type] || <h1></h1>,
    {
      id: element.id,
      suppressContentEditableWarning: true,
      onPointerEnter: () => toggleShowAction(true),
      onPointerLeave: () => toggleShowAction(false),
      style: {
        paddingRight: 50
      },
      ref: headingRef
    },
    !isReadOnly && action(),
    children,
    containElements > 0 && (
      <span
        contentEditable={false}
        style={{
          padding: 8,
          borderRadius: 8,
          background: Colors.Background.ButtonHover,
          color: Colors.Font.Description,
          fontSize: FontSize['15px'],
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          lineHeight: 1
        }}
      >
        {containElements}
      </span>
    ),
    isEmpty && !isComposing && (
      <div
        contentEditable={false}
        style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', userSelect: 'none', color: Colors.Font.Tertiary }}
      >
        H{HeadingToLevel[element.type]}
      </div>
    )
  )
}

export default Heading
