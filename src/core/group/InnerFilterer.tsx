import { ObjectStore } from '@/api/stores'
import { MetaGroup } from '~/typings'
import { Content } from '@/components'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { Colors } from '@/consts'

const InnerFilterer = ({ groupId }: { groupId: number }) => {
  const groupData = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  return (
    <Content
      flex
      column
      style={{
        border: `1px solid ${Colors.Background.Border}`,
        padding: '16px 12px',
        borderRadius: 8,
        margin: '6px 0px'
      }}
    >
      {groupData?.rootFilterGroup && (
        <BetterFilter
          root={groupData.rootFilterGroup}
          onChange={r => {
            if (r !== groupData?.rootFilterGroup) {
              ObjectStore('group').updateOne({ id: groupId, rootFilterGroup: r })
            }
          }}
        />
      )}
    </Content>
  )
}

export default InnerFilterer
