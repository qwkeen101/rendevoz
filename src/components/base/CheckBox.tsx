import { useToggle } from '@/hooks'
import { css } from '@emotion/css'
import { CSSProperties } from 'react'
import { Icon } from '..'
import Content from './Content'

const iconClassName = css({
  cursor: 'pointer',
  svg: {
    strokeDasharray: '100px',
    strokeDashoffset: '-100px',
    transition: 'all 0.3s ease',
    transitionDelay: '0.1s',
    transform: 'translate3d(0,0,0)',
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  },
  '&[data-checked="true"]': {
    svg: {
      strokeDashoffset: '0px'
    }
  }
})
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
      style={{ border: '1px solid rgba(31,34,39,0.15)', borderRadius: 6, width: 20, height: 20, ...style }}
      className={className}
    >
      <Icon data-checked={checked} className={iconClassName} name="park-check" />
    </Content>
  )
}

export default CheckBox
