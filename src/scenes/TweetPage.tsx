import { MetaStore } from '@/api/stores'
import { Content, Icon, TabTitle } from '@/components'
import Tweet from '@/core/components/tweet'
import { memo } from 'react'

export default memo(({ id }: { id: number }) => {
  const tweetMeta = MetaStore.useObjectToMetaValue(id)
  if (tweetMeta) {
    return (
      <Content fullWidth fullHeight flex style={{ overflowY: 'auto', padding: '36px 24px' }}>
        <TabTitle icon={<Icon name={Global.utils.getIcon('tweet')} />} title={tweetMeta.name} />
        <Tweet id={id} />
      </Content>
    )
  }
  return null
})
