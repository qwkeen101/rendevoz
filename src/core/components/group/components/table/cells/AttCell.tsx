import { MetaStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { CSSProperties, useMemo, useRef } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { AttachmentWrapper } from '@/core'

const AttCell = ({ metaId, style }: { metaId: number; style?: CSSProperties }) => {
  const meta = MetaStore.useValue(metaId)
  const { openPopover, renderPopover, closePopover } = usePopoverCell()
  const atts = useMemo(() => {
    const map = MetaStore.getMetaObjectsMap()
    return meta?.attachments
      ?.map(i => {
        if (i.type === 'attachmentText') {
          return i.text
        }
        const one = map.get(i.id)
        return one?.name || one?.placeholderName
      })
      .filter(i => i) as string[] | undefined
  }, [meta?.attachments])
  return (
    <>
      <Content
        onClick={e => {
          const parent = e.currentTarget.parentElement
          if (parent) {
            openPopover(parent)
          }
        }}
        role={'prop-container'}
        style={{
          width: '100%',
          height: '100%',
          flexWrap: 'inherit'
        }}
        flex
        gap={4}
      >
        {atts?.map(i => (
          <span className={'object-name-item'} style={style} key={i}>
            {i}
          </span>
        ))}
      </Content>
      {renderPopover(
        box => (
          <PopupWrapper box={{ ...box, width: 'min(380px, 90vw)' }}>
            <div
              onContextMenu={e => {
                e.stopPropagation()
              }}
              style={{
                position: 'relative'
              }}
              className={'p-3'}
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
              <AttachmentWrapper metaId={metaId} visible={true} />
            </div>
          </PopupWrapper>
        ),
        false
      )}
    </>
  )
}

export default AttCell
