import { FC, MouseEvent, PointerEventHandler, RefObject, useState } from 'react'
import { IMenuLayoutItem, NavigationMenu } from '@/components/base/menu/index'
import { AnimatePopover, Button, WithBorder } from '@/components'
import { Colors } from '@/consts'

type MenuItemWithProps = IMenuLayoutItem & {
  selectedKey: string[]
  onSelect?: () => void
  onPointerMove: (keyToMe: string[]) => void
  onClick: (item: IMenuLayoutItem) => void
  innerKey?: string
  parentKey: string[]
  parentRef: RefObject<HTMLElement>
}
const MenuItem: FC<MenuItemWithProps> = ({ type, ...rest }) => {
  switch (type) {
    case 'custom':
      return <CustomMenuItem type={type} {...rest} />
    case 'item':
      return <ButtonMenuItem type={type} {...rest} />
    case 'separator':
      return <SeparatorMenuItem type={type} {...rest} />
    case 'title':
      return (
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            paddingLeft: 8,
            lineHeight: 1.2,
            userSelect: 'none',
            margin: '5px 0px 4px',
            color: Colors.Font.Transparent,
            ...rest.style
          }}
        >
          {rest.name}
        </div>
      )
  }
}

const CustomMenuItem: FC<MenuItemWithProps & { type: 'custom' }> = ({
  children,
  selectedKey,
  key,
  innerKey,
  parentKey,
  onClick,
  onSelect,
  onPointerMove,
  ...rest
}) => {
  if (typeof children === 'function') {
    const handlePointerMove = () => {
      if (!innerKey) return
      const myKeys = [...parentKey, innerKey]
      if (selectedKey.includes(innerKey)) {
        if (selectedKey.length > myKeys.length) {
          return
        }
      }
      onPointerMove(myKeys)
    }
    return children({
      isSelected: innerKey ? selectedKey.includes(innerKey) : false,
      onPointerMove: handlePointerMove,
      onClick: () =>
        onClick?.({
          ...rest,
          key,
          onSelect,
          children
        })
    })
  }
  return children
}

const ButtonMenuItem: FC<MenuItemWithProps & { type: 'item' }> = ({
  subMenu,
  hoverOpenSubMenu,
  icon,
  text,
  suffixIconStyle,
  type,
  dangerous,
  disabled,
  suffixIcon,
  onSuffixIconClick,
  suffixIconClassName,
  name,
  onClick,
  selectedKey,
  innerKey,
  parentKey,
  onPointerMove,
  popOver,
  parentRef,
  suffix,
  onSelect,
  ...rest
}) => {
  const key = innerKey!
  const handlePointerMove = () => {
    const myKeys = [...parentKey, key]
    if (selectedKey.includes(key)) {
      if (selectedKey.length > myKeys.length) {
        return
      }
    }
    if (subMenu?.length) {
      const subMenuKey = subMenu.find(i => 'key' in i && i.key)
      if (subMenuKey) {
        myKeys.push(subMenuKey.key)
      }
    }
    if (popOver) {
      myKeys.push(popOver.key)
    }
    onPointerMove(myKeys)
  }
  if (subMenu || popOver) {
    const subMenuKeys = selectedKey.slice(selectedKey.findIndex(i => i === key))
    return (
      <AnimatePopover
        parentElement={parentRef.current}
        visible={(popOver && selectedKey.includes(popOver?.key)) || subMenu?.some(i => 'key' in i && selectedKey.includes(i.key))}
        duration={0.15}
        content={
          popOver?.node ||
          (subMenu && (
            <WithBorder padding={'0.25rem 0'}>
              <NavigationMenu
                onSelect={item => {
                  onClick?.(item)
                }}
                defaultSelectFirst={true}
                onSelectChange={keys => {
                  const myKeys = [...parentKey, key, ...keys]
                  onPointerMove?.(myKeys)
                }}
                layout={subMenu}
                selectedKeys={subMenuKeys}
              />
            </WithBorder>
          ))
        }
        keepAlign={true}
        reposition
        positions={['right', 'left', 'bottom']}
      >
        <Button.IconButton
          suffixIcon={subMenu || popOver ? 'park-right' : suffixIcon}
          onPointerMove={handlePointerMove}
          onSuffixIconClick={onSuffixIconClick}
          icon={icon}
          suffixStr={suffix}
          suffixIconClassName={suffixIconClassName}
          selected={selectedKey.includes(key)}
          text={typeof text === 'string' ? text : text?.()}
          dangerous={dangerous}
          data-key={innerKey}
          suffixIconStyle={suffixIconStyle}
          style={{
            gap: 10,
            marginLeft: '0.25rem',
            marginRight: '0.25rem',
            height: '2rem',
            padding: '0px 0.5rem',
            fontSize: 14,
            lineHeight: '20px',
            alignItems: 'center',
            ...rest.style
          }}
          size={16}
          onClick={() => {
            onClick?.({
              ...rest,
              type,
              text,
              key,
              subMenu,
              icon,
              onSelect
            })
          }}
        />
      </AnimatePopover>
    )
  }
  return (
    <Button.IconButton
      suffixIcon={subMenu ? 'park-right' : suffixIcon}
      onSuffixIconClick={onSuffixIconClick}
      onPointerMove={handlePointerMove}
      icon={icon}
      data-key={innerKey}
      suffixIconClassName={suffixIconClassName}
      selected={selectedKey.includes(key)}
      text={typeof text === 'string' ? text : text?.()}
      suffixIconStyle={suffixIconStyle}
      style={{
        marginLeft: '0.25rem',
        marginRight: '0.25rem',
        height: '2em',
        gap: 10,
        padding: '0px 0.5rem',
        fontSize: 14,
        lineHeight: '20px',
        alignItems: 'center',
        flexShrink: '0',
        ...rest.style
      }}
      size={16}
      dangerous={dangerous}
      suffixStr={suffix}
      onClick={() => {
        onClick?.({
          ...rest,
          type,
          text,
          key,
          subMenu,
          icon,
          onSelect
        })
      }}
    />
  )
}

const SeparatorMenuItem: FC<IMenuLayoutItem & { type: 'separator' }> = ({ style }) => {
  return (
    <div
      style={{
        height: 1,
        width: '100%',
        margin: '6px 0px',
        background: Colors.Background.Border,
        ...style
      }}
    ></div>
  )
}

export default MenuItem
