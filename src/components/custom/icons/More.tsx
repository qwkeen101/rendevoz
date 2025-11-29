import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('more', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="8" cy="24" r="3.5" fill="currentColor"></circle>
    <circle cx="24" cy="24" r="3.5" fill="currentColor"></circle>
    <circle cx="40" cy="24" r="3.5" fill="currentColor"></circle>
  </svg>
))
