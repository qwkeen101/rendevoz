import { Content, Icon } from '@/components'
import UncontrolledGroup from '@/core/components/group/UncontrolledGroup'
import TabTitle from '@/components/layout/TabTitle'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore } from '@/api/stores'
import { IGroupInstance } from '~/typings'

const MetaGroupPage = ({ groupId, onInstanceInitialized }: { groupId?: number; onInstanceInitialized?: (i: IGroupInstance) => void }) => {
  const groupMeta = MetaStore.useObjectToMetaValue(groupId)
  return (
    <Content fullHeight fullWidth>
      <TabTitle
        title={groupMeta?.name || groupMeta?.placeholderName || 'Unnamed group'}
        icon={<Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('group')} />}
      />
      <UncontrolledGroup onInstanceInitialized={onInstanceInitialized} groupId={groupId} />
    </Content>
  )
}
export default MetaGroupPage
