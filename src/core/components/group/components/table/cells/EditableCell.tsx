import { CSSProperties, useRef, useState } from 'react'
import { Colors } from '@/consts'
import { Button } from '@/components'
import ToggleArrow from '@/core/components/group/components/basic/ToggleArrow'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { css } from '@emotion/css'
import TextProp from '@/core/object/renderer/properties/TextProp'
import { useTranslation } from 'react-i18next'

const EditableCell = ({
  value,
  onChange,
  openMeta,
  showToggle = false,
  rowId,
  toggled,
  style,
  placeholder,
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
  const [isIn, setIsIn] = useState(false)
  const instance = useGroupInstance()
  const ref = useRef<HTMLElement>()
  const { t } = useTranslation()
  return (
    <>
      <div
        ref={ref}
        onPointerEnter={e => {
          if (e.target instanceof Element && e.currentTarget.contains(e.target)) {
            setIsIn(true)
          }
        }}
        onPointerLeave={() => setIsIn(false)}
        onClick={() => {
          setIsIn(false)
        }}
        style={{ width: '100%', height: '100%', display: 'flex', gap: 4, paddingLeft: indent * 30 }}
      >
        {showToggle && rowId && <ToggleArrow rowId={rowId} toggled={!!toggled} />}
        <TextProp popoverElement={ref.current?.parentElement} placeholder={placeholder} style={style} value={value} onChange={onChange} />
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
                text={t('general.Open')}
                onClick={e => {
                  e.stopPropagation()
                  if (rowId) {
                    instance.openObject?.(openMeta, rowId)
                  }
                }}
                className={css({
                  background: Colors.Background.Popover,
                  ':hover': {
                    background: Colors.Background.Secondary
                  },
                  ':active': {
                    background: Colors.Background.Secondary
                  }
                })}
                style={{
                  border: `1px solid ${Colors.Background.Border}`,
                  borderRadius: 4,
                  fontSize: 14,
                  lineHeight: '20px',
                  padding: '0px 4px'
                }}
              ></Button.IconButton>
            )}
            {!openMeta && value && (
              <Button.IconButton
                gap={6}
                icon={'park-copy'}
                text={t('general.Copy')}
                onClick={e => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(value)
                }}
                className={css({
                  background: Colors.Background.Popover,
                  ':hover': {
                    background: Colors.Background.Secondary
                  },
                  ':active': {
                    background: Colors.Background.Secondary
                  }
                })}
                style={{
                  border: `1px solid ${Colors.Background.Border}`,
                  borderRadius: 4,
                  fontSize: 14,
                  lineHeight: '20px',
                  padding: '0px 4px'
                }}
              ></Button.IconButton>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default EditableCell
