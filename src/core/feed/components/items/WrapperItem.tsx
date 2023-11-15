import { FeedItem } from '@/core/feed/types'
import keyvalueStore from '@/api/stores/keyvalue.store'
import { ObjectStore } from '@/api/stores'
import { useGlobalAtomValue } from '@/hooks'
import { UrlToWebpageMap } from '@/core/webpage/hooks/useWebpageContent'
import CardFeedItem from '@/core/feed/components/items/CardFeedItem'
import MagazineFeedItem from '@/core/feed/components/items/MagazineFeedItem'

const FeedWrapperItem = ({ item, webpageId }: { item?: FeedItem; webpageId?: number }) => {
  const itemMode = keyvalueStore.useValue('feedCardView') || 'magazine'
  const maybeWebpageId = useGlobalAtomValue(UrlToWebpageMap).get(item?.link || '')
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
