import * as React from 'react'
import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import classnames from 'classnames'
import { css } from '@emotion/css'
import { useDebounceFn, useMergedRef } from '@/hooks'
import { Colors } from '@/consts'
import { setCaretAtEnd } from '@/core/components/editor/utils/positions/caret'

// use contenteditable to replace textarea
type TextareaProps = React.AllHTMLAttributes<HTMLDivElement>

export interface TextareaAutosizeProps extends Omit<TextareaProps, 'style' | 'onChange'> {
  style?: CSSProperties
  onChange?: (v: string) => void
  value?: string
  defaultValue?: string
  debounceChange?: boolean
}

const c = css({
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  ':empty:before': {
    content: 'attr(placeholder)',
    display: 'block',
    color: Colors.Font.SuperTransparent,
    pointerEvents: 'none',
    minHeight: '1lh'
  }
})
const noop = () => {}
const TextareaAutosize: React.ForwardRefRenderFunction<HTMLDivElement, TextareaAutosizeProps> = (
  { onChange = noop, debounceChange, ...props },
  userRef: React.Ref<HTMLDivElement>
) => {
  const libRef = React.useRef<HTMLDivElement | null>(null)
  const ref = useMergedRef(libRef, userRef)
  const blured = useRef(false)
  const edited = useRef(false)
  useEffect(() => {
    if (props.autoFocus) {
      const interval = setInterval(() => {
        if (!blured.current) {
          if (libRef.current !== document.activeElement) {
            libRef.current?.focus()
          }
        } else {
          clearInterval(interval)
        }
      })
      return () => {
        clearInterval(interval)
      }
    }
  }, [])
  const isEditing = useRef(false)
  const handleChange = useDebounceFn(
    (v: string) => {
      onChange?.(v)
    },
    {
      wait: 200
    }
  )
  useEffect(() => {
    const l = libRef.current
    if (l) {
      l.innerText = props.value ?? props.defaultValue ?? ''
    }
  }, [])
  useEffect(() => {
    if (props.defaultValue && !edited.current) {
      const l = libRef.current
      if (l) {
        l.innerText = props.defaultValue ?? ''
      }
    }
  }, [props.defaultValue])
  useLayoutEffect(() => {
    const l = libRef.current
    if (l && !isEditing.current) {
      l.innerText = props.value ?? ''
    }
  }, [props.value])
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
        console.log(e)
        edited.current = true
        let text = e.currentTarget.innerText || ''
        if (text === '\n') {
          e.currentTarget.innerText = ''
          text = ''
        }
        if (debounceChange) {
          handleChange.run(text)
        } else {
          onChange?.(text)
        }
      }}
      onFocus={e => {
        setCaretAtEnd(e.currentTarget)
        isEditing.current = true
      }}
      onBlur={event => {
        blured.current = true
        props.onBlur?.(event)
        setTimeout(() => {
          isEditing.current = false
        })
      }}
      ref={ref}
      contentEditable={props.disabled ? 'false' : 'true'}
      spellCheck={'false'}
    ></div>
  )
}

export default React.forwardRef(TextareaAutosize)
