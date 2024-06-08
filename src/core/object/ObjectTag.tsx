import { ObjectStore } from '@/api/stores'
import ClassName from '@/styles/classNames'
import { CSSProperties, MouseEventHandler, useEffect } from 'react'
import { Content, Icon } from '@/components'
import Colors from '@/consts/colors'
import { Rendevoz } from '@/core/rendevoz'

const Tag = ({
  tag,
  hideDelete,
  onDelete,
  small,
  onClick,
  cursor,
  style,
  square,
  clickOpenGroup = false
}: {
  tag: number
  hideDelete?: boolean
  onDelete?: VoidFunction
  small?: boolean
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
    <Content
      flex
      alignItems="center"
      gap={6}
      onClick={e => {
        onClick?.(e)
        if (clickOpenGroup) {
          Rendevoz.Actions.Open.Group.openTagGroup(tag)
        }
      }}
      style={{
        background: Colors.getAdaptColor(tagObject.color) || Colors.Background.ButtonHover,
        borderRadius: square ? 3 : 999,
        lineHeight: square ? '20px' : undefined,
        height: 'fit-content',
        padding: square ? '0px 6px' : small ? '0px 8px 0px' : '3px 6px 3px 10px',
        width: 'fit-content',
        color: Colors.getAdaptFontColor(tagObject.color),
        justifyContent: 'space-between',
        fontSize: 14,
        cursor: clickOpenGroup ? 'pointer' : cursor,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      <span className={ClassName.ellipsisFont(1)}>{tagObject.name || 'Unnamed tag'}</span>
      {!small && !hideDelete && (
        <Content flex gap={6}>
          {!small && !hideDelete && (
            <Icon
              size={12}
              onClick={e => {
                e.stopPropagation()
                onDelete?.()
              }}
              className={'transparent-font'}
              style={{
                cursor: 'pointer'
              }}
              name="park-close"
            />
          )}
        </Content>
      )}
    </Content>
  )
}

export default Tag
