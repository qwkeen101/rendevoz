import { memo } from 'react'
import { useSelectMediaState, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { Icon } from '@/components'

export default memo(() => {
  const { name, layout } = useSelectMediaState(s => ({
    name: s.name,
    layout: s.layout
  }))
  const setMediaState = useSetMediaState()
  return (
    <div className={'sticky w-full flex py-3 items-center justify-between top-0 z-20 px-3'}>
      <div
        style={{
          maxWidth: '70%'
        }}
        className={'flex items-center'}
      >
        {layout?.headerLeft}
        <div className={'line-clamp-1 break-all pl-2'}>{name}</div>
      </div>
      <div className={'flex gap-5'}>
        {layout?.headerRight}
        <Icon
          onClick={() => setMediaState(s => ({ ...s, sidebarVisible: !s.sidebarVisible }))}
          size={20}
          className={'hover-active-button mr-2'}
          name={'custom-right-bar'}
        />
      </div>
    </div>
  )
})
