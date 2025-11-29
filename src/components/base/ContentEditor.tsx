import { Content, Icon, AutosizeTextarea } from '@/components'
import { KEY } from '@/consts'
import isHotkey from 'is-hotkey'
import { CSSProperties, useRef, useState } from 'react'
import SimpleEditor from '@/core/components/editor/SimpleEditor'
import classnames from 'classnames'

const NameEditor = ({
  value,
  onChange,
  style,
  contentMode = 'textarea',
  placeholder = '',
  onCancel,
  editorStyle,
  className
}: {
  value?: string
  onChange: (v: string) => void
  style?: CSSProperties
  className?: string
  placeholder?: string
  onCancel?: VoidFunction
  editorStyle?: CSSProperties
  contentMode?: 'textarea' | 'editor'
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [innerValue, setInnerValue] = useState(value)
  return (
    <Content
      onClick={e => e.stopPropagation()}
      className={classnames(
        'border-box-shadow flex flex-wrap items-center gap-1 justify-end focus-within-input py-1.5 pr-1.5 pl-2 rounded-md w-full font-size-13',
        className
      )}
      style={style}
    >
      {contentMode === 'textarea' ? (
        <AutosizeTextarea
          autoFocus
          ref={inputRef}
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
      <Icon
        name={'park-up-small'}
        size={15}
        strokeWidth={5}
        className={'select-button !rounded-full !p-1'}
        style={{
          color: 'white'
        }}
        onClick={() => onChange?.(innerValue)}
      ></Icon>
    </Content>
  )
}

export default NameEditor
