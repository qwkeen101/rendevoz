import { CSSProperties } from 'react'
import { useRenderLabel } from '@/core'
import { AnimatePopover, Icon, WithBorder } from '@/components'
import { Colors } from '@/consts'

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
  const { label, renderTags, labelMeta } = useRenderLabel({ objectId: labelId, type: 'pdfLabel' })
  if (!label?.name && !labelMeta?.tags?.length) return null
  return (
    <WithBorder
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
}

export default LabelNoteRenderer
