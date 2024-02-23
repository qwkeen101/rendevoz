import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('rect', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="none" stroke="currentColor" strokeWidth={props.strokeWidth} d={'M 42 8 H 4 C 4 8 4 8 4 10 V 40 C 4 40 4 40 6 40 H 44 C 44 40 44 40 44 40 V 10 C 44 8 44 8 44 8 Z'}></path>
  </svg>
))