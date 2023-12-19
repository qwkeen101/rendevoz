import { FontSize, KEY } from '@/consts'
import { isHotkey } from 'is-hotkey'
import { CSSProperties, FC, MouseEventHandler, ReactNode, useEffect, useRef, useState } from 'react'
import Content from '../Content'
import styles from './index.module.less'
import MenuGroup from './MenuGroup'
import MenuItem from './MenuItem'
import ClassName from '@/styles/classNames'
import _ from 'lodash'

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
        {title && <div className={ClassName.title(FontSize['16px'])}>{title}</div>}
        {extra}
      </Content>
      <Content position="relative" fullHeight fullWidth style={{ flexGrow: 1 }}>
        {children}
      </Content>
      {footer && <Content fullWidth>{footer}</Content>}
    </div>
  )
}

export type IMenuLayoutItem =
  | { type: 'custom'; children: ReactNode; key: string }
  | {
      type: 'item'
      icon?: string
      text?: string | (() => string)
      disabled?: boolean
      dangerous?: boolean
      name: string
      subMenu?: IMenuLayoutItem[]
      hoverOpenSubMenu?: boolean
      key: string
    }
  | { type: 'separator' }
interface NavigationMenuProps {
  layout: IMenuLayoutItem[]
  onClick?: (name: string) => void
  keyboardNavigation?: boolean
  style?: CSSProperties
  className?: string
  onSelectChange?: () => void
  selectedKeys?: string[]
}
export const NavigationMenu: FC<NavigationMenuProps> = ({ layout, keyboardNavigation = true, style, className, onClick, selectedKeys }) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const layoutCount = layout.length

  const [currentSelect, setCurrentSelect] = useState<string[]>([layout.find(i => 'key' in i && i.key).key])
  const getCurrentSelectItem = (): IMenuLayoutItem | undefined => {
    if (currentSelect.length) {
      let l: IMenuLayoutItem[] = layout
      let result: IMenuLayoutItem | undefined = undefined
      currentSelect.forEach(key => {
        const target = l.find(i => 'key' in i && i.key === key)
        if (target && 'subMenu' in target && target.subMenu) {
          l = target.subMenu
          return
        }
        if (target) {
          result = target
        }
      })
      return result
    }
  }
  const getCurrentItemList = (): IMenuLayoutItem[] => {
    if (currentSelect.length) {
      let l: IMenuLayoutItem[] = layout
      currentSelect.forEach((key, idx) => {
        const nextKey = currentSelect[idx + 1]
        if (nextKey) {
          const target = l.find(i => 'key' in i && i.key === key)
          if (target && 'subMenu' in target && target.subMenu) {
            l = target.subMenu
          }
        }
      })
      return l
    }
    return layout
  }
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
      if (isHotkey(KEY.ArrowRight, e)) {
        const currentSelect = getCurrentSelectItem()
        if (currentSelect) {
          if ('subMenu' in currentSelect && currentSelect.subMenu) {
            const next = currentSelect.subMenu.find(i => 'key' in i && i.key)
            if (next) {
              setCurrentSelect(s => [...s, next.key])
            }
          }
        }
      }
      if (isHotkey(KEY.ArrowLeft, e)) {
        setCurrentSelect(s => {
          if (s.length <= 1) {
            return s
          }
          const newS = [...s]
          newS.pop()
          return newS
        })
      }
      if (isHotkey(KEY.Enter, e) && currentSelect.length) {
        e.stopPropagation()
        e.preventDefault()
        const currentItem = getCurrentSelectItem()
        if (currentItem) {
          onClick?.(currentItem.key)
        }
      }
      if (direction) {
        setCurrentSelect(s => {
          const newS = [...s]
          const last = newS[newS.length - 1]
          const currentList = getCurrentItemList()
          const currentIndex = currentList.findIndex(i => 'key' in i && i.key === last)
          if (currentIndex < 0) {
            throw new Error('Failed to get next key!')
          }
          if (direction === 'up') {
            const nextKey = _.findLast(currentList, (i, idx) => idx < currentIndex && 'key' in i && i.key)
            // goto last key
            if (!nextKey) {
              const lastKey = _.findLast(currentList, i => 'key' in i && i.key)
              if (lastKey) {
                newS.pop()
                return [...newS, lastKey]
              }
            }
          }
          if (direction === 'down') {
            const nextKey = _.find(currentList, (i, idx) => idx > currentIndex && 'key' in i && i.key)
            // goto first key
            if (!nextKey) {
              const firstKey = _.find(currentList, i => 'key' in i && i.key)
              if (firstKey) {
                newS.pop()
                return [...newS, firstKey]
              }
            }
          }
          return s
          // const ele = menuContainerRef.current?.querySelector(`[data-key='${}']`)
          // if (ele) {
          //   ele.scrollIntoView({
          //     block: 'center'
          //   })
          // }
          // return next
        })
      }
    }
    if (keyboardNavigation && !selectedKeys) {
      document.addEventListener('keydown', keydownHandler, true)
      return () => {
        document.removeEventListener('keydown', keydownHandler, true)
      }
    }
  }, [layoutCount, keyboardNavigation, layout, currentSelect])

  return (
    <div ref={menuContainerRef} style={style} className={className}>
      {layout.map((i, idx) => (
        <div data-idx={idx} key={idx}>
          <MenuItem type={i.type} selectedKey={selectedKeys || currentSelect} onPointerMove={() => {}} onClick={() => {}} {...i} />
        </div>
      ))}
    </div>
  )
}

Menu.Item = MenuItem
Menu.Group = MenuGroup
Menu.NavigationMenu = NavigationMenu
export default Menu
