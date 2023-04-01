import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import { Zindexes } from '@/consts'
import { GlobalEventEmitter } from '@/events'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useRef } from 'react'
import { ObjectActionPopover } from './card/DatabaseCard'
import useCardDrag from './card/useCardDrag'
import useRenderObject from './useRenderObject'

const DatabaseListItem = ({ id, mode }: { id: number; mode: 'all' | 'title' }) => {
  const { renderWhole, metaObject } = useRenderObject({
    metaObjectId: id
  })
  const [popoverVisible, togglePopoverVisible] = useToggle(false)
  const renderOptions: Parameters<typeof renderWhole>[0]['renderOptions'] =
    mode === 'all'
      ? {
          renderFrom: true
        }
      : mode === 'title'
      ? {
          renderFrom: false,
          renderImage: false,
          renderDescription: false
        }
      : undefined
  const dragRef = useRef()
  const contentRef = useRef()
  const { isCardDraggingInside } = useCardDrag(metaObject, dragRef, contentRef)
  return (
    <Content flex>
      <AnimatePopover
        visible={popoverVisible}
        padding={10}
        containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
        onClickOutside={togglePopoverVisible}
        content={
          <WithBorder>
            <ObjectActionPopover
              onEdit={() => {
                GlobalEventEmitter().emit('global', {
                  type: 'globalNeedEditMetaObject',
                  data: {
                    metaObjectId: id
                  }
                })
              }}
              onClose={togglePopoverVisible}
              metaObjectId={id}
            />
          </WithBorder>
        }
        align="start"
        positions={['left', 'right']}
      >
        <Icon size={18} fill="rgba(31,34,39,0.2)" onClick={togglePopoverVisible} name="park-more" className={ClassName.circleButton()} />
      </AnimatePopover>
      {renderWhole({
        renderOptions,
        descriptionOptions: {
          descriptionClassName: css([ClassName.description(), ClassName.ellipsisFont(1)])
        },
        tagsOptions: {
          showCreatedAt: true,
          showViewAt: true
        },
        imageOptions: {
          width: 64
        },
        rowGap: 20
      })}
    </Content>
  )
}

export default DatabaseListItem
