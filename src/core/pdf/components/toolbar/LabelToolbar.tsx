import { Noop } from '@/common/types'
import { IconPicker, Toolbar, WithBorder, IconWithPopover } from '@/components'
import BlockColorPicker from '@/core/editor/components/BlockColorPicker'
import { FC, memo } from 'react'
import { IHighlightLabel } from '~/typings'

type Layout =
  | 'colorPicker'
  | 'iconPicker'
  | 'contentInput'
  | 'separator'
  | 'addToEditorButton'
  | 'movableToggle'
  | 'translator'
  | 'searcher'
  | 'delete'
  | 'direction'
  | 'copy'

type LabelToolbarProps = {
  color?: string
  movable?: boolean
  content?: string
  selectedText?: string
  specType?: IHighlightLabel['specHighlightType']
  onTranslate?: React.MouseEventHandler
  onMovableChange?: Noop
  onIconChange?: (icon: string) => void
  onColorChange?: (color: string) => void
  onCopy?: VoidFunction
  onDelete?: Noop
  onContentChange?: (value: string) => void
  onDirectionChange?: Noop
  onSearch?: React.MouseEventHandler
  layout?: Layout[]
}

const Icons = [
  'park-info',
  'park-bookmark',
  'park-dislike',
  'park-like',
  'park-caution',
  'park-link',
  'park-picture',
  'park-view-list',
  'park-quote',
  'park-help'
]
const LabelToolbar: FC<LabelToolbarProps> = ({
  onColorChange,
  onIconChange,
  onMovableChange,
  onDelete,
  onTranslate,
  selectedText,
  onSearch,
  color,
  movable = false,
  layout = ['colorPicker', 'iconPicker', 'contentInput', 'separator', 'addToEditorButton', 'movableToggle', 'direction', 'delete']
}) => {
  const ColorPickerItem = (
    <Toolbar.Item key="colorPicker">
      <IconWithPopover
        disableNudge
        name="park-background-color"
        color={color}
        content={<BlockColorPicker bgBackDefault={false} showFont={false} onPickBackgroundColor={onColorChange} />}
      ></IconWithPopover>
    </Toolbar.Item>
  )

  const IconPickerItem = (
    <Toolbar.Item key="iconPicker">
      <IconWithPopover
        name="park-graphic-design"
        content={
          <WithBorder>
            <IconPicker onIconPick={icon => onIconChange?.(icon)} icons={Icons} />
          </WithBorder>
        }
      />
    </Toolbar.Item>
  )

  const MovableToggleItem = (
    <Toolbar.Item
      key="move"
      onClick={e => {
        onMovableChange?.()
        e.stopPropagation()
      }}
      iconName={!movable ? 'park-move' : 'custom-move-block'}
    />
  )

  const Separator = <Toolbar.Separator key="separator" />

  const TranslatorItem = <Toolbar.Item key="translate" iconName="park-translate" onClick={onTranslate}></Toolbar.Item>

  const SearcherItem = <Toolbar.Item key="search" iconName="park-search" onClick={onSearch}></Toolbar.Item>
  const CopyItem = (
    <Toolbar.Item
      key="copy"
      iconName="park-copy-one"
      onClick={() => {
        if (selectedText) {
          navigator.clipboard.writeText(selectedText)
        }
      }}
    ></Toolbar.Item>
  )
  const DeleteItem = <Toolbar.Item key="delete" iconName="park-delete" onClick={onDelete}></Toolbar.Item>
  const toolbarRenderer = () => {
    return layout.map(i => {
      switch (i) {
        case 'colorPicker':
          return ColorPickerItem
        case 'iconPicker':
          return IconPickerItem
        case 'movableToggle':
          return MovableToggleItem
        case 'separator':
          return Separator
        case 'translator':
          return TranslatorItem
        case 'searcher':
          return SearcherItem
        case 'delete':
          return DeleteItem
        case 'copy':
          return CopyItem
      }
    })
  }
  return <Toolbar>{toolbarRenderer()}</Toolbar>
}

export default memo(LabelToolbar)
