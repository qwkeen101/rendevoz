import { FeedItem } from '@/core/feed/types'
import { Content } from '@/components'
import React from 'react'
import { ClassName } from 'rendevoz'
import { ObjectStore } from '@/stores'

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
  const { titleSize = 16, titleWeight = 600 } = styles || {}
  const item = ObjectStore('feed').useValue(id)
  if (!item) return null
  return (
    <Content
      flex
      onClick={onClick}
      style={{
        padding: '6px 0px',
        cursor: 'pointer'
      }}
    >
      <div
        style={{
          fontSize: titleSize,
          fontWeight: titleWeight
        }}
      >
        {item.title}
      </div>
    </Content>
  )
}
