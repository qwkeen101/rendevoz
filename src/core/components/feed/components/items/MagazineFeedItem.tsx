import { FeedItem } from '@/core/components/feed/types'
import { Content, Icon } from '@/components'
import React, { memo } from 'react'
import { ClassName } from 'rendevoz'
import { ObjectStore } from '@/api/stores'
import { Colors } from '@/consts'
import { DateFormat } from '@/utils'
import ItemsToolbar from '@/core/components/feed/components/items/ItemsToolbar'
import useFeedIsRead from '@/core/components/feed/hooks/useFeedIsRead'
import useFeedIsFocused from '@/core/components/feed/hooks/useFeedIsFocused'
import classnames from 'classnames'

const MagazineFeedItem = memo(
  ({
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
    }
    onClick?: React.MouseEventHandler
  }) => {
    const {
      imageSize = {
        width: 180,
        height: 108
      },
      mainGap = 20
    } = styles || {}
    const item = ObjectStore('feed').useValue(id)
    const isRead = useFeedIsRead(id)
    const isFocused = useFeedIsFocused(id)
    if (!item) return null
    return (
      <Content
        flex
        onClick={onClick}
        gap={mainGap}
        className={classnames('button py-6', isFocused && 'active-button', isRead && !isFocused && 'transparent-font')}
        style={{
          width: '100%'
        }}
      >
        {item.image && (
          <img
            src={item.image}
            className={'br-4'}
            style={{
              objectFit: 'cover',
              width: imageSize.width,
              height: imageSize.height,
              flexShrink: 0
            }}
          ></img>
        )}
        <Content flex column auto>
          <div className={'normal-font ellipsis-font-2'}>{item.title}</div>
          <div className={classnames('ellipsis-font-2 font-size-13', !isFocused && 'transparent-font')}>{item.description}</div>
          <div style={{ width: '100%', marginTop: 6 }}>
            <ItemsToolbar isFocused={isFocused} itemId={item.id} />
          </div>
        </Content>
      </Content>
    )
  },
  (prev, curr) => prev.id === curr.id
)
export default MagazineFeedItem
