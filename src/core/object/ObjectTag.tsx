import { useToggle, useSelectGlobalAtomValue } from '@/hooks'
import { tagToMetaObjectIdsMapAtom } from '@/api/stores/meta.store'
import { globalStore, ObjectStore } from '@/api/stores'
import ClassName from '@/styles/classNames'
import { useAtomValue } from 'jotai/react'
import { CSSProperties, MouseEventHandler, useEffect, useMemo } from 'react'
import { Content, Icon, IconWithPopover } from '../../components/base'
import BlockColorPicker from '../editor/components/BlockColorPicker'
import Colors from '@/consts/colors'
import { defaultBgColor } from '@/components/picker/colorPicker'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import FontSize from '@/consts/font'
import { SettingAtom } from '@/core'
import tinycolor from 'tinycolor2'

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
  style,
  square
}: {
  tag: number
  hideSize?: boolean
  hideDelete?: boolean
  hideAdd?: boolean
  onDelete?: VoidFunction
  small?: boolean
  square?: boolean
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

  const darkMode = useSelectGlobalAtomValue(SettingAtom, s => s.general.darkMode)

  const realBg = useMemo(() => {
    if (darkMode) {
      const c = tinycolor(tagObject?.color || 'rgba(221, 212, 224, 0.08)')
      c.darken(40).desaturate(40)
      return c.toRgbString()
    } else {
      return tagObject?.color
    }
  }, [darkMode, tagObject])
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
        background: realBg || Colors.Background.ButtonHover,
        borderRadius: square ? 3 : 999,
        lineHeight: square ? '20px' : undefined,
        height: 'fit-content',
        padding: square ? '0px 6px' : small ? '0px 8px 0px' : '3px 6px 3px 10px',
        fontFamily: 'Muli',
        width: 'fit-content',
        justifyContent: 'space-between',
        fontSize: small || square ? FontSize['12px'] : FontSize['14px'],
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
                ObjectStore('tag').updateOne({
                  id: tag,
                  name: e.currentTarget.value
                })
                toggleIsEditing(false)
              }
            }}
          />
        ) : (
          <span className={ClassName.ellipsisFont(1)} style={{ textTransform: 'none' }}>
            {tagObject.name || 'Unnamed tag'}
          </span>
        )}
        {!hideSize && (
          <Content style={{ margin: 'auto' }}>
            {pointerInTag && !hideAdd ? (
              <Icon
                size={12}
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
      {(showEdit || showDBRemove || showPickColor || (!small && !hideDelete)) && (
        <Content flex gap={6}>
          {!small && !hideDelete && (
            <Icon
              size={12}
              onClick={e => {
                e.stopPropagation()
                onDelete?.()
              }}
              style={{
                cursor: 'pointer',
                color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgb(64,44,27)',
                opacity: darkMode ? undefined : 0.3
              }}
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
                    tagObject?.id &&
                    ObjectStore('tag').updateOne({
                      id: tagObject?.id,
                      color: c === defaultBgColor ? undefined : c
                    })
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
      )}
    </Content>
  )
}

export default Tag
