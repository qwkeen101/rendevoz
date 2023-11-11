import { css } from '@emotion/css'
import { CSSProperties } from 'react'
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
  className?: string
}) => {
  return (
    <Content
      flex
      centered
      onClick={() => onChange?.(!checked)}
      style={{
        width: 14,
        height: 14,
        cursor: 'pointer',
        ...style
      }}
      className={className}
    >
      <input type={'checkbox'} checked={checked} style={{ width: '100%', height: '100%', cursor: 'pointer' }} />
    </Content>
  )
}

export default CheckBox
