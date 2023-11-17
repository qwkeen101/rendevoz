import { FeedItem } from '@/core/components/feed/types'
import { Content } from '@/components'
import React from 'react'
import { ClassName } from 'rendevoz'
import { ObjectStore } from '@/api/stores'
import ItemsToolbar from '@/core/components/feed/components/items/ItemsToolbar'
import useFeedIsRead from '@/core/components/feed/hooks/useFeedIsRead'
import { Colors } from '@/consts'

export default ({
  id,
  styles,
  onClick
}: {
  id: number
  styles?: {
    titleWeight?: number
    titleSize?: number
  }
  onClick?: React.MouseEventHandler
}) => {
  const { titleSize = 14, titleWeight = 600 } = styles || {}
  const item = ObjectStore('feed').useValue(id)
  const isRead = useFeedIsRead(id)
  if (!item) return null
  return (
    <Content
      flex
      onClick={onClick}
      style={{
        padding: '6px 6px',
        cursor: 'pointer',
        color: isRead ? Colors.Font.Transparent : undefined
      }}
      className={ClassName.flatButton(0)}
      gap={10}
    >
      <div
        style={{
          fontSize: titleSize,
          fontWeight: titleWeight,
          flex: 1
        }}
        className={ClassName.ellipsisFont(1)}
      >
        {item.title}
      </div>
      <ItemsToolbar itemId={id} />
    </Content>
  )
}
