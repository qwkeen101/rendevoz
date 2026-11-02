import { memo } from 'react'
import { Icon } from '@/components'
import { BuiltInSidebarItems } from '@/components/layout/sidebar'

type ISidebarItem = (typeof BuiltInSidebarItems)[keyof typeof BuiltInSidebarItems]

// The 2025-11 sidebar redesign dropped graph, trash and settings from the
// sidebar; settings was then only reachable from the signed-in user menu.
// They live on the right of this row.
export default memo(() => {
  const renderIcon = (i: ISidebarItem) => (
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
  )
  return (
    <div className={'shrink-0 flex gap-1.5 p-3'}>
      {[BuiltInSidebarItems['feeds'], BuiltInSidebarItems['youtube'], BuiltInSidebarItems['podcast']].map(renderIcon)}
      <div className={'ml-auto flex gap-1.5'}>
        {[BuiltInSidebarItems['graph'], BuiltInSidebarItems['recycleBin'], BuiltInSidebarItems['settings']].map(renderIcon)}
      </div>
    </div>
  )
})
