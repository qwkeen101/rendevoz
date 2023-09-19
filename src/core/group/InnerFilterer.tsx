import { ObjectStore } from '@/stores'
import { MetaGroup } from '~/typings'
import { Content } from '@/components'
import BetterFilter from '@/core/database/filter/BetterFilter'

const InnerFilterer = ({ groupId }: { groupId: number }) => {
  const groupData = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  return (
    <Content flex column>
      {groupData?.rootFilterGroup && (
        <BetterFilter
          root={groupData.rootFilterGroup}
          onChange={r => ObjectStore('group').updateOne({ id: groupId, rootFilterGroup: r })}
        />
      )}
    </Content>
  )
}

export default InnerFilterer
