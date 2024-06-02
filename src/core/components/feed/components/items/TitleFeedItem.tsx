import { FeedItem } from '@/core/components/feed/types'
import { Content } from '@/components'
import React, { memo } from 'react'
import { ClassName } from 'rendevoz'
import { ObjectStore } from '@/api/stores'
import ItemsToolbar from '@/core/components/feed/components/items/ItemsToolbar'
import useFeedIsRead from '@/core/components/feed/hooks/useFeedIsRead'
import { Colors } from '@/consts'
import useFeedIsFocused from '@/core/components/feed/hooks/useFeedIsFocused'
import classnames from 'classnames'

export default memo(
  ({ id, onClick }: { id: number; onClick?: React.MouseEventHandler }) => {
    const item = ObjectStore('feed').useValue(id)
    const isRead = useFeedIsRead(id)
    const isFocused = useFeedIsFocused(id)
    if (!item) return null
    return (
      <Content
        flex
        alignItems={'center'}
        onClick={onClick}
        className={classnames('button p-6 font-size-13', isFocused && 'active-button', isRead && !isFocused && 'transparent-font')}
        gap={10}
      >
        <div
          style={{
            flex: 1
          }}
          className={'ellipsis-font-1 normal-font'}
        >
          {item.title}
        </div>
        <ItemsToolbar isFocused={isFocused} itemId={id} />
      </Content>
    )
  },
  (prev, curr) => prev.id === curr.id
)
