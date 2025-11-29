import './index.less'
import { memo } from 'react'
import classnames from 'classnames'

export default memo(({ size = 10, className }: { size?: number; className?: string }) => {
  return (
    <div
      style={{
        '--dot-size': `${size}px`
      }}
      className={classnames('dot-flashing', className)}
    ></div>
  )
})
