import KeyvalueStore from '@/api/stores/keyvalue.store'
import { AnimatePopover, WithBorder, Menu, Button } from '@/components'
import { useTranslation } from 'react-i18next'
import { Colors } from '@/consts'
import Workspace from '@/api/common/workspace'
import { memo } from 'react'

export default memo(() => {
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const allWorkspaces = KeyvalueStore.useValue('allWorkspaces')
  const { t } = useTranslation()
  return (
    <AnimatePopover
      align={'start'}
      padding={6}
      withClickCover
      content={setV => (
        <WithBorder className={'pt-0.5 pb-1'} width={180}>
          <Menu.NavigationMenu
            layout={[
              {
                type: 'title',
                name: t('general.Workspace')
              },
              // @ts-ignore
              ...allWorkspaces.map(i => ({
                type: 'item',
                key: String(i.id),
                style: {
                  color: !i.name ? Colors.Font.SuperTransparent : undefined
                },
                text: i.name || t('general.Unnamed'),
                onSelect: async () => {
                  setV(false)
                  Workspace.switchWorkspace(i.id)
                }
              }))
            ]}
          />
        </WithBorder>
      )}
      positions={['bottom']}
    >
      <div className={'transparent-font mb-1.5 font-size-13 -mt-2.5 cursor-pointer'}>
        {currentWorkspace?.name === 'default' ? t('general.Default workspace') : currentWorkspace?.name || t('general.Unnamed space')}
      </div>
    </AnimatePopover>
  )
})
