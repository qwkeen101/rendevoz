import { AnimatePopover, Button, Icon, IconWithPopover } from '@/components'
import CollectionMenu from '@/core/components/feed/components/components/FeedViewMenu'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { useTranslation } from 'react-i18next'
import { memo } from 'react'

const viewToTranslate = {
  title: 'general.Title view',
  magazine: 'general.Magazine view',
  card: 'general.Card view'
}
export default memo(() => {
  const data = useFeedData()
  const view = data.cardView || 'title'
  let icon = 'custom-list'
  const { t } = useTranslation()
  switch (view) {
    case 'card':
      icon = 'park-all-application'
      break
    case 'magazine':
      icon = 'park-view-grid-list'
      break
  }
  return (
    <AnimatePopover padding={6} positions={['bottom']} content={setV => <CollectionMenu onClose={() => setV(false)} />}>
      <div className={'transparent-font font-size-13 cursor-pointer hover-primary-color transition-colors flex gap-2 items-center'}>
        <Icon size={16} name={icon} />
        {t(viewToTranslate[view])}
      </div>
    </AnimatePopover>
  )
})
