import { Box } from '~/typings'
import { CSSProperties, ReactNode } from 'react'
import { Colors } from '@/consts'

const PopupWrapper = ({ box, children, style }: { box: Box; children: ReactNode; style?: CSSProperties }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: box.top,
        left: box.left,
        width: box.width,
        background: Colors.Background.Secondary,
        boxShadow: Colors.Background.BoxShadow,
        borderRadius: 4,
        ...style
      }}
    >
      {children}
    </div>
  )
}

export default PopupWrapper
