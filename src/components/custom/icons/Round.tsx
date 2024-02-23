import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('round', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth}
      d={'M 32 8 H 16 C 11 8 4 15 4 20 V 28 C 4 33 11 40 16 40 H 32 C 37 40 44 33 44 28 V 20 C 44 15 37 8 32 8 Z'}
    ></path>
  </svg>
))
