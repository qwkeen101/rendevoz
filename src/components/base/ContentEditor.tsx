import { Content, Icon } from '@/components'
import { KEY } from '@/consts'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { CSSProperties, useRef, useState } from 'react'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'

const NameEditor = ({
  value,
  onChange,
  style,
  placeholder = 'Edit content...'
}: {
  value?: string
  onChange: (v: string) => void
  style?: CSSProperties
  placeholder?: string
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [innerValue, setInnerValue] = useState(value)
  const { t } = useTranslation()
  return (
    <Content
      onClick={e => e.stopPropagation()}
      style={{
        boxShadow: `0 0 0 2px ${Colors.Common.SelectColor}`,
        padding: '2px 6px 5px',
        borderRadius: 4,
        width: '100%',
        marginBottom: 4,
        ...style
      }}
    >
      <AutosizeTextarea
        autoFocus
        className={ClassName.noStyleInput}
        ref={inputRef}
        minRows={2}
        maxRows={999}
        spellCheck="false"
        style={{
          resize: 'none',
          fontWeight: 500,
          padding: 0,
          width: '100%',
          fontSize: FontSize['13px']
        }}
        onKeyDown={e => {
          if (isHotkey(KEY.Escape, e)) {
            onChange(value)
          }
        }}
        placeholder={placeholder}
        defaultValue={value}
        onChange={e => setInnerValue(e.target.value)}
      ></AutosizeTextarea>
      <Content flex gap={12} justifyContent={'flex-end'} alignItems={'center'} style={{ fontWeight: '500', fontSize: 12, lineHeight: 1 }}>
        <div
          style={{
            cursor: 'pointer'
          }}
          onClick={() => onChange?.(value)}
        >
          {t('general.Cancel')}
        </div>
        <div
          style={{
            color: '#76b2ed',
            padding: '6px 10px',
            background: Colors.Background.ButtonActive,
            cursor: 'pointer',
            borderRadius: 48
          }}
          onClick={() => onChange?.(innerValue)}
        >
          {t('general.Save')}
        </div>
      </Content>
    </Content>
  )
}

export default NameEditor
