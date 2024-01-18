import { MetaObject } from '~/typings'
import { CSSProperties } from 'react'
import { CheckBox, Content } from '@/components'

export default ({
  value,
  style,
  onChange,
  className,
  name,
  checkBoxSize = 16
}: {
  value?: boolean
  style?: CSSProperties
  className?: string
  name?: string
  checkBoxSize?: number
  onChange?: (date: boolean) => void
}) => {
  return (
    <>
      <Content
        flex
        alignItems={'center'}
        className={className}
        role={'prop-container'}
        gap={10}
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
            width: checkBoxSize,
            height: checkBoxSize
          }}
          checked={value}
        ></CheckBox>
        {name}
      </Content>
    </>
  )
}
