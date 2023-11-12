import { useRef } from 'react'
import usePopoverCell from '@/core/group/hooks/usePopoverCell'
import { Content } from '@/components'
import { PopupWrapper } from '@/core/group/components'
import ImageRenderer from '@/core/group/components/popupRenderer/ImageRenderer'

export default ({ value, onChange }: { value?: string; onChange: (filePath?: string) => void }) => {
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
          width: '100%',
          paddingBottom: '50%',
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
