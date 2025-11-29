import * as React from 'react'
import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import classnames from 'classnames'
import { css } from '@emotion/css'
import { useDebounceFn, useMergedRef } from '@/hooks'
import { Colors } from '@/consts'
import { setCaretAtEnd } from '@/core/components/editor/utils/positions/caret'
import { auto } from 'openai/_shims/registry'

// use contenteditable to replace textarea
type TextareaProps = React.AllHTMLAttributes<HTMLDivElement>

export interface TextareaAutosizeProps extends Omit<TextareaProps, 'style' | 'onChange'> {
  style?: CSSProperties
  onChange?: (v: string) => void
  value?: string
  defaultValue?: string
  debounceChange?: boolean
  autoFocusDelay?: number
  placeholderColor?: 'primary' | 'secondary'
}

const c = css({
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  ':empty:before': {
    content: 'attr(placeholder)',
    display: 'block',
    color: 'var(--placeholder-color)',
    pointerEvents: 'none',
    minHeight: '1lh'
  }
})
const noop = () => {}
const TextareaAutosize: React.ForwardRefRenderFunction<HTMLDivElement, TextareaAutosizeProps> = (
  { onChange = noop, debounceChange, autoFocusDelay, value, placeholderColor = 'secondary', ...props },
  userRef: React.Ref<HTMLDivElement>
) => {
  const libRef = React.useRef<HTMLDivElement | null>(null)
  const ref = useMergedRef(libRef, userRef)
  const blured = useRef(false)
  const edited = useRef(false)
  useEffect(() => {
    if (props.autoFocus) {
      setTimeout(() => {
        libRef.current?.focus()
      }, autoFocusDelay ?? 0)
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
    if (l && (value !== undefined || props.defaultValue !== undefined)) {
      l.innerText = value || props.defaultValue || ''
    }
  }, [])
  useEffect(() => {
    if (props.defaultValue !== undefined && !edited.current) {
      const l = libRef.current
      if (l) {
        l.innerText = props.defaultValue || ''
      }
    }
  }, [props.defaultValue])
  useLayoutEffect(() => {
    const l = libRef.current
    if (l && !isEditing.current && value !== undefined && value !== l.innerText) {
      l.innerText = value || ''
    }
  }, [value])
  return (
    <div
      {...props}
      className={classnames(c, props.className)}
      style={{
        ...props.style,
        '--placeholder-color': placeholderColor === 'primary' ? 'var(--font-placeholder)' : 'var(--font-placeholder-secondary)',
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
        props.onFocus?.(e)
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
    ></div>
  )
}

export default React.forwardRef(TextareaAutosize)
