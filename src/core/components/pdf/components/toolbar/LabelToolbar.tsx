import { Noop } from '@/common/types'
import { IconPicker, IconWithPopover, Toolbar, WithBorder } from '@/components'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import { FC, memo } from 'react'
import { IHighlightLabel } from '~/typings'
import { useTranslation } from 'react-i18next'

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
  | 'rightBar'

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
  onOpenInSidebar?: VoidFunction
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
  onOpenInSidebar,
  selectedText,
  onSearch,
  color,
  movable = false,
  layout = ['colorPicker', 'iconPicker', 'contentInput', 'separator', 'addToEditorButton', 'movableToggle', 'direction', 'delete']
}) => {
  const { t } = useTranslation()
  const ColorPickerItem = (
    <Toolbar.Item tooltip={t('general.Background color')} key="colorPicker">
      <IconWithPopover
        disableNudge
        name="park-background-color"
        color={color}
        content={setV => (
          <BlockColorPicker
            bgBackDefault={false}
            showFont={false}
            onPickBackgroundColor={c => {
              onColorChange?.(c)
              setV(false)
            }}
          />
        )}
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

  const TranslatorItem = (
    <Toolbar.Item tooltip={t('general.Translate')} key="translate" iconName="park-translate" onClick={onTranslate}></Toolbar.Item>
  )

  const SearcherItem = (
    <Toolbar.Item tooltip={t('general.Search online')} key="search" iconName="park-search" onClick={onSearch}></Toolbar.Item>
  )
  const CopyItem = (
    <Toolbar.Item
      key="copy"
      tooltip={t('general.Copy')}
      iconName="park-copy-one"
      onClick={() => {
        if (selectedText) {
          navigator.clipboard.writeText(selectedText)
        }
      }}
    ></Toolbar.Item>
  )
  const RightBarItem = (
    <Toolbar.Item
      key="rightBar"
      tooltip={t('general.Open in sidebar')}
      iconName="park-arrow-right-up"
      onClick={() => {
        onOpenInSidebar?.()
      }}
    ></Toolbar.Item>
  )
  const DeleteItem = <Toolbar.Item key="delete" tooltip={t('general.delete')} iconName="park-delete" onClick={onDelete}></Toolbar.Item>
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
        case 'rightBar':
          return RightBarItem
      }
    })
  }
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
      {toolbarRenderer()}
    </Toolbar>
  )
}

export default memo(LabelToolbar)
