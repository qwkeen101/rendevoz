import { FC } from 'react'
import { Content, Icon } from '..'
import { Colors } from '@/consts'

interface SpinnerProps {
  size?: number
  color?: string
}
const Spinner: FC<SpinnerProps> = ({ size = 20, color = Colors.Common.SelectColor }) => {
  return (
    <Content fullHeight fullWidth flex centered>
      <Icon size={size} fill={color} name="park-loading-four" spin />
    </Content>
  )
}

export default Spinner
