import { useToggle } from '@/hooks'
import { tagToMetaObjectIdsMapAtom } from '@/stores/meta.store'
import { ObjectStore, globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { useAtomValue } from 'jotai/react'
import { CSSProperties, MouseEventHandler, useEffect } from 'react'
import { Content, Icon, IconWithPopover } from '../../components/base'
import BlockColorPicker from '../editor/components/BlockColorPicker'
import Colors from '@/consts/colors'
import { defaultBgColor } from '@/components/picker/colorPicker'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

const Tag = ({
  tag,
  hideSize,
  hideDelete,
  onDelete,
  hideAdd,
  onAdd,
  small,
  onClick,
  cursor,
  onDBRemove,
  showPickColor,
  showDBRemove,
  showEdit,
  style
}: {
  tag: number
  hideSize?: boolean
  hideDelete?: boolean
  hideAdd?: boolean
  onDelete?: VoidFunction
  small?: boolean
  cursor?: string
  onClick?: MouseEventHandler
  onAdd?: VoidFunction
  parentElement?: HTMLElement
  showDBRemove?: boolean
  showEdit?: boolean
  onDBRemove?: VoidFunction
  showPickColor?: boolean
  style?: CSSProperties
}) => {
  const tagMap = !hideSize ? useAtomValue(tagToMetaObjectIdsMapAtom, { store: globalStore }) : undefined

  const tagToObjectsSet = tagMap?.get(tag)
  const tagObject = ObjectStore('tag').useValue(tag)

  const size = tagToObjectsSet?.size
  const [pointerInTag, togglePointerInTag] = useToggle(false)

  const [isEditing, toggleIsEditing] = useToggle(false)

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
      onClick={onClick}
      onPointerEnter={() => togglePointerInTag(true)}
      onPointerLeave={() => togglePointerInTag(false)}
      style={{
        background: tagObject?.color || Colors.Background.ButtonHover,
        color: tagObject?.color ? 'white' : Colors.Font.Secondary,
        borderRadius: small ? '4px' : '999px',
        padding: small ? '0px 8px 0px' : '3px 6px 3px 10px',
        fontFamily: 'Muli',
        width: 'fit-content',
        justifyContent: 'space-between',
        fontSize: small ? 12 : 14,
        cursor,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      <Content flex gap={4}>
        {isEditing ? (
          <input
            autoFocus
            defaultValue={tagObject.name}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent'
            }}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                ObjectStore('tag').updateOne({ id: tag, name: e.currentTarget.value })
                toggleIsEditing(false)
              }
            }}
          />
        ) : (
          <span style={{ textTransform: 'none' }}>{tagObject.name}</span>
        )}
        {!hideSize && (
          <Content flex style={{ width: 16, textAlign: 'center' }}>
            {pointerInTag && !hideAdd ? (
              <Icon
                name="park-plus"
                onClick={e => {
                  e.stopPropagation()
                  onAdd?.()
                }}
                className={ClassName.circleButton(2)}
              />
            ) : (
              <span>{size}</span>
            )}
          </Content>
        )}
      </Content>
      <Content flex gap={6}>
        {!small && !hideDelete && (
          <Icon
            size={12}
            onClick={e => {
              e.stopPropagation()
              onDelete?.()
            }}
            className={ClassName.circleButton(3)}
            name="park-close"
          />
        )}
        {showEdit && <Icon name="park-edit" className={ClassName.circleButton(3)} onClick={toggleIsEditing} size={12} />}
        {showPickColor && (
          <IconWithPopover
            closeOnContentClick
            name="park-platte"
            size={12}
            className={ClassName.circleButton(3)}
            content={
              <BlockColorPicker
                showFont={false}
                showMoreBgOption={false}
                onPickBackgroundColor={c =>
                  tagObject?.id && ObjectStore('tag').updateOne({ id: tagObject?.id, color: c === defaultBgColor ? undefined : c })
                }
              />
            }
          />
        )}
        {showDBRemove && (
          <Icon
            size={12}
            onClick={e => {
              e.stopPropagation()
              onDBRemove?.()
            }}
            className={ClassName.circleButton(3)}
            name="park-delete"
          />
        )}
      </Content>
    </Content>
  )
}

export default Tag
