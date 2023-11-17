import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { useRef } from 'react'
import { PopupWrapper } from '@/core/components/group/components'
import ImageRenderer from '@/core/components/group/components/popupRenderer/ImageRenderer'
import { useIsIn } from '@/hooks'
import { Content, Icon } from '@/components'

export default ({ value, onChange }: { value: string; onChange: (filePath?: string) => void }) => {
  const ref = useRef(null)
  const { openPopover, renderPopover, closePopover } = usePopoverCell({
    onClose: () => {},
    onOpen: () => {},
    targetRef: ref
  })

  return (
    <>
      <Content
        flex
        justifyContent={'space-between'}
        ref={ref}
        onClick={e => {
          const parent = e.currentTarget.parentElement
          if (parent) {
            openPopover(parent)
          }
        }}
        style={{
          height: '100%',
          position: 'relative'
        }}
      >
        {value && (
          <img
            loading={'lazy'}
            style={{
              objectFit: 'cover',
              maxWidth: '100%',
              borderRadius: 4,
              position: 'absolute',
              top: 0,
              left: 0,
              maxHeight: '100%'
            }}
            src={value}
          />
        )}
      </Content>
      {renderPopover(box => (
        <PopupWrapper box={{ ...box, width: Math.max(300, box.width) }}>
          <ImageRenderer
            value={value}
            onDelete={() => {
              onChange(undefined)
              closePopover()
            }}
            onChange={v => onChange(v)}
          />
        </PopupWrapper>
      ))}
    </>
  )
}
