import { useState } from 'react'
import { GroupOverlayAvaibleContents, XYPosition } from '~/typings'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { assignProperties } from '@/utils'
import { AnimatePopover, WithBorder } from '@/components'
import RowMenu from '@/core/components/group/components/menu/RowMenu'

export default () => {
  const [overlayState, setOverlayState] = useState<
    {
      visible: boolean
      position?: XYPosition
    } & Partial<GroupOverlayAvaibleContents>
  >({ visible: false })

  const instance = useGroupInstance()
  assignProperties(instance, {
    overlayOps: {
      open: (content, position) => setOverlayState({ visible: true, position, ...content })
    }
  })
  const align = () => {
    if (overlayState.align) {
      return overlayState.align
    }
    return 'center'
  }
  const positions = () => {
    switch (overlayState.type) {
      case 'itemContextMenu':
        return ['right', 'left', 'top']
    }
    return ['right', 'left', 'top']
  }
  const renderContent = () => {
    switch (overlayState.type) {
      case 'itemContextMenu':
        if (!overlayState.details) return null
        return (
          <WithBorder padding={6}>
            <RowMenu details={overlayState.details} onClose={() => setOverlayState(s => ({ ...s, visible: false }))} />
          </WithBorder>
        )
    }
    return null
  }
  console.log(overlayState)
  return (
    <AnimatePopover
      positions={positions()}
      align={align()}
      withClickCover={true}
      onClickOutside={() => setOverlayState(o => ({ ...o, visible: false }))}
      visible={overlayState.visible}
      content={renderContent()}
      position={{ left: overlayState.position?.x ?? 0, top: overlayState.position?.y ?? 0 }}
    />
  )
}
