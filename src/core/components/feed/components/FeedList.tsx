import MagazineFeedItem from '@/core/components/feed/components/items/MagazineFeedItem'
import CardFeedItem from '@/core/components/feed/components/items/CardFeedItem'
import { RefObject } from 'react'
import TitleFeedItem from '@/core/components/feed/components/items/TitleFeedItem'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { useMeasure } from '@/hooks'
import { ObjectStore } from '@/api/stores'
import NoResult from '@/core/components/common/NoResult'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'

const FeedList = ({
  items,
  scrollElementRef,
  scrollKey,
  onNavigate,
  parentFolderId,
  showSource
}: {
  items: number[]
  scrollElementRef: RefObject<HTMLDivElement>
  scrollKey: string
  showSource?: boolean
  onNavigate?: (id: number) => void
  parentFolderId?: number
}) => {
  const itemMode = useFeedData().cardView
  const instance = useFeedInstance()
  const feeds = ObjectStore('feed').useMultiple(items)
  const handleNavigate = (id: number) => {
    if (onNavigate) {
      onNavigate(id)
      return
    }
    instance.feedOps?.read(id)
  }
  if (!feeds.length) {
    return <NoResult />
  }
  if (itemMode === 'magazine') {
    return (
      <VirtualLoader
        count={feeds.length}
        size={172}
        scrollKey={scrollKey}
        className={'pb-20'}
        scrollElementRef={scrollElementRef}
        overscan={5}
        itemClassName={'not-last-not-empty-border-bottom'}
        renderItem={i => {
          const item = feeds[i]
          if (item) {
            return (
              <MagazineFeedItem
                showSource={showSource}
                parentFolderId={parentFolderId}
                className={i === 0 ? '!pt-2' : undefined}
                onClick={() => {
                  handleNavigate(item.id)
                }}
                id={item.id}
              />
            )
          }
          return null
        }}
      ></VirtualLoader>
    )
  }
  if (itemMode === 'title') {
    return (
      <VirtualLoader
        count={feeds.length}
        size={32}
        scrollKey={scrollKey}
        className={'pb-20'}
        scrollElementRef={scrollElementRef}
        overscan={5}
        renderItem={i => {
          const item = feeds[i]
          if (item) {
            return (
              <TitleFeedItem
                parentFolderId={parentFolderId}
                onClick={() => {
                  handleNavigate(item.id)
                }}
                id={item.id}
              />
            )
          }
          return null
        }}
      ></VirtualLoader>
    )
  }

  if (itemMode === 'card') {
    return (
      <CardList
        scrollElementRef={scrollElementRef}
        onNavigate={handleNavigate}
        scrollKey={scrollKey}
        items={items}
        showSource={showSource}
        parentFolderId={parentFolderId}
      />
    )
  }
}

const CardList = ({
  scrollElementRef,
  items,
  scrollKey,
  parentFolderId,
  onNavigate,
  showSource
}: {
  scrollElementRef: RefObject<HTMLDivElement>
  items: number[]
  parentFolderId?: number
  scrollKey: string
  showSource?: boolean
  onNavigate?: (id: number) => void
}) => {
  const { width } = useMeasure(scrollElementRef)
  const feeds = ObjectStore('feed').useMultiple(items)
  const length = feeds.length
  const cols = Math.floor(width / 340) + 1
  const rows = length % cols === 0 ? length / cols : Math.floor(length / cols) + 1
  return (
    <VirtualLoader
      className={'pb-40 pt-2'}
      size={260}
      overscan={1}
      scrollElementRef={scrollElementRef}
      scrollKey={scrollKey}
      count={rows}
      renderItem={idx => {
        const sliced = feeds.slice(idx * cols, (idx + 1) * cols)
        return (
          <div
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
            className={'grid gap-6 pb-6'}
          >
            {sliced.map(i => (
              <CardFeedItem
                showSource={showSource}
                parentFolderId={parentFolderId}
                onClick={() => {
                  onNavigate?.(i.id)
                }}
                id={i.id}
                key={i.id}
              />
            ))}
          </div>
        )
      }}
    ></VirtualLoader>
  )
}
export default FeedList
