import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'
import { css, keyframes } from '@emotion/css'

const animatedEdgeClazz = css({
  strokeDasharray: 20
})
export default IconWrapper('animatedDash', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path
      className={animatedEdgeClazz}
      stroke={props.colors[0]}
      strokeWidth={10}
      strokeLinecap={props.strokeLinecap}
      strokeLinejoin={props.strokeLinejoin}
      d="M0,50 L100,50"
    ></path>
  </svg>
))
