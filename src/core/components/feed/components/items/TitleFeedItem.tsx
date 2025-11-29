import { Content } from '@/components'
import React, { memo } from 'react'
import { ObjectStore } from '@/api/stores'
import ItemsToolbar from '@/core/components/feed/components/items/ItemsToolbar'
import useFeedIsRead from '@/core/components/feed/hooks/useFeedIsRead'
import classnames from 'classnames'
import FeedItemMenu from '@/core/components/feed/components/FeedItemMenu'
import ContextMenu from '@/components/contextMenu'

export default memo(
  ({ id, onClick, parentFolderId }: { id: number; onClick?: React.MouseEventHandler; parentFolderId?: number }) => {
    const item = ObjectStore('feed').useValue(id)
    const isRead = useFeedIsRead(id)
    if (!item) return null
    return (
      <ContextMenu content={setV => <FeedItemMenu parentFolderId={parentFolderId} id={id} onClose={() => setV(false)} />}>
        <Content flex alignItems={'center'} className={classnames('py-2', isRead && 'transparent-font')} gap={10}>
          <div
            style={{
              flex: 1
            }}
            onClick={onClick}
            className={'ellipsis-font-1 hover:underline cursor-pointer'}
          >
            {item.title}
          </div>
          <ItemsToolbar isFocused={false} itemId={id} />
        </Content>
      </ContextMenu>
    )
  },
  (prev, curr) => prev.id === curr.id
)
