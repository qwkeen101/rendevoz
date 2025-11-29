import React, { memo } from 'react'
import { ObjectStore } from '@/api/stores'
import gN from '@/assets/images/google-news.png?url'
import ItemsToolbar from '@/core/components/feed/components/items/ItemsToolbar'
import useFeedIsRead from '@/core/components/feed/hooks/useFeedIsRead'
import classnames from 'classnames'
import ContextMenu from '@/components/contextMenu'
import FeedItemMenu from '@/core/components/feed/components/FeedItemMenu'

const MagazineFeedItem = memo(
  ({
    id,
    onClick,
    className,
    parentFolderId,
    showSource = true
  }: {
    id: number
    onClick?: React.MouseEventHandler
    className?: string
    parentFolderId?: number
    showSource?: boolean
  }) => {
    const item = ObjectStore('feed').useValue(id)
    const isRead = useFeedIsRead(id)
    const collection = ObjectStore('feedCollection').useValue(item?.collectionId)
    const source = item?.source ?? collection?.name
    const sourceIcon = item?.favicon ?? (collection?.icon === 'gNews' ? gN : collection?.icon)
    if (!item) return null
    return (
      <ContextMenu content={setV => <FeedItemMenu parentFolderId={parentFolderId} id={id} onClose={() => setV(false)} />}>
        <div className={classnames('@container flex gap-6 py-6 min-h-48', isRead && 'transparent-font', className)}>
          <div className={'flex flex-col flex-auto gap-1'}>
            {source && showSource && (
              <div className={'flex items-center gap-2 text-sm font-medium leading-none'}>
                {sourceIcon && <img src={sourceIcon} className={'w-3.5 h-3.5 object-cover rounded-sm'} />}
                <div>{source}</div>
              </div>
            )}
            <div onClick={onClick} className={'font-bold text-xl line-clamp-2 cursor-pointer hover:underline'}>
              {item.title}
            </div>
            {item.description && <div className={classnames('ellipsis-font-2 max-w-5xl')}>{item.description}</div>}
            <div className={'w-full mt-auto pt-3'}>
              <ItemsToolbar className={'!gap-4'} isFocused={false} itemId={item.id} />
            </div>
          </div>
          {item.image && (
            <div className={'@4xl:w-64 @4xl:h-40 shrink-0 h-36 w-36 rounded-lg overflow-hidden'}>
              <img crossOrigin={'anonymous'} src={item.image} className={'w-full h-full object-cover shrink-0'}></img>
            </div>
          )}
        </div>
      </ContextMenu>
    )
  },
  (prev, curr) => prev.id === curr.id
)
export default MagazineFeedItem
