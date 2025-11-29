import { Fragment, memo } from 'react'
import { Button, Icon } from '@/components'
import { BuiltInSidebarItems } from '@/components/layout/sidebar'
import SidebarUser from '@/components/layout/sidebar/SidebarUser'
import { Icons } from '@/consts'
import BottomIcons from '@/components/layout/sidebar/main/BottomIcons'
import Folder from '@/components/layout/sidebar/main/Folder'
import Pinned from '@/components/layout/sidebar/main/Pinned'

export type ISidebarWidgetProps = {
  onExpand?: (id: string) => void
  expandIds?: string[]
  onCollapse?: VoidFunction
  collapsed?: boolean
  header?: boolean
}

export default memo(() => {
  return (
    <div className={'w-full h-full flex flex-col'}>
      <div className={'w-full p-3 shrink-0'}>
        <SidebarUser
          extra={
            <Icon
              onClick={e => {
                e.stopPropagation()
                Global.layoutOps?.closeFloatSidebar()
                Global.metaOps.createObjects?.(undefined, undefined, {
                  openAfterTriggerOnce: true
                })
              }}
              strokeWidth={4}
              className={'hover-active-button ml-auto'}
              size={20}
              name={Icons.Create}
            />
          }
        />
        {[BuiltInSidebarItems['search'], BuiltInSidebarItems['home'], BuiltInSidebarItems['database']].map(i => (
          <Button.IconButton key={i.key} onClick={i.onClick} icon={i.icon} text={i.text?.()} />
        ))}
      </div>
      <div className={'overflow-y-auto flex-1 w-full p-3'}>
        <Pinned />
        <Folder />
      </div>
      <BottomIcons />
    </div>
  )
})

export { default as SidebarExpandItem } from './SidebarExpandItem'
