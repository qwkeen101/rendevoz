import { useToggle } from '@/hooks'
import { CSSProperties } from 'react'
import { Icon } from '..'
import Content from './Content'

const CheckBox = ({
  checked,
  onChange,
  style,
  className
}: {
  checked?: boolean
  onChange?: (checked: boolean) => void
  style?: CSSProperties
}) => {
  return (
    <Content
      flex
      centered
      style={{  border: '1px solid rgba(31,34,39,0.15)', borderRadius: 6, width: 20, height: 20, ...style }}
      className={className}
    >
      {checked && <Icon onClick={() => onChange?.(!checked)} name="park-check" />}
    </Content>
  )
}

export default CheckBox
