import { MetaStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { RelatedPanel } from '@/core/object/details/Related'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'

const RelatedCell = ({ metaId }: { metaId: number }) => {
  const index = MetaStore.useIndexedMetaLinks()
  const relatedMap = index?.relatedIdsMap
  const size = relatedMap?.get(metaId)?.size || 0
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
          fontWeight: 600,
          width: '100%',
          height: '100%'
        }}
      >
        {size}
      </Content>
      {renderPopover(
        box => (
          <PopupWrapper box={{ ...box, width: 'min(480px, 90vw)' }}>
            <div
              style={{
                padding: 8,
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
              <RelatedPanel metaId={metaId} />
            </div>
          </PopupWrapper>
        ),
        false
      )}
    </>
  )
}

export default RelatedCell
