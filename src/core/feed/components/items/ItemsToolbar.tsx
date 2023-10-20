import { FeedItem } from '@/core/feed/types'
import { Content, Icon } from '@/components'

const ItemsToolbar = ({ item }: { item: FeedItem }) => {
  return (
    <Content flex>
      <Icon name={'park-star'} />
      <Icon name={'park-plus'} />
    </Content>
  )
}

export default ItemsToolbar
