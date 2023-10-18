import { FeedItem } from '@/core/feed/types'
import React from 'react'
import { Content } from '@/components'
import { ClassName } from 'rendevoz'
import { ObjectStore } from '@/stores'

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
  if (!item) return null
  return (
    <Content flex column gap={4} style={{ width: 'calc(100% / var(--items-per-row) - 20px)', cursor: 'pointer' }} onClick={onClick}>
      {item.image && (
        <div
          style={{
            width: '100%',
            paddingBottom: '56%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            borderRadius: 4,
            marginBottom: 5,
            backgroundImage: `url(${item.image})`
          }}
        ></div>
      )}
      <div
        style={{
          fontSize: titleSize,
          fontWeight: titleWeight,
          lineHeight: 1.25
        }}
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
    </Content>
  )
}

export default CardFeedItem
