import { memo } from 'react'
import { Icon } from '@/components'
import { BuiltInSidebarItems } from '@/components/layout/sidebar'

export default memo(() => {
  return (
    <div className={'shrink-0 flex gap-1.5 p-3'}>
      {[BuiltInSidebarItems['feeds'], BuiltInSidebarItems['youtube'], BuiltInSidebarItems['podcast']].map(i => (
        <Icon
          key={i.key}
          className={'square-button'}
          size={18}
          name={i.icon}
          tooltip={i.text()}
          onClick={() => {
            i.onClick()
          }}
        />
      ))}
    </div>
  )
})
