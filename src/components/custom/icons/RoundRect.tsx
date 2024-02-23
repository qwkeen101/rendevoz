import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('round-rect', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth}
      d={
        'M 42 8 H 13 C 4.8954 8 4 8.8954 4 17 V 31 C 4 39.1046 4.8954 40 13 40 H 35 C 43.1046 40 44 39.1046 44 31 V 17 C 44 8.8954 43.1046 8 35 8 Z'
      }
    ></path>
  </svg>
))
