import { FeedItem } from '@/core/feed/types'
import { Content, Icon } from '@/components'
import React from 'react'
import { ClassName } from 'rendevoz'
import { ObjectStore } from '@/stores'
import { Colors } from '@/consts'
import { DateFormat } from '@/utils'
import ItemsToolbar from '@/core/feed/components/items/ItemsToolbar'
import useFeedIsRead from '@/core/feed/hooks/useFeedIsRead'

const MagazineFeedItem = ({
  id,
  styles,
  onClick
}: {
  id: number
  styles?: {
    mainGap?: number
    imageSize?: {
      width?: number
      height?: number
    }
    titleWeight?: number
    titleSize?: number
  }
  onClick?: React.MouseEventHandler
}) => {
  const {
    imageSize = {
      width: 180,
      height: 108
    },
    titleSize = 16,
    titleWeight = 600,
    mainGap = 20
  } = styles || {}
  const item = ObjectStore('feed').useValue(id)
  const isRead = useFeedIsRead(id)
  if (!item) return null
  return (
    <Content
      flex
      onClick={onClick}
      gap={mainGap}
      style={{
        cursor: 'pointer',
        padding: '4px 0px',
        width: '100%',
        color: isRead ? Colors.Font.Transparent : undefined
      }}
    >
      {item.image && (
        <img
          src={item.image}
          style={{
            objectFit: 'cover',
            borderRadius: 4,
            width: imageSize.width,
            height: imageSize.height,
            flexShrink: 0
          }}
        ></img>
      )}
      <Content flex column auto>
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
            lineHeight: 1.4,
            marginTop: 4,
            marginBottom: 'auto'
          }}
          className={ClassName.ellipsisFont(2)}
        >
          {item.description}
        </div>
        <div style={{ width: '100%', marginTop: 6 }}>
          <ItemsToolbar itemId={item.id} />
        </div>
      </Content>
    </Content>
  )
}
export default MagazineFeedItem
