import { KEY } from '@/consts'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { isHotkey } from 'is-hotkey'
import { CSSProperties, HTMLProps, useEffect, useRef, useState } from 'react'
import AutosizeTextarea, { TextareaAutosizeProps } from '../custom/input/autosizeTextarea'
import Colors from '@/consts/colors'
import { useUpdate } from 'react-use'
import FontSize from '@/consts/font'
import { useTranslation } from 'react-i18next'

type BorderInputProps = {
  onChange?: (v: string) => void
  placeholder?: string
  style?: CSSProperties
  defaultValue?: string
  textarea?: boolean
  containerStyle?: CSSProperties
  autoFocus?: boolean
  disable?: boolean
  id?: string
  withSubmit?: boolean
  onSubmit?: VoidFunction
  spellCheck?: 'false' | 'true'
} & (
  | ({
      textarea: true
    } & TextareaAutosizeProps)
  | {
      textarea: false
    }
) &
  HTMLProps<HTMLInputElement>

const inputClassName = css({
  padding: '12px 16px',
  width: '100%',
  outline: 'none',
  position: 'relative',
  fontSize: FontSize['13px'],
  fontWeight: 500,
  border: 'none',
  background: 'transparent'
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
  onSubmit,
  withSubmit,
  ...rest
}: BorderInputProps) => {
  const [innerValue, setValue] = useState(value || defaultValue || '')
  const showText = innerValue && innerValue !== ''
  const update = useUpdate()
  const inputRef = useRef<HTMLElement>(null)
  const { t } = useTranslation()
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
        border: '1px solid var(--border-background)',
        ':focus-within': {
          border: '1px solid var(--select-color)'
        }
      })}
      style={{ position: 'relative', borderRadius: 6, ...containerStyle }}
    >
      <AnimatePresence>
        {translatedPlaceholder && (
          <motion.legend
            ref={placeholderRef}
            initial={{ opacity: 0, x: 6, y: 16 }}
            animate={{ opacity: 1, x: 0, y: -6, zIndex: 1 }}
            exit={{ opacity: 0, x: 6, y: 16, position: 'absolute' }}
            className={css({
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
          id={id}
          placeholder={placeholder}
          minRows={2}
          spellCheck={spellCheck}
          {...rest}
          style={{ resize: 'none', ...style }}
          className={inputClassName}
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
            onChange?.(e.target.value)
            setValue(e.target.value)
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
      {withSubmit && (
        <div
          onClick={onSubmit}
          style={{ cursor: 'pointer', position: 'absolute', bottom: 3, right: 12 }}
          className={ClassName.description(FontSize['12px'])}
        >
          {t('footer.submit')}
        </div>
      )}
    </fieldset>
  )
}

export default BorderInput
