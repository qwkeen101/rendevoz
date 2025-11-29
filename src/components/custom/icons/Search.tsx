import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('search', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path
      d="M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M33.2216 33.2217L41.7069 41.707"
      stroke="currentColor"
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
))
