import { memo } from 'react'
import { Resizable } from 're-resizable'
import Feeds from '@/components/layout/sidebar/main/Feeds'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default memo(() => {
  const ids = KeyvalueStore.useValue('sidebarExpandData')
  const hidden = ids?.includes('feed')
  return (
    <Resizable
      key={hidden ? 'true' : 'false'}
      className={'flex flex-col pt-0 p-3 pr-0'}
      enable={hidden ? false : { right: true }}
      defaultSize={{ width: hidden ? 'auto' : 320, height: '100%' }}
    >
      <Feeds
        header={false}
        expandIds={ids}
        onExpand={id => KeyvalueStore.updateOne('sidebarExpandData', ids?.includes(id) ? ids.filter(i => i !== id) : [...(ids || []), id])}
      />
    </Resizable>
  )
})
