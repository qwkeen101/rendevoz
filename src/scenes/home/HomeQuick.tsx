import { Icon, IconWithPopover, WithBorder } from '@/components'
import { memo } from 'react'
import { BuiltInSidebarItems } from '@/components/layout/sidebar'
type Keys = keyof typeof BuiltInSidebarItems
export default memo(() => {
  return (
    <IconWithPopover
      placement={['bottom']}
      align={'end'}
      name={'park-application-menu'}
      className={'square-button'}
      size={20}
      content={setVisible => (
        <WithBorder className={'p-3 grid grid-cols-3 gap-3'}>
          {(['database', 'graph', 'recycleBin', 'feeds', 'podcast', 'youtube'] as Keys[]).map(i => (
            <div
              onClick={() => {
                setVisible(false)
                BuiltInSidebarItems[i].onClick()
              }}
              key={i}
              className={'button !p-3 !rounded-xl flex flex-col gap-2 items-center'}
            >
              <Icon size={26} name={BuiltInSidebarItems[i].icon} />
              <div>{BuiltInSidebarItems[i].text()}</div>
            </div>
          ))}
        </WithBorder>
      )}
    ></IconWithPopover>
  )
})
