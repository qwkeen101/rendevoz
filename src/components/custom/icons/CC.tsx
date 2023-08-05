import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('cc', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1152 1024">
    <path
      d="M1024 0H128a128 128 0 0 0-128 128v768a128 128 0 0 0 128 128h896c70.4 0 128-57.6 128-128V128c0-70.4-57.6-128-128-128z m0 896H128V128h896v768zM256 704h192c35.2 0 64-28.8 64-64V576H416v32h-128v-192h128V448H512V384c0-35.2-28.8-64-64-64H256c-35.2 0-64 28.8-64 64v256c0 35.2 28.8 64 64 64z m448 0h192c35.2 0 64-28.8 64-64V576h-96v32h-128v-192h128V448H960V384c0-35.2-28.8-64-64-64h-192c-35.2 0-64 28.8-64 64v256c0 35.2 28.8 64 64 64z"
      fill="currentColor"
    ></path>
  </svg>
))
