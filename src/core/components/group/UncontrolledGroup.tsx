import MetaGroup from '@/core/components/group/MetaGroup'
import { MetaStore, ObjectStore } from '@/api/stores'
import TabTitle from '@/components/layout/TabTitle'
import { Icon } from '@/components'
import { Rendevoz } from '@/core/rendevoz'

export default ({ groupId }: { groupId?: number }) => {
  const value = ObjectStore('group').useValue(groupId)
  const groupMeta = MetaStore.useObjectToMetaValue(groupId)
  return (
    <>
      <MetaGroup
        groupId={groupId}
        value={value}
        title={{
          title: groupMeta?.name,
          icon: groupMeta?.icon,
          description: groupMeta?.description
        }}
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
      <TabTitle
        title={groupMeta?.name || groupMeta?.placeholderName || 'Unnamed group'}
        icon={<Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('group')} />}
      />
    </>
  )
}
