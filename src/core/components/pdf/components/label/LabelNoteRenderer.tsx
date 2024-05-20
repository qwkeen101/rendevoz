import { CSSProperties, useRef, useState } from 'react'
import { SettingAtoms, useRenderLabel } from '@/core'
import { AnimatePopover, Icon, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { useGlobalAtomValue } from '@/hooks'
import UseClickOutside from '@/hooks/utils/useClickOutside'

const LabelNoteRenderer = ({
  labelId,
  style = {
    top: -8,
    left: -4,
    padding: 4,
    boxShadow: 'var(--border-box-shadow)',
    borderRadius: 4,
    fontSize: 13,
    maxWidth: 360,
    width: 'max-content',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
    zIndex: 100,
    gap: 3,
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateY(-100%)',
    position: 'absolute',
    pointerEvents: 'auto',
    cursor: 'auto',
    lineHeight: 1.4
  }
}: {
  labelId: number
  style?: CSSProperties
}) => {
  const show = useGlobalAtomValue(SettingAtoms.pdfShowHighlightText)
  const defaultExpanded = useGlobalAtomValue(SettingAtoms.pdfDefaultExpandHighlightDetails)
  const [expanded, setExpanded] = useState(!!defaultExpanded)
  const r = useRef<HTMLDivElement>()
  UseClickOutside(
    () => {
      if (expanded && defaultExpanded !== true) {
        setExpanded(false)
      }
    },
    r,
    expanded
  )
  const { label, renderTags, labelMeta } = useRenderLabel({ objectId: labelId, type: 'pdfLabel' })
  if (!show) return null
  if (!label?.name && !labelMeta?.tags?.length) return null
  if (expanded) {
    return (
      <WithBorder
        ref={r}
        className={'cancel'}
        onClickCapture={e => {
          e.stopPropagation()
        }}
        onPointerDownCapture={e => e.stopPropagation()}
        style={style}
      >
        {label?.name}
        {renderTags(undefined, true)}
      </WithBorder>
    )
  } else {
    return (
      <Icon
        onClickCapture={e => {
          setExpanded(true)
          e.stopPropagation()
        }}
        onPointerDownCapture={e => e.stopPropagation()}
        name={'park-message'}
        style={{
          position: 'absolute',
          top: -16,
          left: -16,
          cursor: 'pointer',
          color: 'var(--emphasis)',
          transform: 'rotateY(180deg)',
          pointerEvents: 'auto'
        }}
        size={16}
        theme={'filled'}
        className={'cancel'}
      />
    )
  }
}

export default LabelNoteRenderer
