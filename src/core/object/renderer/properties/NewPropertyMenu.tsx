import { Menu, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { IMetaProp } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useMemo } from 'react'

export default ({ onClose, onAddProp }: { onClose?: VoidFunction; onAddProp?: (prop: Partial<IMetaProp>) => void }) => {
  const { t } = useTranslation()
  const allPropKeys = MetaStore.useIndexedMetaObjects()?.propToMetaObjectIdsMap
  const keys = useMemo(() => {
    return allPropKeys?.keys() || []
  }, [allPropKeys])
  const allProps = ObjectStore('metaProp').useMultiple(keys)
  return (
    <WithBorder padding={'0.25rem 0'}>
      <Menu.NavigationMenu
        onSelect={item => {
          console.log(item)
          onClose?.()
          onAddProp?.({
            propType: item.propType,
            icon: item.icon,
            name: item.text,
            id: item.id
          })
        }}
        layout={[
          {
            type: 'item',
            icon: 'park-all-application',
            text: 'Existing properties',
            key: 'existing-props',
            subMenu: allProps.map(i => ({
              type: 'item',
              key: i.id,
              text: i.name,
              icon: i.icon,
              id: i.id,
              propType: i.propType
            }))
          },
          {
            type: 'item',
            text: 'Text',
            key: 'string',
            propType: 'string',
            icon: 'park-add-text'
          },
          {
            type: 'item',
            text: 'Number',
            key: 'number',
            propType: 'number',
            icon: 'park-pound'
          },
          {
            type: 'item',
            text: 'Select',
            key: 'singleSelect',
            propType: 'singleSelect',
            icon: 'park-radio-two'
          },
          {
            type: 'item',
            text: 'Multi-select',
            key: 'multiSelect',
            propType: 'multiSelect',
            icon: 'park-list-checkbox'
          },
          {
            type: 'item',
            text: 'Date',
            key: 'date',
            propType: 'date',
            icon: 'park-schedule'
          },
          {
            type: 'item',
            text: 'Checkbox',
            propType: 'checkbox',
            key: 'checkbox',
            icon: 'park-check-correct'
          },
          {
            type: 'item',
            text: 'URL',
            key: 'URL',
            propType: 'URL',
            icon: 'park-link-one'
          },
          {
            type: 'item',
            text: 'File',
            propType: 'file',
            key: 'file',
            icon: 'park-link'
          }
        ].map(i => ({ ...i, text: t(`general.${i.text}`) }))}
      />
    </WithBorder>
  )
}
