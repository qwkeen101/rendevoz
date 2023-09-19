// id array
import { Content } from '@/components'
import usePopoverCell from '@/core/group/hooks/usePopoverCell'
import { useRef } from 'react'
import { MetaStore, ObjectStore } from '@/stores'
import { MetaObject } from '~/typings'

const InnerLabelsCell = ({ type, objectId }: { type: MetaObject['type']; objectId: number }) => {
  const targetObject = ObjectStore(type).useValue(objectId)
  const length = value.length
  const ref = useRef<HTMLElement>(null)
  const { openPopover, renderPopover } = usePopoverCell({
    targetRef: ref
  })
  const renderPopove = () => {
    return <Content flex column style={{ maxHeight: 400, overflowY: 'auto' }}></Content>
  }
  return (
    <>
      <Content
        fullWidth
        fullHeight
        onClick={event => {
          const parentBounding = event.currentTarget.parentElement
          if (parentBounding) {
            openPopover(parentBounding, box => renderPopove())
          }
        }}
        ref={ref}
      ></Content>
      {renderPopover()}
    </>
  )
}

const ItemRenderer = ({ id }: { id: number }) => {}
export default InnerLabelsCell
