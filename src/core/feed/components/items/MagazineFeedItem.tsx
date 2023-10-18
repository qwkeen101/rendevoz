import { FeedItem } from '@/core/feed/types'
import { Content, Icon } from '@/components'
import React from 'react'
import { ClassName } from 'rendevoz'
import { ObjectStore } from '@/stores'
import { Colors } from '@/consts'
import { DateFormat } from '@/utils'

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
      width: 130,
      height: 78
    },
    titleSize = 16,
    titleWeight = 600,
    mainGap = 20
  } = styles || {}
  const item = ObjectStore('feed').useValue(id)
  if (!item) return null
  return (
    <Content
      flex
      onClick={onClick}
      gap={mainGap}
      style={{
        cursor: 'pointer',
        padding: '4px 0px'
      }}
    >
      {item.image && (
        <div
          style={{
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            borderRadius: 4,
            backgroundImage: `url(${item.image})`,
            width: imageSize.width,
            height: imageSize.height,
            flexShrink: 0
          }}
        ></div>
      )}
      <Content flex column>
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
            marginTop: 4
          }}
          className={ClassName.ellipsisFont(2)}
        >
          {item.description}
        </div>
        <Content
          flex
          alignItems={'center'}
          gap={12}
          style={{
            fontSize: 13,
            lineHeight: 1.3,
            marginTop: 4,
            color: Colors.Font.Transparent
          }}
        >
          {item.date && DateFormat.formatDistanceToNowStrict(item.date)}
          {item.lastRead && (
            <Content flex gap={6}>
              <Icon name={'park-preview-open'} /> {DateFormat.formatDistanceToNowStrict(item.lastRead, true)}
            </Content>
          )}
        </Content>
      </Content>
    </Content>
  )
}
export default MagazineFeedItem
