import { MetaStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { useRef } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { RelatedPanel } from '@/core/object/details/Related'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'

const RelatedCell = ({ metaId }: { metaId: number }) => {
  const index = MetaStore.useIndexedMetaLinks()
  const relatedMap = index?.relatedIdsMap
  const size = relatedMap?.get(metaId)?.size || 0
  const ref = useRef(null)
  const { openPopover, renderPopover, closePopover } = usePopoverCell({
    onClose: () => {
      closePopover()
    },
    onOpen: () => {},
    targetRef: ref
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
      {renderPopover(box => (
        <PopupWrapper box={{ ...box, width: 480 }}>
          <div
            style={{
              padding: 8,
              position: 'relative',
              boxShadow: Colors.Background.BoxShadow,
              background: Colors.Background.Secondary
            }}
            ref={ref}
          >
            <RelatedPanel metaId={metaId} />
          </div>
        </PopupWrapper>
      ))}
    </>
  )
}

export default RelatedCell
