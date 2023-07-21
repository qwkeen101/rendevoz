import { IconWrapper, ISvgIconProps } from '@icon-park/react/es/runtime'

export default IconWrapper('markdown', true, (props: ISvgIconProps) => (
  <svg width={props.size} height={props.size} fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <path
      stroke={props.colors[0]}
      strokeWidth={props.strokeWidth}
      strokeLinecap={props.strokeLinecap}
      strokeLinejoin={props.strokeLinejoin}
      d="M128 128h768a42.666667 42.666667 0 0 1 42.666667 42.666667v682.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H128a42.666667 42.666667 0 0 1-42.666667-42.666667V170.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z m42.666667 85.333333v597.333334h682.666666V213.333333H170.666667z m128 448H213.333333v-298.666666h85.333334l85.333333 85.333333 85.333333-85.333333h85.333334v298.666666h-85.333334v-170.666666l-85.333333 85.333333-85.333333-85.333333v170.666666z m469.333333-128h85.333333l-128 128-128-128h85.333334v-170.666666h85.333333v170.666666z"
    ></path>
  </svg>
))
