import { CSSProperties } from 'react'
import { useRenderLabel } from '@/core'
import { AnimatePopover, Icon, WithBorder } from '@/components'
import { Colors } from '@/consts'

const LabelNoteRenderer = ({
  labelId,
  style = {
    top: -22,
    right: -4,
    position: 'absolute'
  }
}: {
  labelId: number
  style?: CSSProperties
}) => {
  const { label, renderName, renderDescription } = useRenderLabel({ objectId: labelId, type: 'pdfLabel' })

  return (
    <AnimatePopover
      positions={['top', 'right']}
      content={
        <WithBorder style={{ maxWidth: 240 }} onClick={e => e.stopPropagation()} padding={'8px 8px 4px 8px'}>
          {renderName({})}
          {renderDescription({})}
        </WithBorder>
      }
    >
      <Icon
        name={'park-info'}
        containerStyle={{ ...style, cursor: 'pointer', pointerEvents: 'auto', zIndex: 10, color: Colors.Common.SelectColor }}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
        }}
      />
    </AnimatePopover>
  )
}

export default LabelNoteRenderer
