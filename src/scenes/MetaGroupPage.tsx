import { Content, Icon } from '@/components'
import UncontrolledGroup from '@/core/components/group/UncontrolledGroup'
import TabTitle from '@/components/layout/TabTitle'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore } from '@/api/stores'

const MetaGroupPage = ({ groupId }: { groupId?: number }) => {
  const groupMeta = MetaStore.useObjectToMetaValue(groupId)
  return (
    <Content fullHeight fullWidth>
      <TabTitle
        title={groupMeta?.name || groupMeta?.placeholderName || 'Unnamed group'}
        icon={<Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('group')} />}
      />
      <UncontrolledGroup groupId={groupId} />
    </Content>
  )
}
export default MetaGroupPage
