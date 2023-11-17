import { MetaStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { useRef } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import RelatedRenderer from '@/core/components/group/components/popupRenderer/RelatedRenderer'
import { RelatedPanel } from '@/core/object/details/Related'
import { ClassName } from 'rendevoz'

const RelatedCell = ({ metaId }: { metaId: number }) => {
  const index = MetaStore.useIndexedMetaLinks()
  const relatedMap = index?.relatedIdsMap
  const size = relatedMap?.get(metaId)?.size || 0
  const ref = useRef(null)
  const { openPopover, renderPopover, closePopover } = usePopoverCell({
    onClose: () => {},
    onOpen: () => {},
    targetRef: ref,
    closeWhenClickoutside: false
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
        ref={ref}
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
          <PopupWrapper box={{ ...box, width: 480 }}>
            <div
              style={{
                padding: 8,
                position: 'relative'
              }}
            >
              <Icon
                name={'park-close'}
                onClick={e => {
                  e.stopPropagation()
                  closePopover()
                }}
                containerStyle={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}
                className={ClassName.circleButton()}
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
