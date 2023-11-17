import { Content } from '@/components'
import MetaGroupInner from '@/core/components/group/MetaGroup'
import { MetaStore } from '@/api/stores'
import { TabTitle } from '@/core/rendevoz/components'

const MetaGroupPage = ({ groupId = 0 }: { groupId?: number }) => {
  // const groupData = MetaStore.useObjectToMetaValue(groupId)
  // if (!groupData) return null
  return (
    <Content fullHeight fullWidth>
      {/*<TabTitle title={groupData.name || 'Unnamed Group'} />*/}
      <MetaGroupInner groupId={groupId} />
    </Content>
  )
}
export default MetaGroupPage
