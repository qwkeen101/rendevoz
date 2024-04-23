import { ClassName } from 'rendevoz'
import { memo } from 'react'
import { AnimatePopover, WithBorder } from '@/components'

export default memo(() => {
  return null
  return (
    <AnimatePopover positions={['bottom']} content={<WithBorder>12313213</WithBorder>}>
      <div
        style={{
          height: 26,
          width: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className={ClassName.flatButton(4, '4px')}
      >
        <div
          style={{
            borderRadius: 99,
            width: 8,
            height: 8,
            background: 'red'
          }}
        ></div>
      </div>
    </AnimatePopover>
  )
})
