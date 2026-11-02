import { CSSProperties, useMemo, useRef, useState } from 'react'
import Id from './utils/id'
import { IEditorInstance } from '~/typings'
import NoteEditor from '../noteEditor/NoteEditor'

type SimpleEditorProps = {
  value?: string | import('slate').Descendant[]
  onChange?: (v: import('slate').Descendant[]) => void
  onInstanceInitialized?: (i: IEditorInstance) => void
  containerStyle?: CSSProperties
  placeholder?: string
  fontSize?: number
  readOnly?: boolean
  textareaMode?: boolean
  changeOnBlur?: boolean
  className?: string
  metaId?: number
  virtualizer?: boolean
  onClick?: React.MouseEventHandler
  lineHeight?: number
}

const SimpleEditor = ({
  value,
  onChange,
  lineHeight,
  onInstanceInitialized,
  containerStyle,
  fontSize = 17,
  readOnly = false,
  onClick,
  changeOnBlur = false,
  textareaMode,
  placeholder,
  className,
  virtualizer = false,
  metaId
}: SimpleEditorProps) => {
  const initialValue = useMemo(() => {
    if (value) {
      if (typeof value === 'string') {
        if (value.startsWith('[')) {
          const newV = JSON.parse(value)
          onChange?.(newV)
          return newV
        } else {
          const newV = value.split('\n').map(i => ({
            type: 'paragraph',
            id: Id.getId(),
            children: [
              {
                text: i
              }
            ]
          }))
          onChange?.(newV)
          return newV
        }
      }
      if (typeof value === 'object') {
        return value
      }
    }
    return [
      {
        type: 'paragraph',
        id: Id.getId(),
        children: [{ text: '' }]
      }
    ]
  }, [])
  const [innerValue, setInnerValue] = useState(initialValue)
  const ins = useRef<IEditorInstance>()
  return (
    <NoteEditor
      classNames={{
        editorContainerClassName: className
      }}
      metaId={metaId}
      placeholder={placeholder}
      textboxMode={textareaMode}
      onClick={onClick}
      on={e => {
        if (e.type === 'valueChange') {
          setInnerValue(e.value)
          if (!changeOnBlur) {
            onChange?.(e.value)
          }
        }
        if (e.type === 'blur') {
          if (changeOnBlur) {
            if (innerValue !== value) {
              onChange?.(innerValue)
            }
          }
        }
      }}
      defaultValue={initialValue}
      plugins={
        textareaMode
          ? {
              dragBlock: false,
              select: false,
              addUnderLastLine: false,
              blockHandle: false
            }
          : undefined
      }
      styles={{
        pageMinPadding: 0,
        containerHeight: 'auto',
        containerMaxHeight: '100%',
        containerStyle: {
          maxWidth: '100%',
          minWidth: '100%',
          ...containerStyle
        }
      }}
      readOnly={readOnly}
      state={{
        fontSize,
        pageWidth: 'Max',
        showSyncBlockShadow: false,
        lineSpacing: lineHeight ?? 1.57
      }}
      onInstanceInitialized={i => {
        onInstanceInitialized?.(i)
        ins.current = i
      }}
      toolbar={{
        highlight: false
      }}
      layout={{
        showTitle: false,
        showBlockHandle: false,
        virtualizer: virtualizer,
        showHeader: false,
        showBottomPadding: false,
        alwaysShowPlaceholder: !!placeholder
      }}
    />
  )
}

export default SimpleEditor
