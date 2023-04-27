import { KEY } from '@/consts'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import isHotkey from 'is-hotkey'
import { CSSProperties, useState } from 'react'
import AutosizeTextarea, { TextareaAutosizeProps } from '../custom/input/autosizeTextarea'
import Colors from '@/consts/colors'

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

const BorderInput = ({
  value,
  onChange,
  placeholder,
  style,
  defaultValue,
  textarea,
  autoFocus,
  spellCheck,
  disable,
  ...rest
}: BorderInputProps) => {
  const [innerValue, setValue] = useState(value || defaultValue || '')
  const showText = innerValue && innerValue !== ''

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence>
        {showText && placeholder && (
          <motion.div
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: -6, y: -16, zIndex: 1 }}
            exit={{ opacity: 0, x: 0, y: 0 }}
            className={css({
              position: 'absolute',
              left: 16,
              top: 10,
              fontSize: '0.857rem',
              color: Colors.Font.Secondary,
              fontWeight: 600,
              fontFamily: 'Muli',
              lineHeight: 1
            })}
          >
            {placeholder}
          </motion.div>
        )}
      </AnimatePresence>
      {textarea ? (
        <AutosizeTextarea
          placeholder={placeholder}
          minRows={2}
          spellCheck={spellCheck}
          {...rest}
          style={{ resize: 'none', ...style }}
          className={ClassName.input()}
          defaultValue={defaultValue}
          disabled={disable}
          autoFocus={autoFocus}
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
          value={innerValue}
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
          className={ClassName.input()}
        ></input>
      )}
    </div>
  )
}

export default BorderInput
