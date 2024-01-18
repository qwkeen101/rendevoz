import { Content } from '@/components'
import UncontrolledGroup from '@/core/components/group/UncontrolledGroup'

const MetaGroupPage = ({ groupId }: { groupId?: number }) => {
  return (
    <Content fullHeight fullWidth>
      <UncontrolledGroup groupId={groupId} />
    </Content>
  )
}
export default MetaGroupPage
