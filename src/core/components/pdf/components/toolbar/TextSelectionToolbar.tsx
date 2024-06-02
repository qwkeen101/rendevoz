import { Button, Toolbar } from '@/components'
import { TextSelectEvent } from '~/typings/event'
import { FC, useEffect } from 'react'
import { getSetting } from '@/core'
import { KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import isHotkey from 'is-hotkey'

interface TextSelectionToolbarProps {
  textSelect?: TextSelectEvent
  onTranslate?: (e: React.MouseEvent) => void
  onHighlight?: (color: string, specType?: 'underline') => void
  onSearch?: (e: React.MouseEvent) => void
  onClose?: VoidFunction
}
const TextSelectionToolbar: FC<TextSelectionToolbarProps> = ({ textSelect, onClose, onHighlight, onTranslate, onSearch }) => {
  const defaultLabelColor = getSetting().pdf.defaultLabelColor || '#ffe082'
  const { t } = useTranslation()
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      setTimeout(() => {
        if (!e.defaultPrevented) {
          if (isHotkey(KEY.Enter, e)) {
            onHighlight?.(defaultLabelColor)
          }
        }
      })
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])
  return (
    <Toolbar
      itemRadius={0}
      style={{
        gap: 0,
        height: '32px',
        overflow: 'hidden',
        borderRadius: 5
      }}
      itemStyle={{
        padding: '0px 8px',
        height: '100%'
      }}
      itemClickPreventDefault
      itemSize={16}
    >
      <Toolbar.Item
        onClick={e => {
          onHighlight?.(defaultLabelColor)
        }}
        style={{
          borderRight: '1px solid var(--border-background)',
          padding: '0px 12px 0 10px'
        }}
      >
        <Button.IconButton
          style={{
            background: 'unset',
            padding: '0px'
          }}
          icon={'park-high-light'}
          text={t('general.Highlight')}
        />
      </Toolbar.Item>
      <Toolbar.Item
        onClick={e => {
          onHighlight?.(defaultLabelColor, 'underline')
        }}
        style={{
          borderRight: '1px solid var(--border-background)',
          padding: '0px 12px 0 10px'
        }}
      >
        <Button.IconButton
          style={{
            background: 'unset',
            padding: '0px'
          }}
          icon={'park-text-underline'}
          text={t('editor.underline')}
        />
      </Toolbar.Item>
      <Toolbar.Item
        onClick={e => {
          toast.success(t('general.Copied'))
          textSelect?.selectedText && navigator.clipboard.writeText(textSelect?.selectedText)
          onClose?.()
        }}
        style={{
          borderRight: '1px solid var(--border-background)',
          padding: '0px 12px 0 10px'
        }}
      >
        <Button.IconButton
          style={{
            background: 'unset',
            padding: '0px'
          }}
          icon={'park-copy-one'}
          text={t('general.Copy')}
        />
      </Toolbar.Item>
      <Toolbar.Item iconName="park-translate" onClick={e => onTranslate?.(e)}></Toolbar.Item>
      <Toolbar.Item iconName="park-search" onClick={onSearch}></Toolbar.Item>
    </Toolbar>
  )
}

export default TextSelectionToolbar
