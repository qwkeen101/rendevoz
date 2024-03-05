import { Content, Icon } from '@/components'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { ClassName } from 'rendevoz'
import { memo, useEffect, useRef } from 'react'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { useTranslation } from 'react-i18next'

export default memo(
  ({
    defaultValue,
    onChange,
    isInline,
    onComplete
  }: {
    onChange: (v: string) => void
    defaultValue: string
    isInline: boolean
    onComplete: (v: string) => void
  }) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const { t } = useTranslation()
    useEffect(() => {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
    }, [])
    return (
      <Content
        flex
        alignItems={'center'}
        style={{
          padding: '8px 10px'
        }}
        gap={8}
        contentEditable={'false'}
      >
        <AutosizeTextarea
          ref={inputRef}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              e.preventDefault()
              onComplete(e.currentTarget.value)
            }
          }}
          onChange={e => {
            onChange(e.target.value)
          }}
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            overflow: 'auto',
            fontSize: 14,
            flex: '1 1 0%',
            resize: 'none',
            padding: 0,
            display: 'block'
          }}
          minRows={isInline ? 1 : 3}
          maxRows={8}
          defaultValue={defaultValue}
        />
        <Content
          onClick={e => {
            const v = e.currentTarget.previousElementSibling?.value
            if (v !== undefined) {
              onComplete(v)
            }
          }}
          className={ClassName.selectButton()}
          style={{ fontSize: 14, height: 28, fontWeight: 500, alignSelf: 'flex-start', flexShrink: 0 }}
          flex
          gap={8}
          alignItems={'center'}
        >
          {t('general.Done')}
          <Icon name={'park-corner-down-left'} />
        </Content>
      </Content>
    )
  }
)
