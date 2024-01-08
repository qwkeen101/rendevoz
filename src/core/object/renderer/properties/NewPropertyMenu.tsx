import { Menu, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { IMetaProp } from '~/typings'

export default ({ onClose, onAddProp }: { onClose?: VoidFunction; onAddProp?: (prop: Partial<IMetaProp>) => void }) => {
  const { t } = useTranslation()
  return (
    <WithBorder padding={'0.25rem 0'}>
      <Menu.NavigationMenu
        onSelect={item => {
          onClose?.()
          onAddProp?.({
            propType: item.key,
            icon: item.icon,
            name: item.text
          })
        }}
        layout={[
          {
            type: 'item',
            text: 'Text',
            key: 'string',
            icon: 'park-add-text'
          },
          {
            type: 'item',
            text: 'Number',
            key: 'number',
            icon: 'park-pound'
          },
          {
            type: 'item',
            text: 'Select',
            key: 'singleSelect',
            icon: 'park-radio-two'
          },
          {
            type: 'item',
            text: 'Multi-select',
            key: 'multiSelect',
            icon: 'park-list-checkbox'
          },
          {
            type: 'item',
            text: 'Date',
            key: 'date',
            icon: 'park-schedule'
          },
          {
            type: 'item',
            text: 'Checkbox',
            key: 'checkbox',
            icon: 'park-check-correct'
          },
          {
            type: 'item',
            text: 'URL',
            key: 'URL',
            icon: 'park-link-one'
          },
          {
            type: 'item',
            text: 'File',
            key: 'file',
            icon: 'park-link'
          }
        ].map(i => ({ ...i, text: t(`general.${i.text}`) }))}
      />
    </WithBorder>
  )
}
