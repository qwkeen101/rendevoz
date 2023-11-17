import { CSSProperties, useRef, useState } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { Colors } from '@/consts'
import { Button } from '@/components'
import { PopupWrapper } from '@/core/components/group/components'
import { ClassName } from 'rendevoz'
import ToggleArrow from '@/core/components/group/components/basic/ToggleArrow'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { css } from '@emotion/css'

const EditableCell = ({
  value,
  onChange,
  openMeta,
  showToggle = false,
  rowId,
  toggled,
  style,
  indent = 0
}: {
  value: string
  openMeta?: number
  onChange: (v: string) => void
  showToggle?: boolean
  indent?: number
  rowId?: number
  toggled?: boolean
  style?: CSSProperties
  placeholder?: string
}) => {
  const containerRef = useRef<HTMLTextAreaElement>(null)
  const [height, setHeight] = useState(0)
  const { openPopover, renderPopover } = usePopoverCell({
    onClose: () => {
      if (valueRef.current !== value) {
        onChange(valueRef.current)
      }
      valueRef.current = ''
    },
    onOpen: () => {
      valueRef.current = value
    },
    targetRef: containerRef
  })
  const [isIn, setIsIn] = useState(false)
  const valueRef = useRef('')
  const instance = useGroupInstance()
  return (
    <>
      <div
        onPointerEnter={() => setIsIn(true)}
        onPointerLeave={() => setIsIn(false)}
        style={{ width: '100%', height: '100%', display: 'flex', gap: 4, paddingLeft: indent * 30 }}
        onClick={e => {
          const parent = e.currentTarget.parentElement
          if (!parent) return
          openPopover(parent)
        }}
      >
        {showToggle && rowId && <ToggleArrow rowId={rowId} toggled={!!toggled} />}
        <div style={style}>{value}</div>
        {isIn && (
          <div
            style={{
              position: 'absolute',
              right: 4,
              display: 'flex',
              gap: 4
            }}
          >
            {openMeta && (
              <Button.IconButton
                gap={6}
                icon={'park-expand-text-input'}
                text={'Open'}
                onClick={e => {
                  e.stopPropagation()
                  instance.openObject?.(openMeta)
                }}
                className={css({
                  background: Colors.Background.Global,
                  ':hover': {
                    background: Colors.Background.Secondary
                  },
                  ':active': {
                    background: Colors.Background.Secondary
                  }
                })}
                style={{
                  border: `1px solid ${Colors.Background.Border}`,
                  boxShadow: Colors.Background.BoxShadow,
                  borderRadius: 4,
                  fontSize: 13,
                  height: 24,
                  padding: '0px 6px'
                }}
              ></Button.IconButton>
            )}
            {!openMeta && value && (
              <Button.IconButton
                gap={6}
                icon={'park-copy'}
                text={'Copy'}
                onClick={e => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(value)
                }}
                className={css({
                  background: Colors.Background.Global,
                  ':hover': {
                    background: Colors.Background.Secondary
                  },
                  ':active': {
                    background: Colors.Background.Secondary
                  }
                })}
                style={{
                  border: `1px solid ${Colors.Background.Border}`,
                  boxShadow: Colors.Background.BoxShadow,
                  borderRadius: 4,
                  fontSize: 13,
                  height: 24,
                  padding: '0px 6px'
                }}
              ></Button.IconButton>
            )}
          </div>
        )}
      </div>
      {renderPopover(box => (
        <PopupWrapper box={box} style={{ height }}>
          <AutosizeTextarea
            onHeightChange={h => setHeight(h)}
            autoFocus={true}
            minRows={1}
            maxRows={20}
            className={ClassName.noStyleInput}
            ref={containerRef}
            spellCheck="false"
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

export default EditableCell
