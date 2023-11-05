import useFeedState from '@/core/feed/hooks/useFeedState'
import { Content, Icon, VirtualList } from '@/components'
import MagazineFeedItem from '@/core/feed/components/items/MagazineFeedItem'
import keyvalueStore from '@/stores/keyvalue.store'
import CardFeedItem from '@/core/feed/components/items/CardFeedItem'
import { useEffect, useState } from 'react'
import { ObjectStore } from '@/stores'
import TitleFeedItem from '@/core/feed/components/items/TitleFeedItem'
import { useMeasure } from 'react-use'
import { css } from '@emotion/css'
import readItem from '@/core/feed/utils/service/readItem'
import { ClassName } from 'rendevoz'

const DEFAULT_CARD_PAG = 20
const FeedList = () => {
  const [feedState, setFeedState] = useFeedState()
  const itemMode = keyvalueStore.useValue('feedCardView') || 'magazine'
  const handleNavigate = async (id: number) => {
    readItem(id, currentCollection?.id)
    setFeedState(s => ({
      ...s,
      currentFocusedFeedItemId: id,
      modalOpen: true
    }))
  }
  const currentCollection = ObjectStore('feedCollection').useValue(feedState.currentCollectionId)
  const [ref, { width, height }] = useMeasure()

  const items = feedState.filteredFeedItems || feedState.allFeedItems
  const cardItemsPerRow = Math.round(width / 360)
  const [cardPag, setCardPag] = useState({
    currentPage: 0
  })
  const MAX_PAGE = Math.floor(items.length / DEFAULT_CARD_PAG) + 1
  if (itemMode === 'magazine') {
    return (
      <Content
        fullHeight
        style={{ padding: '20px 0px 20px 20px', overflowY: 'auto', flex: '1 1 820px', maxWidth: '100%', width: '100%' }}
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
          childrenContainerClassname={css({
            maxWidth: 800,
            margin: 'auto'
          })}
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
      <Content fullHeight style={{ flex: '1 1 820px', maxWidth: '100%', padding: '10px 0px 20px 20px' }} flex column gap={10}>
        <VirtualList
          items={items}
          estimateSize={30}
          itemContainerClassname={css({
            '>': {
              ':not(:last-child)': {
                borderBottom: '1px solid var(--border-background)'
              }
            }
          })}
          style={{
            paddingRight: '20px',
            height: '100%'
          }}
          overscan={10}
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
          padding: '30px 0px 30px 30px',
          flexWrap: 'wrap',
          overflowX: 'hidden',
          flex: '1 1 820px',
          maxWidth: '100%',
          height: 'fit-content',
          maxHeight: '100%',
          '--items-per-row': cardItemsPerRow
        }}
        gap={30}
      >
        {items.slice(cardPag.currentPage * DEFAULT_CARD_PAG, (cardPag.currentPage + 1) * DEFAULT_CARD_PAG).map(i => (
          <CardFeedItem
            onClick={() => {
              handleNavigate(i)
            }}
            id={i}
            key={i}
          />
        ))}
        {MAX_PAGE > 1 && (
          <Content flex fullWidth justifyContent={'center'}>
            <Content flex gap={12} alignItems={'center'}>
              <Icon
                size={18}
                onClick={() => {
                  setCardPag({
                    currentPage: Math.max(cardPag.currentPage - 1, 0)
                  })
                }}
                name={'park-left'}
                className={ClassName.circleButton()}
              />
              <div style={{ fontWeight: 600 }}>
                {cardPag.currentPage + 1}/{MAX_PAGE}
              </div>
              <Icon
                size={18}
                name={'park-right'}
                onClick={() => {
                  setCardPag({
                    currentPage: Math.min(cardPag.currentPage + 1, MAX_PAGE - 1)
                  })
                }}
                className={ClassName.circleButton()}
              />
            </Content>
          </Content>
        )}
      </Content>
    )
  }
}

export default FeedList
