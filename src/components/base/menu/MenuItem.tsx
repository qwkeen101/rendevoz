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
            color: Colors.Font.Transparent
          }}
        >
          {rest.name}
        </div>
      )
  }
}

const CustomMenuItem: FC<MenuItemWithProps & { type: 'custom' }> = () => {}

const ButtonMenuItem: FC<MenuItemWithProps & { type: 'item' }> = ({
  subMenu,
  hoverOpenSubMenu,
  icon,
  text,
  type,
  dangerous,
  disabled,
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
        hoverOpen={hoverOpenSubMenu}
        duration={0.15}
        content={
          popOver?.node ||
          (subMenu && (
            <WithBorder padding={'0.25rem 0'}>
              <NavigationMenu
                onSelect={item => {
                  onClick?.(item)
                }}
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
          suffixIcon={subMenu || popOver ? 'park-right' : undefined}
          onPointerMove={handlePointerMove}
          icon={icon}
          suffixStr={suffix}
          selected={selectedKey.includes(key)}
          text={typeof text === 'string' ? text : text?.()}
          dangerous={dangerous}
          data-key={innerKey}
          style={{
            marginLeft: '0.25rem',
            marginRight: '0.25rem',
            height: '2rem',
            padding: '0px 0.5rem',
            fontSize: 14,
            lineHeight: '20px',
            alignItems: 'center'
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
      suffixIcon={subMenu ? 'park-right' : undefined}
      onPointerMove={handlePointerMove}
      icon={icon}
      data-key={innerKey}
      selected={selectedKey.includes(key)}
      text={typeof text === 'string' ? text : text?.()}
      style={{
        marginLeft: '0.25rem',
        marginRight: '0.25rem',
        height: '2em',
        padding: '0px 0.5rem',
        fontSize: 14,
        lineHeight: '20px',
        alignItems: 'center'
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

const SeparatorMenuItem: FC<IMenuLayoutItem & { type: 'separator' }> = () => {
  return (
    <div
      style={{
        height: 1,
        width: '100%',
        margin: '4px 0px',
        background: Colors.Background.Border
      }}
    ></div>
  )
}

export default MenuItem
