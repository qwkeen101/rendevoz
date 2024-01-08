import { MetaObject } from '~/typings'
import { CSSProperties } from 'react'
import { CheckBox, Content } from '@/components'

export default ({
  value,
  style,
  onChange,
  className
}: {
  value?: boolean
  style?: CSSProperties
  className?: string
  onChange?: (date: boolean) => void
}) => {
  return (
    <>
      <Content
        className={className}
        role={'prop-container'}
        style={{
          width: '100%',
          ...style
        }}
        onClick={() => {
          onChange?.(!value)
        }}
      >
        <CheckBox
          style={{
            width: 16,
            height: 16
          }}
          checked={value}
        ></CheckBox>
      </Content>
    </>
  )
}
