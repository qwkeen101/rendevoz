import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('straight', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} viewBox="0 0 48 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 3L45 8L40 13" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path
      d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
      stroke-linejoin="round"
    />
    <path d="M12 8L40,8" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
))
