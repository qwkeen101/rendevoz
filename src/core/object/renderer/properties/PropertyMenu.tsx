import { Content, Icon, Menu, WithBorder } from '@/components'
import { IMetaProp } from '~/typings'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'

export default ({
  property,
  editable,
  show,
  onClose
}: {
  property: IMetaProp
  editable?: boolean
  onClose?: VoidFunction
  show?: {
    view?: boolean
    delete?: boolean
    hide?: boolean
    deleteForMeta?: number
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
              MetaStore.property.changePropertyName(property.id, v)
              instance.viewOps?.changePropertyName(property.id, v)
            }
          }}
          defaultValue={property.name}
        />
      </Content>
      <Menu.NavigationMenu
        style={{
          padding: '0px 2px'
        }}
        defaultSelectFirst={false}
        layout={[
          show?.view && {
            text: t('general.View details'),
            type: 'item',
            key: 'view-details',
            icon: 'park-info',
            onSelect: async () => {
              onClose?.()
              Rendevoz.Actions.Open.Group.openPropGroup(property.id)
            }
          },
          show?.deleteForMeta && {
            text: t('general.delete'),
            type: 'item',
            key: 'delete',
            icon: 'park-delete-two',
            onSelect: async () => {
              onClose?.()
              MetaStore.property.deletedPropertyToMetaId[property.id] = show.deleteForMeta!
              setTimeout(() => {
                delete MetaStore.property.deletedPropertyToMetaId[property.id]
              })
              MetaStore.property.updateProperty(show.deleteForMeta!, property.id, null).then(() => {
                MetaStore.triggerObjectIndex()
              })
            }
          },
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
            : undefined,
          show?.delete && editable
            ? {
                dangerous: true,
                text: t('general.Delete property for all'),
                type: 'item',
                key: 'delete-for-all',
                icon: 'park-delete-one',
                onSelect: async () => {
                  instance.viewOps?.deleteCustomProperty?.(property.id, false)
                  MetaStore.property.deleteProperty(property.id)
                }
              }
            : undefined
        ].filter(i => i)}
      />
    </WithBorder>
  )
}
