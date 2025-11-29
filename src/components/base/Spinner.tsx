import { FC } from 'react'
import { Icon } from '..'
import { Icons } from '@/consts'

interface SpinnerProps {
  size?: number
  color?: string
}
const Spinner: FC<SpinnerProps> = ({ size = 48, color }) => {
  return (
    <div className={'w-full h-full flex items-center justify-center'}>
      <Icon size={size} fill={color} name={Icons.Loading} spin />
    </div>
  )
}

export default Spinner
