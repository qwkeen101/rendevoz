import { Content, Icon, IconWithPopover } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { DateFormat } from '@/utils'
import { Colors, Icons } from '@/consts'
import useFeedIsMeta from '@/core/components/feed/hooks/useFeedIsMeta'
import addFeedAsMeta from '@/core/components/feed/utils/service/addFeedAsMeta'
import classnames from 'classnames'
import FeedItemMenu from '@/core/components/feed/components/FeedItemMenu'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import MetaPropertyStore from '@/api/stores/meta/metaProperty.store'

const ItemsToolbar = ({ itemId, isFocused = false, className }: { itemId: number; isFocused: boolean; className?: string }) => {
  const item = ObjectStore('feed').useValue(itemId)
  const { isMeta, metaId } = useFeedIsMeta(itemId)
  const instance = useFeedInstance()
  if (!item) return null
  return (
    <div className={classnames('font-size-13 flex gap-3.5 items-center', !isFocused && 'transparent-font', className)}>
      {item.date && <span className={'font-size-12'}>{DateFormat.formatDistanceToNowStrict(item.date)}</span>}
      <Icon
        theme={item.followed ? 'filled' : undefined}
        onClick={e => {
          instance.feedOps?.follow(itemId)
          e.stopPropagation()
        }}
        size={15}
        className={classnames('cursor-pointer', item.followed ? 'text-red-500' : 'transparent-font hover-primary-color')}
        name={Icons.Follow}
      />
      <Icon
        style={{
          color: isMeta ? Colors.Common.SelectColor : undefined
        }}
        size={15}
        theme={isMeta ? 'filled' : undefined}
        onClick={e => {
          e.stopPropagation()
          if (!isMeta) {
            addFeedAsMeta(itemId, metaId)
          } else if (metaId) {
            Global.metaOps.openDetails?.(metaId)
          }
        }}
        className={'cursor-pointer transparent-font hover-primary-color'}
        name={isMeta ? Icons.Info : Icons.AddAsObject}
      />
      <IconWithPopover
        placement={['right', 'bottom', 'top']}
        name={Icons.More}
        size={17}
        padding={6}
        renderOnParent={false}
        onClick={e => e.stopPropagation()}
        className={'cursor-pointer transparent-font hover-primary-color'}
        content={setV => <FeedItemMenu id={itemId} onClose={() => setV(false)} />}
      ></IconWithPopover>
    </div>
  )
}

export default ItemsToolbar
