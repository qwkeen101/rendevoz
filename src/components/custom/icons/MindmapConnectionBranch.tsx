import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('mindmap-connection-branch', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path d="M6 24L22 24" stroke="currentColor" strokeWidth={props.strokeWidth} />
    <path d="M 42 8 H 27 C 22 8 22 8 22 13 V 35 C 22 40 22 40 27 40 H 42" strokeWidth={props.strokeWidth} stroke="currentColor" />
  </svg>
))
