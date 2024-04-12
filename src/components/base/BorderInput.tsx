import { KEY } from '@/consts'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { isHotkey } from 'is-hotkey'
import { CSSProperties, HTMLProps, useEffect, useRef, useState } from 'react'
import { AutosizeTextarea } from '@/components'
import classnames from 'classnames'

type BorderInputProps = Omit<HTMLProps<HTMLInputElement>, 'onChange'> & {
  onChange?: (v: string) => void
  placeholder?: string
  style?: CSSProperties
  defaultValue?: string
  containerStyle?: CSSProperties
  autoFocus?: boolean
  disable?: boolean
  id?: string
  spellCheck?: 'false' | 'true'
  textarea?: boolean
}

const inputClassName = css({
  padding: '12px 16px',
  width: '100%',
  position: 'relative'
})
const BorderInput = ({
  value,
  onChange,
  placeholder,
  style,
  defaultValue,
  textarea,
  autoFocus,
  spellCheck = 'false',
  disable,
  containerStyle,
  id,
  ...rest
}: BorderInputProps) => {
  const [innerValue, setValue] = useState(value || defaultValue || '')
  const showText = innerValue && innerValue !== ''
  const inputRef = useRef<HTMLElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setTimeout(() => {
      if (autoFocus) {
        inputRef.current?.focus()
      }
    })
  }, [])
  const translatedPlaceholder = showText && placeholder
  return (
    <fieldset
      className={css({
        border: '1px solid var(--border-background)',
        transition: 'border-color 0.25s ease',
        ':focus-within': {
          border: '1px solid var(--select-color)'
        }
      })}
      style={{ position: 'relative', borderRadius: 6, ...containerStyle }}
    >
      <AnimatePresence initial={false}>
        {translatedPlaceholder && (
          <motion.legend
            ref={placeholderRef}
            initial={{ opacity: 0, x: 6, y: 16 }}
            animate={{ opacity: 1, x: 0, y: -6, zIndex: 1 }}
            exit={{ opacity: 0, x: 6, y: 16, position: 'absolute' }}
            className={'font-size-12 transparent-font'}
            style={{
              height: 0,
              width: 'fit-content',
              marginLeft: 6,
              marginBottom: 0,
              lineHeight: 1,
              padding: '0px 2px'
            }}
          >
            {placeholder}
          </motion.legend>
        )}
      </AnimatePresence>
      {textarea ? (
        <AutosizeTextarea
          id={id}
          placeholder={placeholder}
          spellCheck={spellCheck}
          {...rest}
          style={style}
          className={classnames(inputClassName, 'font-size-14')}
          defaultValue={defaultValue}
          value={value ?? innerValue}
          disabled={disable}
          autoFocus={autoFocus}
          ref={inputRef}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              e.stopPropagation()
            }
            rest.onKeyDown?.(e)
          }}
          onChange={e => {
            onChange?.(e)
            setValue(e)
          }}
        />
      ) : (
        <input
          id={id}
          style={style}
          defaultValue={defaultValue}
          spellCheck={spellCheck}
          ref={inputRef}
          value={value ?? innerValue}
          placeholder={placeholder}
          onChange={e => {
            onChange?.(e.target.value)
            setValue(e.target.value)
          }}
          autoFocus={autoFocus}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              e.stopPropagation()
            }
            rest.onKeyDown?.(e)
          }}
          disabled={disable}
          className={inputClassName}
        ></input>
      )}
    </fieldset>
  )
}

export default BorderInput
