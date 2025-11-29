import KeyvalueStore from '@/api/stores/keyvalue.store'
import { Button, Icon } from '@/components'
import { useLayoutEffect, useState } from 'react'
import { getWorkspaceMetaCount } from '@/core/setting/Workspace'
import { MetaStore } from '@/api/stores'
import { useDebounceEffect } from '@/hooks'
import Workspace from '@/api/common/workspace'
import { ISidebarWidgetProps } from '@/components/layout/sidebar/main/index'
import Header from '@/components/layout/sidebar/main/Header'
import { useTranslation } from 'react-i18next'
import { Icons } from '@/consts'
import { GlobalSetting } from '@/core'
import trans from '@/consts/trans'

export default ({ onCollapse, collapsed }: ISidebarWidgetProps) => {
  const workspaces = KeyvalueStore.useValue('allWorkspaces')
  const [countDetails, setCountDetails] = useState<Map<number, number>>()
  const metaMap = MetaStore.useIndexedMetaObjects()
  useLayoutEffect(() => {
    getWorkspaceMetaCount().then(res => setCountDetails(res))
  }, [])
  useDebounceEffect(
    () => {
      getWorkspaceMetaCount().then(res => setCountDetails(res))
    },
    [metaMap],
    { wait: 5000 }
  )
  const { t } = useTranslation()
  return (
    <>
      <Header
        extra={
          <div
            onClick={e => {
              e.stopPropagation()
              GlobalSetting.focusSetting('workspace')
            }}
            className={'group-hover:opacity-100 opacity-0 transition-opacity'}
          >
            <Icon name={Icons.More} size={18} className={'hover-active-button'} />
          </div>
        }
        onCollapse={onCollapse}
        className={'group'}
        name={t('general.Workspaces')}
      />
      {collapsed
        ? null
        : workspaces?.map(i => (
            <Button.IconButton
              key={i.id}
              onClick={() => Workspace.switchWorkspace(i.id)}
              suffixStr={countDetails?.get(i.id) || undefined}
              icon={'custom-card-library'}
              text={i.name || t(trans.Unnamed)}
              textClassName={!i.name ? 'super-transparent-font' : undefined}
            ></Button.IconButton>
          ))}
    </>
  )
}
