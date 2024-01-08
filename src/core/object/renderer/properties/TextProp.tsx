import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { CSSProperties, useRef, useState } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { ClassName } from 'rendevoz'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'

export default ({
  value,
  onChange,
  mode = 'text',
  style,
  popoverElement,
  placeholder
}: {
  value: string
  onChange?: (v: string) => void
  mode?: 'text' | 'number'
  style?: CSSProperties
  popoverElement?: HTMLElement | null
  placeholder?: string
}) => {
  const [height, setHeight] = useState(0)
  const { openPopover, renderPopover, closePopover } = usePopoverCell({
    onClose: () => {
      if (valueRef.current !== value) {
        if (mode === 'number') {
          if (/^\d+$/.test(valueRef.current) || valueRef.current === '') {
            onChange?.(valueRef.current)
          }
          return
        }
        onChange?.(valueRef.current)
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
          if (!parent && !popoverElement) return
          openPopover(popoverElement || parent)
        }}
      >
        {value || placeholder}
      </div>
      {renderPopover(box => (
        <PopupWrapper box={box} style={{ height }}>
          <AutosizeTextarea
            onHeightChange={h => setHeight(h)}
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
              width: '100%'
            }}
            defaultValue={value}
          />
        </PopupWrapper>
      ))}
    </>
  )
}
