import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('straight', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <path
      stroke={props.colors[0]}
      strokeWidth={props.strokeWidth}
      strokeLinecap={props.strokeLinecap}
      strokeLinejoin={props.strokeLinejoin}
      d="M47.388444 147.911111a100.522667 100.522667 0 0 1 192.853334-39.822222H329.955556a221.866667 221.866667 0 0 1 221.866666 221.866667v364.088888a142.222222 142.222222 0 0 0 142.222222 142.222223h89.770667a100.522667 100.522667 0 1 1 0 79.644444H694.044444a221.866667 221.866667 0 0 1-221.866666-221.866667V329.955556a142.222222 142.222222 0 0 0-142.222222-142.222223H240.241778a100.522667 100.522667 0 0 1-192.853334-39.822222zM147.911111 127.032889a20.878222 20.878222 0 1 0 0 41.756444 20.878222 20.878222 0 0 0 0-41.756444z m728.177778 728.177778a20.878222 20.878222 0 1 0 0 41.756444 20.878222 20.878222 0 0 0 0-41.699555z"
      fill="currentColor"
    ></path>
  </svg>
))
