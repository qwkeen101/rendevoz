import { CSSProperties, FC } from 'react'
import { Colors } from '@/consts'

interface ToolbarSeparatorProps {
  direction?: 'vertical' | 'horizontal'
}

const ToolbarSeparator: FC<ToolbarSeparatorProps> = ({ direction }) => {
  const verticalSeparator: CSSProperties = {
    width: '1px',
    height: '100%',
    background: Colors.Background.Border
  }
  const horizontalSeparator: CSSProperties = {
    borderRight: `1px solid ${Colors.Background.Border}`
  }
  return <div style={direction === 'horizontal' ? verticalSeparator : horizontalSeparator}></div>
}

export default ToolbarSeparator
