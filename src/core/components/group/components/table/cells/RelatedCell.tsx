import { MetaStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { RelatedPanel } from '@/core/object/details/Related'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { CSSProperties } from 'react'

const RelatedCell = ({
  metaId,
  nullIfNoRelated,
  optionStyle
}: {
  metaId: number
  nullIfNoRelated?: boolean
  optionStyle?: CSSProperties
}) => {
  const index = MetaStore.useIndexedMetaLinks()
  const relatedMap = index?.relatedIdsMap
  const related = relatedMap?.get(metaId)
  const relatedMetas = MetaStore.useMultipleObjects(Array.from(related?.values() || []))
  const { openPopover, renderPopover, closePopover } = usePopoverCell({
    onClose: () => {
      closePopover()
    },
    onOpen: () => {}
  })
  if (nullIfNoRelated && (!related || related?.size === 0)) {
    return null
  }
  return (
    <>
      <Content
        role={'prop-container'}
        onClick={e => {
          const parent = e.currentTarget.parentElement
          if (parent) {
            openPopover(parent)
          }
        }}
        flex
        gap={4}
        style={{
          width: '100%',
          height: '100%',
          flexWrap: 'inherit'
        }}
      >
        {relatedMetas.map(meta => (
          <span
            className={'object-name-item'}
            style={optionStyle}
          >
            {meta.name || meta.placeholderName}
          </span>
        ))}
      </Content>
      {renderPopover(
        box => (
          <PopupWrapper box={{ ...box, width: 'min(340px, 90vw)' }}>
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
