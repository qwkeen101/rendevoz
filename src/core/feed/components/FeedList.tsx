import useFeedState from '@/core/feed/hooks/useFeedState'
import { Content, VirtualList } from '@/components'
import MagazineFeedItem from '@/core/feed/components/items/MagazineFeedItem'
import keyvalueStore from '@/stores/keyvalue.store'
import CardFeedItem from '@/core/feed/components/items/CardFeedItem'
import { useEffect, useState } from 'react'
import { ObjectStore } from '@/stores'
import TitleFeedItem from '@/core/feed/components/items/TitleFeedItem'
import { useMeasure } from 'react-use'

const DEFAULT_CARD_PAG = 20
const FeedList = () => {
  const [feedState, setFeedState] = useFeedState()
  const itemMode = keyvalueStore.useValue('feedCardView') || 'magazine'
  const handleNavigate = async (id: number) => {
    const curr = ((await keyvalueStore.getOne('feedRecentlyReadIds')) || []).filter(i => i !== id)
    keyvalueStore.updateOne('feedRecentlyReadIds', [id, ...curr])
    setFeedState(s => ({
      ...s,
      currentFocusedFeedItemId: id,
      modalOpen: true
    }))
  }
  const currentCollection = ObjectStore('feedCollection').useValue(feedState.currentCollectionId)
  const [ref, { width, height }] = useMeasure()
  useEffect(() => {
    if (currentCollection) {
      setFeedState(s => ({ ...s, allFeedItems: currentCollection.items }))
    }
  }, [currentCollection])
  const items = feedState.allFeedItems
  const cardItemsPerRow = Math.round(width / 360)
  const [cardPag, setCardPag] = useState({
    currentPage: 0
  })
  if (itemMode === 'magazine') {
    return (
      <Content
        fullHeight
        style={{ padding: '20px 0px 40px 0px', overflowY: 'auto', flex: '1 1 820px', maxWidth: '100%' }}
        flex
        column
        gap={10}
      >
        <VirtualList
          items={items}
          estimateSize={300}
          style={{
            paddingRight: 20,
            height: '100%'
          }}
          renderItem={i => (
            <MagazineFeedItem
              onClick={() => {
                handleNavigate(i)
              }}
              id={i}
            />
          )}
        ></VirtualList>
      </Content>
    )
  }
  if (itemMode === 'title') {
    return (
      <Content fullHeight style={{ flex: '1 1 820px', maxWidth: '100%', padding: '20px 0px 40px 0px' }} flex column gap={10}>
        <VirtualList
          items={items}
          estimateSize={30}
          style={{
            paddingRight: '20px',
            height: '100%'
          }}
          renderItem={i => (
            <TitleFeedItem
              onClick={() => {
                handleNavigate(i)
              }}
              id={i}
            />
          )}
        ></VirtualList>
      </Content>
    )
  }
  if (itemMode === 'card') {
    return (
      <Content
        ref={ref}
        flex
        style={{
          overflowY: 'auto',
          padding: '32px 10px 32px 0px',
          flexWrap: 'wrap',
          flex: '1 1 820px',
          maxWidth: '100%',
          height: 'fit-content',
          maxHeight: '100%',
          '--items-per-row': cardItemsPerRow
        }}
        gap={20}
      >
        {feedState.allFeedItems.slice(cardPag.currentPage * DEFAULT_CARD_PAG, (cardPag.currentPage + 1) * DEFAULT_CARD_PAG).map(i => (
          <CardFeedItem
            onClick={() => {
              handleNavigate(i)
            }}
            id={i}
            key={i}
          />
        ))}
      </Content>
    )
  }
}

export default FeedList
