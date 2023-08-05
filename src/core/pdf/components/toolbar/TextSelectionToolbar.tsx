import { IconWithPopover, Toolbar } from '@/components'
import BlockColorPicker from '@/core/editor/components/BlockColorPicker'
import { TextSelectEvent } from '~/typings/event'
import { FC } from 'react'

interface TextSelectionToolbarProps {
  textSelect?: TextSelectEvent
  onTranslate?: (e: React.MouseEvent) => void
  onHighlight?: (color: string, specType?: 'underline') => void
  onSearch?: (e: React.MouseEvent) => void
}
const TextSelectionToolbar: FC<TextSelectionToolbarProps> = ({ textSelect, onHighlight, onTranslate, onSearch }) => {
  return (
    <Toolbar>
      <Toolbar.Item
        iconName="park-copy-one"
        onClick={e => textSelect?.selectedText && navigator.clipboard.writeText(textSelect?.selectedText)}
      ></Toolbar.Item>
      <Toolbar.Item iconName="park-search" onClick={onSearch}></Toolbar.Item>
      <Toolbar.Item iconName="park-translate" onClick={e => onTranslate?.(e)}></Toolbar.Item>
      <Toolbar.Item
        iconName="park-text-underline"
        onClick={() => {
          onHighlight?.('#ffecb3', 'underline')
        }}
      ></Toolbar.Item>
      <Toolbar.Item
        iconName="park-background-color"
        onClick={() => {
          onHighlight?.('#ffecb3')
        }}
      ></Toolbar.Item>
    </Toolbar>
  )
}

export default TextSelectionToolbar
