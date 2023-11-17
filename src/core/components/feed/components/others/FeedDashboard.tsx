import { useEffect, useState } from 'react'
import { FeedItem } from '~/typings'
import { globalStore, ObjectStore } from '@/api/stores'
import useFeedState from '@/core/components/feed/hooks/useFeedState'
import { Content } from '@/components'

export default () => {
  const [allItems, setAllItems] = useState<FeedItem[]>([])
  const [feedState] = useFeedState()

  return (
    <Content>

    </Content>
  )
}
