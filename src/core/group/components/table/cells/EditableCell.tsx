import { useRef, useState } from 'react'
import usePopoverCell from '@/core/group/hooks/usePopoverCell'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { Colors } from '@/consts'
import { Icon } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { PopupWrapper } from '@/core/group/components'
import { ClassName } from 'rendevoz'
import { Path } from 'slate'
import ToggleArrow from '@/core/group/components/basic/ToggleArrow'

const EditableCell = ({
  value,
  onChange,
  openMeta,
  showToggle,
  path,
  toggled,
  indent = 0
}: {
  value: string
  openMeta?: number
  onChange: (v: string) => void
  showToggle: boolean
  indent?: number
  path?: Path
  toggled?: boolean
}) => {
  const containerRef = useRef<HTMLTextAreaElement>(null)
  const [height, setHeight] = useState(0)
  const { openPopover, renderPopover } = usePopoverCell({
    onClose: () => {
      if (valueRef.current !== value) {
        onChange(valueRef.current || 'Unnamed Object')
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
        {showToggle && path && <ToggleArrow path={path} toggled={!!toggled} />}
        <div>{value}</div>
        {openMeta && isIn && (
          <Icon
            size={13}
            name="park-expand-text-input"
            onClick={e => {
              e.stopPropagation()
              Rendevoz.Actions.Open.Meta.openMetaObject(openMeta)
            }}
            containerStyle={{
              border: `1px solid ${Colors.Background.Border}`,
              borderRadius: 4,
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: 3,
              cursor: 'pointer',
              background: Colors.Background.Secondary
            }}
          ></Icon>
        )}
      </div>
      {renderPopover(box => (
        <PopupWrapper box={box} style={{ height }}>
          <AutosizeTextarea
            onHeightChange={h => setHeight(h)}
            autoFocus={true}
            minRows={1}
            maxRows={999}
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
