import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('info', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <path d="M512 224m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z" fill={'currentColor'}></path>
    <path d="M544 392h-64c-4.4 0-8 3.6-8 8v464c0 4.4 3.6 8 8 8h64c4.4 0 8-3.6 8-8V400c0-4.4-3.6-8-8-8z" fill={'currentColor'}></path>
  </svg>
))