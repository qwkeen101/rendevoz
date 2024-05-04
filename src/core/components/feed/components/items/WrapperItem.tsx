import { FeedItem } from '@/core/components/feed/types'
import keyvalueStore from '@/api/stores/keyvalue.store'
import { ObjectStore } from '@/api/stores'
import { useGlobalAtomValue } from '@/hooks'
import CardFeedItem from '@/core/components/feed/components/items/CardFeedItem'
import MagazineFeedItem from '@/core/components/feed/components/items/MagazineFeedItem'
import { urlToIdMap } from '@/api/indexData/urlToId'

const FeedWrapperItem = ({ item, webpageId }: { item?: FeedItem; webpageId?: number }) => {
  const itemMode = keyvalueStore.useValue('feedCardView') || 'magazine'
  const maybeWebpageId = useGlobalAtomValue(urlToIdMap).get(item?.link || '')
  const webpage = ObjectStore('webpage').useValue(maybeWebpageId || webpageId)
  const realItem = webpage
    ? ({
        link: webpage.url,
        title: webpage.title,
        id: webpage.id,
        image: webpage.image
      } as FeedItem)
    : item
  if (realItem) {
    if (itemMode === 'magazine') {
      return <MagazineFeedItem item={realItem} />
    }
    if (itemMode === 'card') {
      return <CardFeedItem item={realItem} />
    }
    return null
  }
}

export default FeedWrapperItem
