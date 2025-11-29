import React from 'react'
import { ObjectStore } from '@/api/stores'
import ContextMenu from '@/components/contextMenu'
import FeedItemMenu from '@/core/components/feed/components/FeedItemMenu'
import gN from '@/assets/images/google-news.png?url'
import { Icon } from '@/components'
const CardFeedItem = ({
  id,
  onClick,
  parentFolderId,
  showSource = true
}: {
  id: number
  parentFolderId?: number
  onClick?: React.MouseEventHandler
  showSource?: boolean
}) => {
  const item = ObjectStore('feed').useValue(id)
  const collection = ObjectStore('feedCollection').useValue(item?.collectionId)
  if (!item) return null
  const { image, source, title } = item
  const sourceIcon = item?.favicon ?? (collection?.icon === 'gNews' ? gN : collection?.icon)
  return (
    <ContextMenu content={setV => <FeedItemMenu parentFolderId={parentFolderId} id={id} onClose={() => setV(false)} />}>
      <div onClick={onClick} className={'w-full flex flex-col'}>
        <div
          className={
            'w-full cursor-pointer relative aspect-video rounded-2xl mb-2 overflow-hidden flex items-center justify-center bg-secondary'
          }
        >
          {image ? (
            <img src={image} className={'absolute w-full h-full inset-0 object-cover'} />
          ) : (
            <Icon size={36} className={'transparent-font'} name={'park-broadcast'} />
          )}
        </div>
        {source && showSource && (
          <div className={'flex items-center gap-2 mb-1.5 mt-2 text-sm font-medium leading-none'}>
            {sourceIcon && <img src={sourceIcon} className={'w-3.5 h-3.5 object-cover rounded-sm'} />}
            <div>{source}</div>
          </div>
        )}
        <div className={'font-medium cursor-pointer hover:underline line-clamp-2'}>{item.title}</div>
      </div>
    </ContextMenu>
  )
}

export default CardFeedItem
