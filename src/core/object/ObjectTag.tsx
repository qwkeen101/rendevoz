import { ObjectStore } from '@/api/stores'
import { CSSProperties, MouseEventHandler, useEffect } from 'react'
import { Content, Icon } from '@/components'
import Colors from '@/consts/colors'
import classnames from 'classnames'

const Tag = ({
  tag,
  hideDelete,
  onDelete,
  small,
  onClick,
  cursor,
  style,
  square,
  className,
  clickOpenGroup = false
}: {
  tag: number
  hideDelete?: boolean
  onDelete?: VoidFunction
  small?: boolean
  className?: string
  square?: boolean
  cursor?: string
  clickOpenGroup?: boolean
  onClick?: MouseEventHandler
  parentElement?: HTMLElement
  style?: CSSProperties
}) => {
  const tagObject = ObjectStore('tag').useValue(tag)
  useEffect(() => {
    if (tagObject?.deleted) {
      onDelete?.()
    }
  }, [tagObject?.deleted])
  if (tagObject?.deleted || !tagObject) return null
  return (
    <div
      onClick={e => {
        onClick?.(e)
        if (clickOpenGroup) {
          e.preventDefault()
          Global.layoutOps?.openPage('tagGroup', { id: tag })
        }
      }}
      className={classnames(
        'flex w-fit h-fit items-center whitespace-nowrap justify-between gap-1.5',
        className,
        square ? 'em:rounded' : 'rounded-full'
      )}
      style={{
        background: Colors.getAdaptColor(tagObject.color) || Colors.Background.ButtonHover,
        lineHeight: square ? 1.4 : undefined,
        padding: square ? '0px 6px' : small ? '0px 8px 0px' : '3px 6px 3px 10px',
        color: Colors.getAdaptFontColor(tagObject.color),
        cursor: clickOpenGroup ? 'pointer' : cursor,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      <span className={'line-clamp-1'}>{tagObject.name || 'Unnamed tag'}</span>
      {!small && !hideDelete && (
        <Content flex gap={6}>
          {!small && !hideDelete && (
            <Icon
              size={12}
              onClick={e => {
                e.stopPropagation()
                onDelete?.()
              }}
              className={'transparent-font cursor-pointer'}
              name="park-close"
            />
          )}
        </Content>
      )}
    </div>
  )
}

export default Tag
