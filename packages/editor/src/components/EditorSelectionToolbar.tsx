import { WithBorder, Button } from '@/components'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { Editor, Range } from 'slate'
import { useSlateStatic } from '../slate-react'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { Colors, Zindexes } from '../consts'
import { EditorStateAtom } from '../hooks/useEditorState'
import useReadOnlyEditor from '../hooks/useReadOnly'
import classnames from 'classnames'
import { CustomEditor } from '~/typings'

export type ToolbarAction = {
  key: string
  label: string
  icon?: string
  onClick?: (editor: CustomEditor) => void
}

export type ToolbarConfig = {
  actions?: ToolbarAction[]
}

type EditorToolbarEvents = {
  action: string
}
interface EditorToolbarProps {
  scrollElement?: HTMLElement | null
  style?: React.CSSProperties
  config?: ToolbarConfig
  onEvent?: (event: EditorToolbarEvents) => void
}

const defaultActions: ToolbarAction[] = [
  {
    key: 'bold',
    label: 'Bold',
    onClick: editor => toggleMark(editor, 'bold')
  },
  {
    key: 'italic',
    label: 'Italic',
    onClick: editor => toggleMark(editor, 'italic')
  },
  {
    key: 'underline',
    label: 'Underline',
    onClick: editor => toggleMark(editor, 'underline')
  }
]

const toggleMark = (editor: CustomEditor, format: string) => {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isMarkActive = (editor: CustomEditor, format: string) => {
  const marks = Editor.marks(editor)
  // @ts-ignore
  return marks ? marks[format] === true : false
}

const EditorToolbar: FC<EditorToolbarProps> = ({ scrollElement, config, style, onEvent }) => {
  const editor = useSlateStatic()
  const readOnly = useReadOnlyEditor()
  const toolbarOptions = useSelectAtomValue(EditorStateAtom, s => s.toolbar)
  const enableShowRightBar = useSelectAtomValue(EditorStateAtom, s => s.layout?.showHeader) !== false
  const actions = useMemo(() => config?.actions ?? toolbarOptions?.actions ?? defaultActions, [config?.actions, toolbarOptions?.actions])
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number; visible: boolean }>({
    top: 0,
    left: 0,
    visible: false
  })

  const updatePosition = useMemoizedFn(() => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) {
      setPosition(s => ({ ...s, visible: false }))
      return
    }
    setPosition({
      left: rect.left,
      top: rect.top - 40,
      visible: true
    })
  })

  useEffect(() => {
    const handleMouseUp = () => {
      const { selection } = editor
      if (!selection || Range.isCollapsed(selection)) {
        setPosition(s => ({ ...s, visible: false }))
        return
      }
      updatePosition()
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  if (readOnly) return null
  if (!position.visible && !toolbarOptions?.alwaysVisible && !enableShowRightBar) return null
  return (
    <div
      ref={toolbarRef}
      className={classnames('fixed z-50')}
      style={{
        top: position.top,
        left: position.left,
        zIndex: Zindexes.Toolbar,
        ...style
      }}
    >
      <WithBorder
        className="flex items-center gap-1 px-2 py-1 bg-white shadow-sm"
        style={{ borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: 'white' }}
      >
        {actions.map(action => (
          <Button
            key={action.key}
            className="hover-active-button px-2 py-1"
            onClick={() => {
              action.onClick?.(editor as CustomEditor)
              onEvent?.({ action: action.key })
            }}
            style={{ fontSize: 12, color: Colors.Font?.Primary ?? '#111' }}
          >
            {action.label}
          </Button>
        ))}
      </WithBorder>
    </div>
  )
}

export default EditorToolbar
