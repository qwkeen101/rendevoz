import useFeedState, { FeedStateAtom } from '@/core/components/feed/hooks/useFeedState'
import { Content, Icon, VirtualList } from '@/components'
import MagazineFeedItem from '@/core/components/feed/components/items/MagazineFeedItem'
import keyvalueStore from '@/api/stores/keyvalue.store'
import CardFeedItem from '@/core/components/feed/components/items/CardFeedItem'
import { useEffect, useState, memo, useRef } from 'react'
import { ObjectStore } from '@/api/stores'
import TitleFeedItem from '@/core/components/feed/components/items/TitleFeedItem'
import { useMeasure } from 'react-use'
import { css } from '@emotion/css'
import readItem from '@/core/components/feed/utils/service/readItem'
import { ClassName } from 'rendevoz'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useSelectAtomValue } from '@/hooks'
import { useSetAtom } from 'jotai'
import UseMeasure from '@/hooks/utils/useMeasure'

const DEFAULT_CARD_PAG = 20
const FeedList = () => {
  const currentCollectionId = useSelectAtomValue(FeedStateAtom, s => s.currentCollectionId)
  const filtererdItems = useSelectAtomValue(FeedStateAtom, s => s.filteredFeedItems)
  const allItems = useSelectAtomValue(FeedStateAtom, s => s.allFeedItems)
  const setFeedState = useSetAtom(FeedStateAtom)
  const itemMode = keyvalueStore.useValue('feedCardView') || 'magazine'
  const instance = useFeedInstance()
  const handleNavigate = async (id: number) => {
    readItem(id, currentCollection?.id)
    const idx = items.findIndex(i => i === id)
    const range = items.slice(Math.max(idx - 2, 0), Math.min(idx + 2, items.length))
    range.forEach(i => instance.navigateOps?.prepareContent(i))
    setFeedState(s => ({
      ...s,
      currentFocusedFeedItemId: id,
      modalOpen: true
    }))
  }
  const currentCollection = ObjectStore('feedCollection').useValue(currentCollectionId)

  const [ref, { width }] = useMeasure()

  const items = filtererdItems || allItems
  const cardItemsPerRow = Math.round(width / 360)

  const [cardPag, setCardPag] = useState({
    currentPage: 0
  })
  const MAX_PAGE = Math.floor(items.length / DEFAULT_CARD_PAG) + 1

  if (itemMode === 'magazine') {
    return (
      <Content
        fullHeight
        style={{ padding: '20px 0px 20px 20px', overflowY: 'auto', flex: '1 1 auto', maxWidth: '100%', width: '100%' }}
        gap={10}
      >
        <VirtualList
          items={items}
          estimateSize={120}
          style={{
            paddingRight: 20,
            height: '100%',
            width: '100%'
          }}
          childrenContainerClassname={css({
            maxWidth: 800,
            margin: '0 auto'
          })}
          getKey={i => i}
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
      <Content fullHeight style={{ flex: '1 1 auto', maxWidth: '100%', padding: '10px 0px 12px 12px' }} flex column gap={10}>
        <VirtualList
          items={items}
          estimateSize={30}
          itemContainerClassname={css({
            '>': {
              ':not(:last-child)': {
                ':not(:empty)': {
                  borderBottom: '1px solid var(--border-background)'
                }
              }
            }
          })}
          getKey={i => i}
          style={{
            paddingRight: '8px',
            height: '100%'
          }}
          overscan={5}
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
        role={'card-container'}
        style={{
          overflowY: 'auto',
          padding: '24px 0px 24px 24px',
          flexWrap: 'wrap',
          overflowX: 'hidden',
          flex: '1 1 820px',
          maxWidth: '100%',
          width: '100%',
          height: 'fit-content',
          maxHeight: '100%',
          '--items-per-row': cardItemsPerRow
        }}
        gap={24}
      >
        {items.slice(cardPag.currentPage * DEFAULT_CARD_PAG, (cardPag.currentPage + 1) * DEFAULT_CARD_PAG).map(i => (
          <CardFeedItem
            onClick={event => {
              const p = event.currentTarget.parentElement
              const t = p?.scrollTop
              handleNavigate(i)
              if (t !== undefined) {
                setTimeout(() => {
                  p!.scrollTop = t
                })
              }
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
                onClick={e => {
                  e.currentTarget.closest('[role="card-container"]')!.scrollTop = 0
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
                onClick={e => {
                  e.currentTarget.closest('[role="card-container"]')!.scrollTop = 0
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

export default memo(FeedList)
