import MetaGroup, { IMetaGroupProps } from '@/core/components/group/MetaGroup'
import { MetaStore, ObjectStore } from '@/api/stores'
import TabTitle from '@/components/layout/TabTitle'
import { Icon } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { useMemo } from 'react'

export default ({ groupId, ...rest }: { groupId?: number } & IMetaGroupProps) => {
  const value = ObjectStore('group').useValue(groupId)
  const groupMeta = MetaStore.useObjectToMetaValue(groupId)
  return (
    <>
      <MetaGroup
        {...rest}
        groupId={groupId}
        value={value}
        title={useMemo(() => {
          return {
            title: groupMeta?.name,
            icon: groupMeta?.icon,
            description: groupMeta?.description
          }
        }, [groupMeta])}
        on={e => {
          if (!groupId) return
          if (e.type === 'groupDataChange') {
            console.log(e.value)
            ObjectStore('group').updateOne({ id: groupId, ...e.value })
          }
          if (e.type === 'groupMetaChange' && groupMeta) {
            MetaStore.updateMetaObject({ id: groupMeta.id, ...e.value })
          }
        }}
      />
    </>
  )
}
