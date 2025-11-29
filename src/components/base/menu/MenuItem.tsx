import { FC, RefObject } from 'react'
import { IMenuLayoutItem, NavigationMenu } from '@/components/base/menu/index'
import { AnimatePopover, Button, WithBorder } from '@/components'
import { Colors } from '@/consts'
import ContextMenu from '@/components/contextMenu'

type MenuItemWithProps = IMenuLayoutItem & {
  selectedKey: string[]
  onSelect?: () => void
  onPointerMove: (keyToMe: string[]) => void
  onClick: (item: IMenuLayoutItem) => void
  innerKey?: string
  parentKey: string[]
  parentRef: RefObject<HTMLElement>
  hoverBg?: boolean
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
          className={'menu-sub-title'}
          style={{
            paddingLeft: '0.75rem',
            lineHeight: 1.2,
            margin: '5px 1px 6px',
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
  image,
  dangerous,
  disabled,
  suffixIcon,
  onSuffixIconClick,
  suffixIconClassName,
  suffixClassName,
  name,
  contextMenu,
  onClick,
  strokeWidth,
  selectedKey,
  innerKey,
  parentKey,
  onPointerMove,
  popOver,
  parentRef,
  suffix,
  onSelect,
  hoverBg,
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
  const renderContent = () => (
    <Button.IconButton
      image={image}
      suffixIcon={subMenu || popOver ? 'park-right' : suffixIcon}
      onSuffixIconClick={onSuffixIconClick}
      onPointerMove={handlePointerMove}
      icon={icon}
      className={rest.className}
      theme={rest.iconTheme}
      iconClassName={rest.iconClassName}
      data-key={innerKey}
      suffixIconClassName={suffixIconClassName}
      selected={hoverBg ? undefined : selectedKey.includes(key)}
      text={typeof text === 'string' ? text : text?.()}
      suffixIconStyle={suffixIconStyle}
      style={{
        marginLeft: '0.25rem',
        marginRight: '0.25rem',
        flexShrink: '0',
        ...rest.style
      }}
      size={16}
      dangerous={dangerous}
      strokeWidth={strokeWidth}
      suffixStr={suffix}
      suffixStrClassName={suffixClassName}
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
  if (subMenu || popOver) {
    const subMenuKeys = selectedKey.slice(selectedKey.findIndex(i => i === key))
    return (
      <AnimatePopover
        visible={(popOver && selectedKey.includes(popOver?.key)) || subMenu?.some(i => 'key' in i && selectedKey.includes(i.key))}
        duration={0.15}
        content={
          popOver?.node ||
          (subMenu &&
            (setV => (
              <WithBorder className='py-1' style={rest.subMenuStyle}>
                <NavigationMenu
                  onSelect={item => {
                    onClick?.(item)
                    setV(false)
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
            )))
        }
        keepAlign={true}
        reposition
        align={rest.align ?? 'start'}
        padding={-6}
        positions={['right', 'left', 'bottom']}
      >
        {renderContent()}
      </AnimatePopover>
    )
  }
  if (contextMenu) {
    return <ContextMenu content={contextMenu}>{renderContent()}</ContextMenu>
  }
  return renderContent()
}

const SeparatorMenuItem: FC<IMenuLayoutItem & { type: 'separator' }> = ({ style }) => {
  return (
    <div
      className={'my-1.5 w-full'}
      style={{
        height: 1,
        background: Colors.Background.Border,
        ...style
      }}
    ></div>
  )
}

export default MenuItem
