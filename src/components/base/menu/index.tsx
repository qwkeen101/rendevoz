import { KEY } from '@/consts'
import FontSize from '@/consts/font'
import { isHotkey } from 'is-hotkey'
import { CSSProperties, FC, Fragment, MouseEventHandler, ReactNode, useEffect, useRef, useState } from 'react'
import Content from '../Content'
import MenuItem from './MenuItem'
import ClassName from '@/styles/classNames'
import _ from 'lodash'
import scrollIntoView from 'scroll-into-view-if-needed'
import { GlobalInstance, useMemoizedFn } from '@/hooks'

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
  | {
      type: 'column'
      children: IMenuLayoutItem[]
      style?: CSSProperties
    }
  | {
      type: 'custom'
      children:
        | ReactNode
        | ((options: { isSelected: boolean; onPointerMove: React.PointerEventHandler; onClick: React.MouseEventHandler }) => ReactNode)
      key: string
      onSelect?: VoidFunction
    }
  | {
      type: 'item'
      icon?: string
      text?: string | (() => string)
      disabled?: boolean
      dangerous?: boolean
      style?: CSSProperties
      suffixIcon?: string
      suffixIconClassName?: string
      suffixIconStyle?: CSSProperties
      onSuffixIconClick?: React.MouseEventHandler
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
  | { type: 'separator'; style?: CSSProperties }
  | {
      type: 'title'
      name: string
      style?: CSSProperties
    }
  | undefined

interface NavigationMenuProps {
  layout: IMenuLayoutItem[]
  keyboardNavigation?: boolean
  style?: CSSProperties
  className?: string
  defaultSelected?: string[]
  disableEnterPreventDefault?: boolean
  onSelect?: (item: IMenuLayoutItem) => void
  // select key change
  onSelectChange?: (keys: string[]) => void
  selectedKeys?: string[]
  reselectOnLayoutChange?: boolean
  defaultSelectFirst?: boolean
}

export const NavigationMenu: FC<NavigationMenuProps> = ({
  layout,
  keyboardNavigation = true,
  style,
  className,
  selectedKeys,
  disableEnterPreventDefault = false,
  onSelect,
  onSelectChange,
  defaultSelected,
  reselectOnLayoutChange = true,
  defaultSelectFirst = true
}) => {
  layout = layout.filter(i => i)
  let normalizedLayout: IMenuLayoutItem[] = []
  layout.forEach(i => {
    if (i.type === 'column') {
      i.children.forEach(c => {
        normalizedLayout.push(c)
      })
    } else {
      normalizedLayout.push(i)
    }
  })
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const firstKey = defaultSelectFirst ? [normalizedLayout.find(i => 'key' in i && i.key)?.key] : []
  const defaultSelectedKeys = defaultSelected
    ? normalizedLayout.some(i => 'key' in i && i.key === defaultSelected[0])
      ? defaultSelected
      : firstKey
    : firstKey
  const [currentSelect, setCurrentSelect] = useState<string[]>([])

  const handleSelectItem = (currentItem: IMenuLayoutItem) => {
    if ('onSelect' in currentItem && currentItem.onSelect) {
      currentItem.onSelect?.()
      return
    }
    onSelect?.(currentItem)
  }
  useEffect(() => {
    if (reselectOnLayoutChange) {
      setCurrentSelect([])
    }
  }, [normalizedLayout.length, reselectOnLayoutChange])
  const getCurrentItemList = (): IMenuLayoutItem[] => {
    if (currentSelect.length) {
      let l: IMenuLayoutItem[] = normalizedLayout
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
    return normalizedLayout
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
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
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
      if (!disableEnterPreventDefault) {
        e.preventDefault()
      }
      const currentItem = getCurrentSelectItem()
      if (currentItem) {
        handleSelectItem(currentItem)
      }
    }
    if (direction) {
      keyNavigatedRef.current = true
      setTimeout(() => {
        keyNavigatedRef.current = false
      }, 10)
      setCurrentSelect(s => {
        const currentList = getCurrentItemList()
        if (s.length === 0) {
          const firstKey = currentList.find(i => i.type === 'item' && i.key)?.key
          const lastKey = currentList.findLast(i => i.type === 'item' && i.key)?.key
          if (direction === 'down') {
            return firstKey ? [firstKey] : []
          }
          if (direction === 'up') {
            return lastKey ? [lastKey] : []
          }
          return []
        }
        const newS = [...s]
        const last = newS[newS.length - 1]

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
  })
  useEffect(() => {
    if (keyboardNavigation && !selectedKeys) {
      GlobalInstance.values.registeredKeynavigationHandlers.unshift(keydownHandler)
      return () => {
        GlobalInstance.values.registeredKeynavigationHandlers = GlobalInstance.values.registeredKeynavigationHandlers.filter(
          i => i !== keydownHandler
        )
      }
    }
  }, [keyboardNavigation])

  useEffect(() => {
    if (!keyNavigatedRef.current) return
    const ele = menuContainerRef.current?.querySelector(`[data-key='${currentSelect[currentSelect.length - 1]}']`)
    if (ele) {
      scrollIntoView(ele, {
        scrollMode: 'if-needed',
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
      {layout.map((i, idx) => {
        return (
          <Fragment key={idx}>
            {i.type === 'column' ? (
              <Content flex column style={{ flex: 'auto', ...i.style }}>
                {i.children.map((i, idx) => (
                  <MenuItem
                    key={idx}
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
                ))}
              </Content>
            ) : (
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
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

Menu.Item = MenuItem
Menu.NavigationMenu = NavigationMenu
export default Menu
