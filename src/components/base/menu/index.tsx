import { KEY } from '@/consts'
import FontSize from '@/consts/font'
import { isHotkey } from 'is-hotkey'
import { CSSProperties, FC, MouseEventHandler, ReactNode, useEffect, useRef, useState } from 'react'
import Content from '../Content'
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
  NavigationMenu: typeof NavigationMenu
}
const Menu: IMenu = ({ title, children, extra, footer, style, onClick }) => {
  return (
    <div style={style} onClick={onClick}>
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
      subMenu?: IMenuLayoutItem[]
      popOver?: {
        key: string
        node: ReactNode
      }
      suffix?: string
      hoverOpenSubMenu?: boolean
      key: string
      onSelect?: VoidFunction
    }
  | { type: 'separator' }
  | {
      type: 'title'
      name: string
    }
interface NavigationMenuProps {
  layout: IMenuLayoutItem[]
  onClick?: (name: string) => void
  keyboardNavigation?: boolean
  style?: CSSProperties
  className?: string
  onSelect?: (item: IMenuLayoutItem) => void
  // select key change
  onSelectChange?: (keys: string[]) => void
  selectedKeys?: string[]
}
export const NavigationMenu: FC<NavigationMenuProps> = ({
  layout,
  keyboardNavigation = true,
  style,
  className,
  onClick,
  selectedKeys,
  onSelect,
  onSelectChange
}) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const layoutCount = layout.length

  const [currentSelect, setCurrentSelect] = useState<string[]>([layout.find(i => 'key' in i && i.key)?.key])
  useEffect(() => {
    setCurrentSelect([layout.find(i => 'key' in i && i.key)?.key])
  }, [layout.length])

  const handleSelectItem = (currentItem: IMenuLayoutItem) => {
    if ('onSelect' in currentItem) {
      currentItem.onSelect?.()
    }
    onSelect?.(currentItem)
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
  const getCurrentSelectItem = (): IMenuLayoutItem | undefined => {
    const currentList = getCurrentItemList()
    if (currentList) {
      const lastkey = currentSelect[currentSelect.length - 1]
      const item = currentList.find(i => 'key' in i && i.key === lastkey)
      return item
    }
  }
  useEffect(() => {
    onSelectChange?.(currentSelect)
  }, [currentSelect])
  const keyNavigatedRef = useRef(false)
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
              e.preventDefault()
              setCurrentSelect(s => [...s, next.key])
            }
          }
          if ('popOver' in currentSelect && currentSelect.popOver) {
            e.preventDefault()
            setCurrentSelect(s => [...s, currentSelect.popOver!.key])
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
          e.preventDefault()
          return newS
        })
      }
      if (isHotkey(KEY.Enter, e) && currentSelect.length) {
        e.stopPropagation()
        e.preventDefault()
        const currentItem = getCurrentSelectItem()
        if (currentItem) {
          handleSelectItem(currentItem)
        }
      }
      if (direction) {
        keyNavigatedRef.current = true
        setTimeout(() => {
          keyNavigatedRef.current = false
        })
        setCurrentSelect(s => {
          const newS = [...s]
          const last = newS[newS.length - 1]
          const currentList = getCurrentItemList()
          const currentIndex = currentList.findIndex(i => 'key' in i && i.key === last)
          if (currentIndex < 0) {
            return s
          }
          if (direction === 'up') {
            const nextKey = _.findLast(currentList, (i, idx) => idx < currentIndex && 'key' in i && i.key)
            // goto last key
            if (!nextKey) {
              const lastKey = _.findLast(currentList, i => 'key' in i && i.key).key
              if (lastKey) {
                newS.pop()
                return [...newS, lastKey]
              }
            } else {
              newS.pop()
              return [...newS, nextKey.key]
            }
          }
          if (direction === 'down') {
            const nextKey = _.find(currentList, (i, idx) => idx > currentIndex && 'key' in i && i.key)
            // goto first key
            if (!nextKey) {
              const firstKey = _.find(currentList, i => 'key' in i && i.key).key
              if (firstKey) {
                newS.pop()
                return [...newS, firstKey]
              }
            } else {
              newS.pop()
              return [...newS, nextKey.key]
            }
          }
          return s
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

  useEffect(() => {
    if (!keyNavigatedRef.current) return
    const ele = document.querySelector(`[data-key='${currentSelect[currentSelect.length - 1]}']`)
    if (ele) {
      ele.scrollIntoView({
        block: 'center'
      })
    }
  }, [currentSelect])
  return (
    <div
      ref={menuContainerRef}
      style={{
        ...style,
        minWidth: 160
      }}
      className={className}
    >
      {layout.map((i, idx) => (
        <div data-idx={idx} key={idx}>
          <MenuItem
            innerKey={i.key}
            selectedKey={selectedKeys || currentSelect}
            onPointerMove={keyToMe => {
              setCurrentSelect(keyToMe)
            }}
            parentRef={menuContainerRef}
            parentKey={[]}
            onClick={item => {
              handleSelectItem(item)
            }}
            {...i}
          />
        </div>
      ))}
    </div>
  )
}

Menu.Item = MenuItem
Menu.NavigationMenu = NavigationMenu
export default Menu
