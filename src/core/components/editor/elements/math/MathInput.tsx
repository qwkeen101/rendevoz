import { Content, Icon } from '@/components'
import AutosizeTextarea from '@/components/custom/input/AutoSizeTextArea'
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
    const inputRef = useRef<HTMLDivElement>(null)
    const { t } = useTranslation()
    useEffect(() => {
      setTimeout(() => {
        inputRef.current?.focus()
        if (window.getSelection && inputRef.current) {
          const selection = window.getSelection()!
          const range = document.createRange()
          range.selectNodeContents(inputRef.current)
          selection.removeAllRanges()
          selection.addRange(range)
        }
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
          placeholder={isInline ? 'x^n + y^n = z^n' : '\\begin{align*}\n' + '  f(x) &= x^2\\\\\n' + '\\end{align*}'}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              e.preventDefault()
              onComplete(e.currentTarget.innerText ?? '')
            }
          }}
          onChange={e => {
            onChange(e)
          }}
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            overflow: 'auto',
            fontSize: 14,
            flex: '1 1 0%',
            resize: 'none',
            padding: 0,
            display: 'block',
            maxHeight: '50vh',
            minHeight: isInline ? '1lh' : '3lh'
          }}
          defaultValue={defaultValue}
        />
        <Content
          onClick={e => {
            const v = e.currentTarget.previousElementSibling?.innerText
            if (v !== undefined) {
              onComplete(v)
            }
          }}
          className={'select-button'}
          style={{ fontSize: 14, height: 28, alignSelf: 'flex-start', flexShrink: 0 }}
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
