import { FC, MouseEvent, PointerEventHandler, useState } from 'react'
import { IMenuLayoutItem, NavigationMenu } from '@/components/base/menu/index'
import { AnimatePopover, Button, WithBorder } from '@/components'

type MenuItemWithProps = IMenuLayoutItem & {
  selectedKey: string[]
  onSelect?: () => void
  onPointerMove: PointerEventHandler
  onClick: (item: IMenuLayoutItem, e: MouseEvent) => void
}
const MenuItem: FC<MenuItemWithProps> = ({ type, ...rest }) => {
  switch (type) {
    case 'custom':
      return <CustomMenuItem type={type} {...rest} />
    case 'item':
      return <ButtonMenuItem type={type} {...rest} />
    case 'separator':
      return <SeparatorMenuItem type={type} {...rest} />
  }
}

const CustomMenuItem: FC<MenuItemWithProps & { type: 'custom' }> = () => {}

const ButtonMenuItem: FC<MenuItemWithProps & { type: 'item' }> = ({
  subMenu,
  hoverOpenSubMenu,
  icon,
  text,
  dangerous,
  disabled,
  name,
  onClick,
  selectedKey,
  key,
  onPointerMove
}) => {
  const ButtonRenderer = () => (
    <Button.IconButton
      suffixIcon={subMenu ? 'park-right' : undefined}
      onPointerMove={onPointerMove}
      icon={icon}
      selected={selectedKey.includes(key)}
      text={typeof text === 'string' ? text : text?.()}
      dangerous={dangerous}
      onClick={onClick}
    />
  )
  if (subMenu) {
    const subMenuKeys = selectedKey.slice(selectedKey.findIndex(i => i === key))
    return (
      <AnimatePopover
        visible={subMenu.some(i => 'key' in i && selectedKey.includes(i.key))}
        hoverOpen={hoverOpenSubMenu}
        content={
          <WithBorder padding={5}>
            <NavigationMenu layout={subMenu} selectedKeys={subMenuKeys} />
          </WithBorder>
        }
        positions={['right', 'left', 'bottom']}
      >
        <ButtonRenderer />
      </AnimatePopover>
    )
  }
  return <ButtonRenderer />
}

const SeparatorMenuItem: FC<IMenuLayoutItem & { type: 'separator' }> = () => {}

export default MenuItem
