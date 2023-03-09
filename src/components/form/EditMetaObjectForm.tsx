import { useToggle } from '@/hooks'
import { tagToMetaObjectIdsMapAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores'
import { TagToTagAtom } from '@/stores/tag.store'
import ClassName from '@/styles/classNames'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { MouseEventHandler, useMemo } from 'react'
import { Content, Icon } from '../base'

export const Tag = ({
  tag,
  hideSize,
  hideDelete,
  onDelete,
  hideAdd,
  onAdd,
  small,
  onClick,
  cursor
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
}) => {
  const TagToMetaObjectMap = useMemo(() => atom(get => get(tagToMetaObjectIdsMapAtom)), [])
  const tagMap = useAtomValue(TagToMetaObjectMap, { store: globalStore })
  const tagToObjectsSet = tagMap.get(tag)
  const tagObject = useAtomValue(TagToTagAtom, { store: globalStore }).get(tag)

  const size = tagToObjectsSet?.size
  const [pointerInTag, togglePointerInTag] = useToggle(false)
  return (
    <Content
      flex
      alignItems="center"
      gap={6}
      onClick={onClick}
      onPointerEnter={() => togglePointerInTag(true)}
      onPointerLeave={() => togglePointerInTag(false)}
      style={{
        background: tagObject?.color || 'rgb(220,227,232)',
        color: tagObject?.color ? 'white' : 'rgb(82,102,116)',
        borderRadius: small ? '4px' : '999px',
        padding: small ? '0px 6px 0px 6px' : '3px 6px 3px 10px',
        fontFamily: 'Muli',
        width: 'fit-content',
        fontSize: small ? 12 : 14,
        cursor,
        whiteSpace: 'nowrap'
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
    </Content>
  )
}
