import { AnimatePopover, Icon, IconWithPopover, WithBorder } from '@/components'
import { ObjectActionPopover } from '@/core'
import { useState } from 'react'

export default ({ metaId }: { metaId: number }) => {
  const [visible, setVisible] = useState(false)
  const renderIcon = () => (
    <AnimatePopover
      visible={visible}
      onVisiblityChange={v => setVisible(v)}
      positions={['right', 'left']}
      onClickOutside={() => setVisible(false)}
      content={
        <WithBorder>
          <ObjectActionPopover onClose={() => setVisible(false)} metaObjectId={metaId} />
        </WithBorder>
      }
    >
      <Icon name={'park-more'} />
    </AnimatePopover>
  )
  return {
    renderIcon,
    open: () => setVisible(true)
  }
}
