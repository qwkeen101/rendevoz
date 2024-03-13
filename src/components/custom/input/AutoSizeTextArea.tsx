import * as React from 'react'
import { CSSProperties, useEffect, useLayoutEffect } from 'react'
import classnames from 'classnames'
import { css } from '@emotion/css'
import { useMergedRef } from '@/hooks'
import { Colors } from '@/consts'
import { setCaretAtEnd } from '@/core/components/editor/utils/positions/caret'

// use contenteditable to replace textarea
type TextareaProps = React.AllHTMLAttributes<HTMLDivElement>

export interface TextareaAutosizeProps extends Omit<TextareaProps, 'style' | 'onChange'> {
  style?: CSSProperties
  onChange?: (v: string) => void
  value?: string
  defaultValue?: string
}

const c = css({
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  ':empty:before': {
    content: 'attr(placeholder)',
    position: 'absolute',
    display: 'block',
    color: Colors.Font.SuperTransparent,
    pointerEvents: 'none'
  }
})
const noop = () => {}
const TextareaAutosize: React.ForwardRefRenderFunction<HTMLDivElement, TextareaAutosizeProps> = (
  { onChange = noop, ...props },
  userRef: React.Ref<HTMLDivElement>
) => {
  const libRef = React.useRef<HTMLDivElement | null>(null)
  const ref = useMergedRef(libRef, userRef)
  useEffect(() => {
    if (props.autoFocus) {
      setTimeout(() => {
        libRef.current?.focus()
      }, 100)
    }
  }, [])
  const handleChange = (v: string) => {
    onChange(v)
  }
  useLayoutEffect(() => {
    const l = libRef.current
    if (l) {
      l.innerText = props.value || props.defaultValue || ''
    }
  }, [])

  return (
    <div
      {...props}
      className={classnames(c, props.className)}
      style={{
        ...props.style,
        minHeight: props.style?.minHeight || '1lh'
      }}
      onPaste={e => {
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
      }}
      onInput={e => {
        handleChange(e.currentTarget.innerText || '')
      }}
      onFocus={e => {
        setCaretAtEnd(e.currentTarget)
      }}
      ref={ref}
      contentEditable={props.disabled ? 'false' : 'true'}
      spellCheck={'false'}
    ></div>
  )
}

export default React.forwardRef(TextareaAutosize)
