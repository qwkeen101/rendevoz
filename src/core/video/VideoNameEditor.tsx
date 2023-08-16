import { Content, Icon } from '@/components'
import { KEY } from '@/consts'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { CSSProperties, useRef, useState } from 'react'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'

const NameEditor = ({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: CSSProperties }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [innerValue, setInnerValue] = useState(value)
  const { t } = useTranslation()
  return (
    <Content
      onClick={e => e.stopPropagation()}
      style={{
        border: `1px solid ${Colors.Background.Border}`,
        padding: '2px 4px',
        borderRadius: 6,
        ...style
      }}
      flex
      alignItems="center"
    >
      <AutosizeTextarea
        autoFocus
        className={ClassName.noStyleInput}
        ref={inputRef}
        minRows={2}
        maxRows={999}
        style={{
          paddingBottom: 10,
          resize: 'none'
        }}
        defaultValue={value}
        onChange={e => setInnerValue(e.target.value)}
      ></AutosizeTextarea>
      <div
        style={{
          position: 'absolute',
          right: 10,
          bottom: 3,
          cursor: 'pointer'
        }}
        className={ClassName.description(FontSize['12px'])}
        onClick={() => onChange?.(innerValue)}
      >
        {t('general.Confirm')}
      </div>
    </Content>
  )
}

export default NameEditor
