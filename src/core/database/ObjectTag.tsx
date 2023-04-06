import { useToggle } from '@/hooks'
import { tagToMetaObjectIdsMapAtom } from '@/stores/meta.store'
import { ObjectStore, globalStore } from '@/stores'
import { TagToTagAtom } from '@/stores/tag.store'
import ClassName from '@/styles/classNames'
import { useAtomValue } from 'jotai/react'
import { CSSProperties, MouseEventHandler, useEffect } from 'react'
import { Content, Icon, IconWithPopover } from '../../components/base'
import BlockColorPicker from '../editor/components/BlockColorPicker'

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
  style
}: {
  tag: string
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
  onDBRemove?: VoidFunction
  showPickColor?: boolean
  style?: CSSProperties
}) => {
  const tagMap = useAtomValue(tagToMetaObjectIdsMapAtom, { store: globalStore })

  const tagToObjectsSet = tagMap?.get(tag)
  const tagObject = ObjectStore('tag').useValue(globalStore.get(TagToTagAtom)?.get(tag)?.id)

  const size = tagToObjectsSet?.size
  const [pointerInTag, togglePointerInTag] = useToggle(false)

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
        // background: tagObject?.color || 'rgb(220,227,232)',
        // color: tagObject?.color ? 'white' : 'rgb(82,102,116)',
        background: tagObject?.color || 'rgba(0,0,0,0.07)',
        color: tagObject?.color ? 'white' : '#61666D',
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
        <span>{tag}</span>
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
        {showPickColor && (
          <IconWithPopover
            name="park-platte"
            size={12}
            className={ClassName.circleButton(3)}
            content={
              <BlockColorPicker
                showFont={false}
                showMoreBgOption={false}
                onPickBackgroundColor={c => tagObject?.id && ObjectStore('tag').updateOne({ id: tagObject?.id, color: c })}
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
