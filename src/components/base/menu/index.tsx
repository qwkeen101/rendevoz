import { KEY } from '@/consts'
import isHotkey from 'is-hotkey'
import { CSSProperties, FC, Fragment, MouseEventHandler, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import Content from '../Content'
import { Button } from '../button'
import styles from './index.module.less'
import MenuGroup from './MenuGroup'
import MenuItem, { MenuItemProps } from './MenuItem'
import { scrollToTarget } from '@/core/editor/utils/positions/scroll'

interface MenuProps {
  title?: string
  extra?: ReactNode
  footer?: ReactNode
  children: ReactNode
  style?: CSSProperties
  onClick?: MouseEventHandler
  layout?: MenuItemProps[]
}
interface IMenu extends FC<MenuProps> {
  Item: typeof MenuItem
  Group: typeof MenuGroup
  NavigationMenu: typeof NavigationMenu
}
const Menu: IMenu = ({ title, children, extra, footer, style, onClick }) => {
  return (
    <div className={styles.menu} style={style} onClick={onClick}>
      <Content style={{ marginBottom: 8 }} flex alignItems="center" justifyContent="space-between">
        {title && <div className={styles.title}>{title}</div>}
        {extra}
      </Content>
      <Content position="relative" fullHeight fullWidth style={{ flexGrow: 1 }}>
        {children}
      </Content>
      {footer && <Content fullWidth>{footer}</Content>}
    </div>
  )
}

type MenuLayoutItem =
  | { type: 'custom'; children: ReactNode }
  | { type: 'item'; icon?: string; text?: string; disabled?: boolean; dangerous?: boolean; name: string }
  | { type: 'separator' }
interface NavigationMenuProps {
  layout: MenuLayoutItem[]
  onClick?: (name: string) => void
  keyboardNavigation?: boolean
  style?: CSSProperties
  className?: string
}
export const NavigationMenu: FC<NavigationMenuProps> = ({ layout, keyboardNavigation = true, style, className, onClick }) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const layoutCount = layout.length

  const [currentSelect, setCurrentSelect] = useState<number>()
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      let direction: 'up' | 'down' | undefined = undefined
      if (isHotkey(KEY.ArrowUp, e)) {
        direction = 'up'
        e.stopPropagation()
        e.preventDefault()
      }
      if (isHotkey(KEY.ArrowDown, e)) {
        direction = 'down'
        e.stopPropagation()
        e.preventDefault()
      }
      if (isHotkey(KEY.Enter, e) && currentSelect !== undefined) {
        e.stopPropagation()
        e.preventDefault()
        setCurrentSelect(s => {
          if (s !== undefined) {
            const i = layout[s]
            i && i.type === 'item' && onClick?.(i.name)
          }
          return s
        })
      }
      const loopUp = (currentIdx: number | undefined): number => {
        const curr = currentIdx || 0
        const next = curr - 1 < 0 ? layoutCount - 1 : curr - 1
        if (layout[next].type === 'item') return next
        return loopUp(next)
      }
      const loopDown = (currentIdx: number | undefined): number => {
        const curr = currentIdx === undefined ? -1 : currentIdx
        const next = curr + 1 >= layoutCount ? 0 : curr + 1
        if (layout[next].type === 'item') return next
        return loopDown(next)
      }
      if (direction) {
        setCurrentSelect(s => {
          let next = s
          if (direction === 'up') {
            next = loopUp(s)
          }
          if (direction === 'down') {
            next = loopDown(s)
          }
          const ele = menuContainerRef.current?.querySelector(`[data-idx='${next}']`)
          if (ele) {
            ele.scrollIntoView({
              block: 'center'
            })
          }
          return next
        })
      }
    }
    if (keyboardNavigation) {
      document.addEventListener('keydown', keydownHandler, true)
      return () => {
        document.removeEventListener('keydown', keydownHandler, true)
      }
    }
  }, [layoutCount, keyboardNavigation, layout, currentSelect])

  const renderItem = (item: MenuLayoutItem, idx: number) => {
    switch (item.type) {
      case 'custom':
        return item.children
      case 'item':
        return (
          <Button.IconButton
            selected={currentSelect !== undefined ? idx === currentSelect : undefined}
            onPointerEnter={() => setCurrentSelect(idx)}
            icon={item.icon}
            text={item.text}
            dangerous={item.dangerous}
            onClick={() => onClick?.(item.name)}
          />
        )
    }
  }

  return (
    <div ref={menuContainerRef} style={style} className={className}>
      {layout.map((i, idx) => (
        <div data-idx={idx} key={idx}>
          {renderItem(i, idx)}
        </div>
      ))}
    </div>
  )
}
Menu.Item = MenuItem
Menu.Group = MenuGroup
Menu.NavigationMenu = NavigationMenu
export default Menu
