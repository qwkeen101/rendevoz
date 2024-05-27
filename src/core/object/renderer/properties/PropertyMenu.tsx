import { Content, Icon, Menu, WithBorder } from '@/components'
import { IMetaProp } from '~/typings'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { ClassName } from 'rendevoz'

export default ({
  property,
  editable,
  show
}: {
  property: IMetaProp
  editable?: boolean
  show?: {
    delete?: boolean
    hide?: boolean
  }
}) => {
  const instance = useGroupInstance()
  const { t } = useTranslation()

  return (
    <WithBorder
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
      padding={'0 0 0.25rem'}
    >
      <Content
        flex
        gap={8}
        style={{
          width: '100%',
          padding: '12px'
        }}
      >
        {property.icon && <Icon name={property.icon} />}
        <input
          style={{
            padding: '3px 6px',
            lineHeight: '20px',
            borderRadius: 4,
            cursor: editable ? 'text' : 'not-allowed'
          }}
          className={'focus-input border-box-shadow'}
          disabled={!editable}
          onBlur={e => {
            const v = e.target.value
            if (v !== property.name) {
              MetaStore.changePropertyName(property.id, v)
              instance.viewOps?.changePropertyName(property.id, v)
            }
          }}
          defaultValue={property.name}
        />
      </Content>
      <Menu.NavigationMenu
        defaultSelectFirst={false}
        layout={[
          show?.delete && editable
            ? {
                text: t('general.delete'),
                type: 'item',
                key: 'delete',
                icon: 'park-delete-one',
                onSelect: async () => {
                  instance.viewOps?.deleteCustomProperty?.(property.id, false)
                  MetaStore.deleteProperty(property.id)
                }
              }
            : undefined,
          show?.hide
            ? {
                text: t('group.Hide in view'),
                type: 'item',
                key: 'hide',
                icon: 'park-preview-close-one',
                onSelect: () => {
                  instance.viewOps?.updateProperty(property.id, {
                    visible: false
                  })
                }
              }
            : undefined
        ].filter(i => i)}
      />
    </WithBorder>
  )
}
