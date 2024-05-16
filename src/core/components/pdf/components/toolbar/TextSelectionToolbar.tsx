import { Button, Toolbar } from '@/components'
import { TextSelectEvent } from '~/typings/event'
import { FC } from 'react'
import { getSetting } from '@/core'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

interface TextSelectionToolbarProps {
  textSelect?: TextSelectEvent
  onTranslate?: (e: React.MouseEvent) => void
  onHighlight?: (color: string, specType?: 'underline') => void
  onSearch?: (e: React.MouseEvent) => void
  onClose?: VoidFunction
}
const TextSelectionToolbar: FC<TextSelectionToolbarProps> = ({ textSelect, onClose, onHighlight, onTranslate, onSearch }) => {
  const defaultLabelColor = getSetting().pdf.defaultLabelColor || '#ffe082'
  const instance = usePDFInstance()
  const { t } = useTranslation()
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
      itemSize={18}
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
          icon={'park-background-color'}
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
