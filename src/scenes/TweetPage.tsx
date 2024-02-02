import { MetaStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import Tweet from '@/core/components/tweet'
import { TabTitle } from '@/core/rendevoz/components'
import { Rendevoz } from '@/core/rendevoz'
import { memo } from 'react'

export default memo(({ id }: { id: number }) => {
  const tweetMeta = MetaStore.useObjectToMetaValue(id)
  if (tweetMeta) {
    return (
      <Content fullWidth fullHeight flex style={{ overflowY: 'auto', padding: '36px 24px' }}>
        <TabTitle icon={<Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('tweet')} />} title={tweetMeta.name ?? 'Unnamed tweet'} />
        <Tweet id={id} />
      </Content>
    )
  }
  return null
})
