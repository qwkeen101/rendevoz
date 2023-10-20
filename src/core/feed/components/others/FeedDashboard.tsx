import { useEffect, useState } from 'react'
import { FeedItem } from '~/typings'
import { globalStore, ObjectStore } from '@/stores'
import useFeedState from '@/core/feed/hooks/useFeedState'
import { Content } from '@/components'

export default () => {
  const [allItems, setAllItems] = useState<FeedItem[]>([])
  const [feedState] = useFeedState()

  return (
    <Content>

    </Content>
  )
}
