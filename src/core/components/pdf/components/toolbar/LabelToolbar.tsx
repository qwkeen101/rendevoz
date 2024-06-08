import { Noop } from '@/common/types'
import { Button, IconPicker, IconWithPopover, Toolbar, WithBorder } from '@/components'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import { FC, memo } from 'react'
import { IHighlightLabel } from '~/typings'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Colors } from '@/consts'

type Layout = 'move-to' | 'info' | 'colorPicker' | 'separator' | 'translator' | 'searcher' | 'delete' | 'copy' | 'rightBar' | 'edit'
type LabelToolbarProps = {
  color?: string
  selectedText?: string
  specType?: IHighlightLabel['specHighlightType']
  onTranslate?: React.MouseEventHandler
  onColorChange?: (color: string) => void
  onCopy?: VoidFunction
  onDelete?: Noop
  onOpenInSidebar?: VoidFunction
  onSearch?: React.MouseEventHandler
  layout?: Layout[]
  onMove?: VoidFunction
  onEdit?: VoidFunction
  onInfo?: VoidFunction
  onClose?: VoidFunction
}
const LabelToolbar: FC<LabelToolbarProps> = ({
  onColorChange,
  onMove,
  onEdit,
  onDelete,
  onTranslate,
  onOpenInSidebar,
  selectedText,
  onSearch,
  onInfo,
  color,
  onClose,
  layout = ['colorPicker', 'iconPicker', 'contentInput', 'separator', 'addToEditorButton', 'movableToggle', 'direction', 'delete']
}) => {
  const { t } = useTranslation()
  const ColorPickerItem = (
    <Toolbar.Item style={{ padding: 0 }} tooltip={t('general.Background color')} key="colorPicker">
      <IconWithPopover
        name="park-background-color"
        color={color}
        containerStyle={{
          height: '100%'
        }}
        iconContainerStyle={{
          padding: '0px 8px',
          height: '100%'
        }}
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
          toast.success(t('general.Copied'))
          navigator.clipboard.writeText(selectedText)
        }
        onClose?.()
      }}
    ></Toolbar.Item>
  )
  const RightBarItem = (
    <Toolbar.Item
      key="rightBar"
      tooltip={t('general.Open in sidebar')}
      iconName="park-arrow-left-up"
      onClick={() => {
        onOpenInSidebar?.()
      }}
    ></Toolbar.Item>
  )
  const DeleteItem = (
    <Toolbar.Item
      onClick={onDelete}
      style={{
        padding: '0px 12px 0 10px'
      }}
    >
      <Button.IconButton
        style={{
          background: 'unset',
          padding: '0px'
        }}
        icon={'park-delete-one'}
        text={t('general.delete')}
      />
    </Toolbar.Item>
  )
  const InfoItem = (
    <Toolbar.Item
      iconName="park-info"
      onClick={() => {
        onInfo?.()
        onClose?.()
      }}
    ></Toolbar.Item>
  )
  const EditItem = (
    <Toolbar.Item
      onClick={onEdit}
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
        icon={'park-edit'}
        text={t('general.edit')}
      />
    </Toolbar.Item>
  )
  const MovetoItem = <Toolbar.Item tooltip={t('general.Move to')} onClick={onMove} iconName={'park-corner-up-right'}></Toolbar.Item>
  const toolbarRenderer = () => {
    return layout.map(i => {
      switch (i) {
        case 'colorPicker':
          return ColorPickerItem
        case 'separator':
          return Separator
        case 'edit':
          return EditItem
        case 'move-to':
          return MovetoItem
        case 'translator':
          return TranslatorItem
        case 'searcher':
          return SearcherItem
        case 'delete':
          return DeleteItem
        case 'info':
          return InfoItem
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
