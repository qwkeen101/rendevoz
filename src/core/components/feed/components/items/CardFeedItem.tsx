import { FeedItem } from '@/core/components/feed/types'
import React from 'react'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { ObjectStore } from '@/api/stores'
import ItemsToolbar from '@/core/components/feed/components/items/ItemsToolbar'
import useFeedIsRead from '@/core/components/feed/hooks/useFeedIsRead'
import { Colors } from '@/consts'
import useFeedIsFocused from '@/core/components/feed/hooks/useFeedIsFocused'
import classnames from 'classnames'

const CardFeedItem = ({
  id,
  styles,
  onClick
}: {
  id: number
  styles?: {
    mainGap?: number
    titleWeight?: number
    titleSize?: number
  }
  onClick?: React.MouseEventHandler
}) => {
  const item = ObjectStore('feed').useValue(id)
  const { titleSize = 14, titleWeight = 500 } = styles || {}
  const isRead = useFeedIsRead(id)
  const isFocused = useFeedIsFocused(id)
  if (!item) return null
  return (
    <Content
      className={classnames('button p-6', isFocused && 'active-button', isRead && !isFocused && 'transparent-font')}
      flex
      column
      gap={4}
      style={{ width: 'calc(100% / var(--items-per-row) - 18px)' }}
      onClick={onClick}
    >
      {item.image ? (
        <div
          style={{
            width: '100%',
            paddingBottom: '56%',
            marginBottom: 5,
            position: 'relative'
          }}
        >
          <img
            src={item.image}
            style={{
              objectFit: 'cover',
              borderRadius: 4,
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            paddingBottom: '56%',
            marginBottom: 5,
            position: 'relative'
          }}
          className={'br-6 bg-secondary'}
        >
          <Icon
            name={item.feedType === 'podcast' ? 'park-music' : item.feedType === 'youtube' ? 'park-youtube' : 'park-broadcast'}
            size={60}
            className={'super-transparent-font'}
            containerStyle={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
          />
        </div>
      )}
      <div
        style={{
          fontSize: titleSize,
          fontWeight: titleWeight
        }}
        className={'ellipsis-font-2'}
      >
        {item.title}
      </div>
      <div className={classnames('ellipsis-font-3 font-size-12', !isFocused && 'transparent-font')}>{item.description}</div>
      <ItemsToolbar isFocused={isFocused} itemId={id} />
    </Content>
  )
}

export default CardFeedItem
