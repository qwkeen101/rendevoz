import { FeedItem } from '@/core/components/feed/types'
import React from 'react'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { ObjectStore } from '@/api/stores'
import ItemsToolbar from '@/core/components/feed/components/items/ItemsToolbar'
import useFeedIsRead from '@/core/components/feed/hooks/useFeedIsRead'
import { Colors } from '@/consts'

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
  const { titleSize = 16, titleWeight = 600 } = styles || {}
  const isRead = useFeedIsRead(id)
  if (!item) return null
  return (
    <Content
      flex
      column
      gap={4}
      style={{ width: 'calc(100% / var(--items-per-row) - 24px)', cursor: 'pointer', color: isRead ? Colors.Font.Transparent : undefined }}
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
            borderRadius: 4,
            marginBottom: 5,
            position: 'relative',
            background: Colors.Background.RadialGradient
          }}
        >
          <Icon
            name={item.feedType === 'podcast' ? 'park-music' : item.feedType === 'youtube' ? 'park-youtube' : 'park-broadcast'}
            size={60}
            style={{ color: Colors.Font.Tertiary }}
            containerStyle={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
          />
        </div>
      )}
      <div
        style={{
          fontSize: titleSize,
          fontWeight: titleWeight,
          lineHeight: 1.25
        }}
        className={ClassName.ellipsisFont(2)}
      >
        {item.title}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.4
        }}
        className={ClassName.ellipsisFont(3)}
      >
        {item.description}
      </div>
      <ItemsToolbar itemId={id} />
    </Content>
  )
}

export default CardFeedItem
