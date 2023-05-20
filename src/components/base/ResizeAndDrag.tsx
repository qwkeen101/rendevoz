import { css } from '@emotion/css'
import { ReactNode, forwardRef } from 'react'
import { Props, Rnd } from 'react-rnd'

// @ts-ignore
export const disableWebviewPointer = css({
  webview: {
    pointerEvents: 'none !important'
  }
})
const ResizeAndDrag = forwardRef<Rnd, Props>((props, ref) => {
  return (
    <Rnd
      {...props}
      ref={ref}
      onResizeStart={(...args) => {
        document.body.classList.add(disableWebviewPointer)
        props.onResizeStart?.(...args)
      }}
      onResizeStop={(...args) => {
        document.body.classList.remove(disableWebviewPointer)
        props.onResizeStop?.(...args)
      }}
    >
      {props.children}
    </Rnd>
  )
})

export default ResizeAndDrag
