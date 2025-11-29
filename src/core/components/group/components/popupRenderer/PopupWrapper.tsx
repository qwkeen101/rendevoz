import { Box } from '~/typings'
import { CSSProperties, forwardRef, ReactNode } from 'react'
import { Colors } from '@/consts'

const PopupWrapper = forwardRef(({ box, children, style }: { box: Box; children: ReactNode; style?: CSSProperties }, ref) => {
  return (
    <div
      ref={ref}
      role={'popup-wrapper'}
      onContextMenu={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: box.top,
        left: box.left,
        width: box.width,
        background: Colors.Background.Popover,
        boxShadow: Colors.Background.PopoverBoxShadow,
        borderRadius: '0.5rem',
        ...style
      }}
    >
      {children}
    </div>
  )
})
export default PopupWrapper
