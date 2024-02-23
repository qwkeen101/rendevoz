import { Content, Icon } from '@/components'
import { KEY } from '@/consts'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { CSSProperties, useRef, useState } from 'react'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
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
  showDelete
}: {
  value?: string
  onChange: (v: string) => void
  style?: CSSProperties
  placeholder?: string
  onCancel?: VoidFunction
  onDelete?: VoidFunction
  showDelete?: boolean
  contentMode?: 'textarea' | 'editor'
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
      {contentMode === 'textarea' ? (
        <AutosizeTextarea
          autoFocus
          className={ClassName.noStyleInput}
          ref={inputRef}
          minRows={2}
          maxRows={999}
          spellCheck="false"
          style={{
            resize: 'none',
            fontWeight: 400,
            padding: 0,
            width: '100%',
            fontSize: FontSize['13px']
          }}
          onKeyDown={e => {
            if (isHotkey(KEY.Escape, e)) {
              onChange(value)
              onCancel?.()
            }
            if (isHotkey(KEY.Enter, e)) {
              e.preventDefault()
              onChange(e.target.value)
            }
          }}
          placeholder={placeholder}
          defaultValue={value}
          onChange={e => setInnerValue(e.target.value)}
        ></AutosizeTextarea>
      ) : (
        <SimpleEditor fontSize={14} textareaMode={true} placeholder={placeholder} value={value} onChange={e => setInnerValue(e)} />
      )}
      <Content flex gap={6} justifyContent={'flex-end'} alignItems={'center'} style={{ fontWeight: '500', fontSize: 12, lineHeight: 1 }}>
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
          name={'park-send-one'}
          size={18}
          className={ClassName.circleButton()}
          style={{
            color: 'var(--select-color)',
            cursor: 'pointer'
          }}
          tooltip={t('general.Save')}
          onClick={() => onChange?.(innerValue)}
        ></Icon>
      </Content>
    </Content>
  )
}

export default NameEditor
