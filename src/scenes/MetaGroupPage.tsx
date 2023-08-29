import { Content } from '@/components'
import MetaGroupInner from '@/core/database/group/MetaGroup'

const MetaGroupPage = ({ groupId }: { groupId: number }) => {
  return (
    <Content fullHeight fullWidth>
      <MetaGroupInner groupId={groupId} />
    </Content>
  )
}
export default MetaGroupPage
