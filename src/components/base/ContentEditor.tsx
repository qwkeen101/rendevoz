import { Content, Icon } from '@/components'
import { KEY } from '@/consts'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { CSSProperties, useRef, useState } from 'react'
import AutosizeTextarea from '@/components/custom/input/AutoSizeTextArea'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import SimpleEditor from '@/core/components/editor/SimpleEditor'

const NameEditor = ({
  value,
  onChange,
  style,
  contentMode = 'textarea',
  placeholder = 'Edit content...',
  onCancel,
  onDelete,
  showDelete,
  editorStyle
}: {
  value?: string
  onChange: (v: string) => void
  style?: CSSProperties
  placeholder?: string
  onCancel?: VoidFunction
  editorStyle?: CSSProperties
  onDelete?: VoidFunction
  showDelete?: boolean
  contentMode?: 'textarea' | 'editor'
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [innerValue, setInnerValue] = useState(value)
  return (
    <Content
      onClick={e => e.stopPropagation()}
      className={'border-box-shadow focus-within-input'}
      style={{
        padding: '5px 6px',
        borderRadius: 4,
        width: '100%',
        flexWrap: 'wrap',
        gap: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        fontSize: 13,
        ...style
      }}
    >
      {contentMode === 'textarea' ? (
        <AutosizeTextarea
          autoFocus
          ref={inputRef}
          spellCheck="false"
          style={{
            resize: 'none',
            padding: 0,
            flexGrow: 1,
            maxWidth: '100%',
            width: innerValue?.length && innerValue.includes('\n') ? '100%' : undefined,
            minHeight: '1lh',
            ...editorStyle
          }}
          onKeyDown={e => {
            if (isHotkey(KEY.Escape, e)) {
              onChange(value)
              e.preventDefault()
              onCancel?.()
            }
            if (isHotkey(KEY.Enter, e)) {
              e.preventDefault()
              onChange(e.currentTarget.innerText)
            }
          }}
          placeholder={placeholder}
          value={value}
          onChange={e => setInnerValue(e)}
        ></AutosizeTextarea>
      ) : (
        <SimpleEditor fontSize={13} textareaMode={true} placeholder={placeholder} value={value} onChange={e => setInnerValue(e)} />
      )}
      <Content flex gap={6} justifyContent={'flex-end'} alignItems={'center'} style={{ width: 'min-content' }}>
        {showDelete && (
          <Icon
            name={'park-delete'}
            style={{
              color: Colors.Common.Red
            }}
            onClick={() => onDelete?.()}
            size={18}
            className={ClassName.circleButton()}
          />
        )}
        <Icon
          name={'park-up-small'}
          size={15}
          strokeWidth={5}
          className={ClassName.selectButton()}
          style={{
            color: 'white',
            padding: 2,
            borderRadius: 999
          }}
          onClick={() => onChange?.(innerValue)}
        ></Icon>
      </Content>
    </Content>
  )
}

export default NameEditor
