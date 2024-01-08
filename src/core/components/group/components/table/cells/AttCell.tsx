import { MetaStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { useRef } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { RelatedPanel } from '@/core/object/details/Related'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { AttachmentWrapper } from '@/core'

const AttCell = ({ metaId }: { metaId: number }) => {
  const meta = MetaStore.useValue(metaId)
  const { openPopover, renderPopover, closePopover } = usePopoverCell({
    onClose: () => {
      closePopover()
    },
    onOpen: () => {}
  })
  return (
    <>
      <Content
        onClick={e => {
          const parent = e.currentTarget.parentElement
          if (parent) {
            openPopover(parent)
          }
        }}
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        {meta?.attachments?.length || ''}
      </Content>
      {renderPopover(
        box => (
          <PopupWrapper box={{ ...box, width: 'min(380px, 90vw)' }}>
            <div
              style={{
                position: 'relative'
              }}
            >
              <Icon
                size={13}
                className={ClassName.circleButton()}
                name={'park-close'}
                onClick={() => closePopover()}
                style={{
                  position: 'absolute',
                  zIndex: 99,
                  border: Colors.Consts.Border,
                  background: Colors.Background.Popover,
                  top: -10,
                  right: -10
                }}
              />
              <AttachmentWrapper showField={false} style={{ boxShadow: 'none' }} metaId={metaId} visible={true} />
            </div>
          </PopupWrapper>
        ),
        false
      )}
    </>
  )
}

export default AttCell
