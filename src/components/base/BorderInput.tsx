import { KEY } from '@/consts'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import isHotkey from 'is-hotkey'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import AutosizeTextarea, { TextareaAutosizeProps } from '../custom/input/autosizeTextarea'
import Colors from '@/consts/colors'
import { useUpdate } from 'react-use'
import FontSize from '@/consts/font'

type BorderInputProps = {
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
  style?: CSSProperties
  defaultValue?: string
  textarea?: boolean
  autoFocus?: boolean
  disable?: boolean
  spellCheck?: 'false' | 'true'
} & (
  | ({
      textarea: true
    } & TextareaAutosizeProps)
  | {
      textarea: false
    }
)

const inputClassName = css({
  padding: '12px 16px',
  width: '100%',
  outline: 'none',
  position: 'relative',
  fontSize: FontSize['14px'],
  fontWeight: 500,
  letterSpacing: '-0.04px',
  borderRadius: 6,
  border: 'none',
  background: 'transparent'
  // border: `1px solid ${Colors.Background.Border}`,
  // transition: 'all 0.2s ease',
  // ':hover': {
  // background: `${Colors.Background.Border}`
  // },
  // ':focus': {
  // border: '1px solid var(--font-secondary)'
  // }
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
  ...rest
}: BorderInputProps) => {
  const [innerValue, setValue] = useState(value || defaultValue || '')
  const showText = innerValue && innerValue !== ''
  const update = useUpdate()
  const inputRef = useRef<HTMLElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    update()
    setTimeout(() => {
      if (autoFocus) {
        console.log('focus')
        inputRef.current?.focus()
      }
    })
  }, [])
  const translatedPlaceholder = showText && placeholder
  return (
    <fieldset
      className={css({
        border: `1px solid ${Colors.Background.Border}`,
        transition: 'all 0.2s ease',
        ':hover': {
          background: `${Colors.Background.Border}`
        },
        ':focus-within': {
          border: '1px solid var(--font-secondary)'
        }
      })}
      style={{ position: 'relative', borderRadius: 8 }}
    >
      <AnimatePresence>
        {translatedPlaceholder && (
          <motion.legend
            ref={placeholderRef}
            initial={{ opacity: 0, x: 6, y: 16 }}
            animate={{ opacity: 1, x: 0, y: -6, zIndex: 1 }}
            exit={{ opacity: 0, x: 6, y: 16 }}
            className={css({
              // position: 'absolute',
              // left: 16,
              // top: 10,
              height: 0,
              width: 'fit-content',
              fontSize: '0.857rem',
              marginLeft: 6,
              marginBottom: 0,
              color: Colors.Font.Secondary,
              fontWeight: 600,
              fontFamily: 'Muli',
              lineHeight: 1,
              padding: '0px 2px'
            })}
          >
            {placeholder}
          </motion.legend>
        )}
      </AnimatePresence>
      {textarea ? (
        <AutosizeTextarea
          placeholder={placeholder}
          minRows={2}
          spellCheck={spellCheck}
          {...rest}
          style={{ resize: 'none', ...style }}
          className={inputClassName}
          defaultValue={defaultValue}
          value={value || innerValue}
          disabled={disable}
          autoFocus={autoFocus}
          ref={inputRef}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              e.stopPropagation()
            }
          }}
          onChange={e => {
            onChange?.(e.target.value)
            setValue(e.target.value)
          }}
        />
      ) : (
        <input
          style={style}
          defaultValue={defaultValue}
          spellCheck={spellCheck}
          ref={inputRef}
          value={value || innerValue}
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
          }}
          disabled={disable}
          className={inputClassName}
        ></input>
      )}
    </fieldset>
  )
}

export default BorderInput
