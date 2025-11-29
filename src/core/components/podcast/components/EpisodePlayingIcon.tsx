import './index.css'
import { CSSProperties } from 'react'
import classnames from 'classnames'
export default ({ style, className }: { style?: CSSProperties; className?: string }) => (
  <div style={style} className={classnames('audio-wave', className)}>
    <span></span>
    <span></span>
    <span></span>
  </div>
)
