import { Editor } from '@/core'
import { CSSProperties, useMemo, useRef, useState } from 'react'
import Id from '@/utils/id'
import { IEditorInstance } from '~/typings'
import { css } from '@emotion/css'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import { useUpdateEffect } from '@/hooks'

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
  metaId?: number
  replaceValueOnChange?: boolean
  disableScrollIntoView?: boolean
  virtualizer?: boolean
  onClick?: React.MouseEventHandler
}

const textAreaClassname = css({
  p: {
    padding: 0
  },
  '.ParagraphBlock': {
    margin: '1px 0px',
    borderRadius: 0
  }
})
const SimpleEditor = ({
  value,
  onChange,
  onInstanceInitialized,
  containerStyle,
  fontSize = 17,
  replaceValueOnChange = false,
  readOnly = false,
  onClick,
  changeOnBlur = false,
  disableScrollIntoView,
  textareaMode,
  placeholder,
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
  useUpdateEffect(() => {
    if (replaceValueOnChange) {
      if (Array.isArray(value) || value === undefined) {
        setInnerValue(value)
        ins.current?.replaceChildren?.(value || [{ type: 'paragraph', children: [{ text: '' }], id: Id.getId() }])
      }
    }
  }, [value])
  return (
    <NoteEditor
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
        typeface: 'Inter',
        lineSpacing: 1.57
      }}
      classNames={{
        editorContainerClassName: textareaMode ? textAreaClassname : undefined
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
        canScrollIntoView: !disableScrollIntoView,
        alwaysShowPlaceholder: !!placeholder
      }}
    />
  )
}

export default SimpleEditor
