import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { CSSProperties, useRef, useState } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { ClassName } from 'rendevoz'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'

const extractNum = (s: string) => {
  if (!s) return 0
  let isNegetive = false
  if (s.indexOf('-') == 0) isNegetive = true

  s = s.replace(/[^\d.]*/g, '')

  let n = isNaN(parseFloat(s)) ? 0 : parseFloat(s)

  if (isNegetive) n = 0 - n
  return n
}
export default ({
  value,
  onChange,
  mode = 'text',
  style,
  popoverElement,
  placeholder
}: {
  value: string
  style?: CSSProperties
  popoverElement?: HTMLElement | null
  placeholder?: string
} & ({ onChange?: (v: string) => void; mode?: 'text' } | { onChange?: (v: number) => void; mode?: 'number' })) => {
  const { openPopover, renderPopover, closePopover } = usePopoverCell({
    onClose: () => {
      if (valueRef.current !== value) {
        if (mode === 'number') {
          const extracted = extractNum(valueRef.current ?? '')
          if (Number.isNaN(extracted)) return
          onChange?.(extracted === 0 ? '' : extracted)
          return
        } else {
          onChange?.(valueRef.current)
        }
      }
      valueRef.current = ''
    },
    onOpen: () => {
      valueRef.current = value
    }
  })
  const valueRef = useRef('')
  return (
    <>
      <div
        role={'prop-container'}
        style={{ width: '100%', height: '100%', color: placeholder && !value ? Colors.Font.Transparent : style?.color, ...style }}
        onClick={e => {
          const parent = e.currentTarget.parentElement
          console.log(parent)
          if (!parent && !popoverElement) return
          openPopover(popoverElement || parent)
        }}
      >
        {value || placeholder}
      </div>
      {renderPopover(box => (
        <PopupWrapper box={box}>
          <AutosizeTextarea
            autoFocus={true}
            minRows={1}
            maxRows={20}
            className={ClassName.noStyleInput}
            spellCheck="false"
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.preventDefault()
                closePopover()
              }
            }}
            onChange={e => (valueRef.current = e.target.value)}
            style={{
              padding: '6px 6px',
              resize: 'none',
              width: '100%',
              fontSize: 14,
              display: 'block'
            }}
            defaultValue={value}
          />
        </PopupWrapper>
      ))}
    </>
  )
}
