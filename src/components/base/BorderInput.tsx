import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { CSSProperties, useState } from 'react'
import AutosizeTextarea from '../custom/input/autosizeTextarea'

const BorderInput = ({
  value,
  onChange,
  placeholder,
  style,
  defaultValue,
  textarea,
  disable
}: {
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
  style?: CSSProperties
  defaultValue?: string
  textarea?: boolean
  disable?: boolean
}) => {
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
              fontSize: 12,
              color: 'rgba(31,34,37,0.9)',
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
          placeholder="Discription..."
          minRows={2}
          style={{ resize: 'none', overflow: 'hidden' }}
          className={ClassName.input()}
          defaultValue={defaultValue}
          disabled={disable}
          onChange={e => {
            onChange?.(e.target.value)
            setValue(e.target.value)
          }}
        />
      ) : (
        <input
          style={style}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={e => {
            onChange?.(e.target.value)
            setValue(e.target.value)
          }}
          disabled={disable}
          className={ClassName.input()}
        ></input>
      )}
    </div>
  )
}

export default BorderInput
