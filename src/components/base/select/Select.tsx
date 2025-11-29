import Icon from '@/components/base/Icon'
import { CSSProperties, FC, ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import AnimatePopover from '../AnimatePopover'
import Content from '../Content'
import SelectOption, { SelectOptionProps } from './SelectOption'
import './index.less'
import WithBorder from '../WithBorder'
import classNames from 'classnames'
import { isArray } from 'lodash'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Menu } from '@/components'
import classnames from 'classnames'

export interface SelectProps {
  value?: string | string[] | number | number[]
  closeOnSelect?: boolean
  disabled?: boolean
  deselectable?: boolean
  defaultValue?: string
  placeholder?: string
  showArrow?: boolean
  className?: string
  displayRenderer?: (value: string | string[] | number | number[], children: string) => ReactNode
  onSelect: (value: string[] | number[]) => void
  style?: CSSProperties
  menuStyle?: CSSProperties
  menuClassName?: string
  options: SelectOptionProps[]
  gap?: number
  padding?: number
  containerStyle?: CSSProperties
  align?: 'start' | 'center' | 'end'
  parentElement?: HTMLElement
  image?: string
  icon?: string
  children?: ReactElement
}
interface ISelect extends FC<SelectProps> {
  Option: typeof SelectOption
}
const Select: ISelect = ({
  disabled,
  closeOnSelect = true,
  onSelect,
  padding = 6,
  image,
  placeholder,
  style,
  showArrow = true,
  menuStyle,
  menuClassName,
  className,
  value,
  defaultValue,
  deselectable,
  containerStyle,
  children,
  align = 'center',
  gap,
  options,
  parentElement,
  displayRenderer,
  icon
}) => {
  const multiple = false
  let d = []
  if (defaultValue) {
    d = [defaultValue]
  }
  let v = null
  if (value) {
    if (isArray(value)) {
      v = value
    } else {
      v = [value]
    }
    if (v) {
      d = v
    }
  }
  const containerRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<string[]>(d)

  const [menuVisible, setMenuVisible] = useState(false)
  const menuItems = options
    .filter(i => i)
    ?.map(o => ({
      name: o.children,
      value: o.value,
      icon: o.icon,
      image: o.image,
      suffix: o.suffix
    }))

  useEffect(() => {
    if (v) {
      setSelected(v)
    }
  }, [value])
  const renderSingle = () => {
    if (children) return children
    const item = menuItems.find(i => i.value === selected[0])
    if (!item) return null
    return <span className={'line-clamp-1 break-all'}>{item.name}</span>
  }
  const renderContent = () => {
    if (displayRenderer) {
      const children = menuItems.find(i => i.value === value)
      if (!children) {
        return null
      }
      return displayRenderer(value, children.name)
    }
    return disabled ? null : selected.length ? (
      <div
        className={'w-full flex items-center gap-2.5'}
        style={{
          gap
        }}
      >
        {image ? <img src={image} className={'em:size-5 object-cover rounded'} /> : icon ? <Icon name={icon} /> : null}
        {renderSingle()}
        {showArrow && <Icon name="park-down" strokeWidth={6} size={12} className={'ml-auto transparent-font'} />}
      </div>
    ) : (
      <div
        className={'flex w-full items-center gap-2.5'}
        style={{
          gap
        }}
      >
        {icon && <Icon name={icon} />}
        <span>{placeholder}</span>
        {showArrow && <Icon strokeWidth={6} size={12} className={'ml-auto transparent-font'} name="park-down" />}
      </div>
    )
  }
  return (
    <div style={containerStyle} ref={containerRef}>
      <AnimatePopover
        visible={menuVisible}
        positions={['bottom', 'top']}
        onClickOutside={() => setMenuVisible(false)}
        padding={padding}
        parentElement={parentElement}
        reposition={true}
        containerStyle={{ zIndex: '50000' }}
        align={align}
        withClickCover={true}
        boundaryElement={parentElement ?? document.body}
        boundaryInset={20}
        content={
          <WithBorder className={'py-1'}>
            <SelectMenu
              style={menuStyle}
              className={menuClassName}
              menuItems={menuItems}
              selectedItems={selected}
              onDeSelect={value => {
                if (!deselectable) {
                  return
                }
                setSelected(() => {
                  const newSelected = selected.filter(o => o !== value)
                  onSelect(newSelected)
                  return newSelected
                })
                if (closeOnSelect) {
                  setMenuVisible(false)
                }
              }}
              onSelect={value => {
                if (multiple) {
                  setSelected(() => {
                    const newSelected = [...selected, value]
                    onSelect(newSelected)
                    return newSelected
                  })
                } else {
                  setSelected(() => {
                    const newSelected = [value]
                    onSelect(newSelected)
                    return newSelected
                  })
                }
                if (closeOnSelect) {
                  setMenuVisible(false)
                }
              }}
            />
          </WithBorder>
        }
      >
        <Content
          onPointerDown={e => e.preventDefault()}
          style={style}
          className={classNames('selectContainer', disabled ? 'disabled' : undefined, className, 'icon-button')}
          onClick={() => !disabled && setMenuVisible(!menuVisible)}
          flex
        >
          {renderContent()}
        </Content>
      </AnimatePopover>
    </div>
  )
}
const SelectMenu: FC<{
  style?: CSSProperties
  className?: string
  menuItems?: {
    name: string
    value: string
    icon?: string
    suffix?: string
    image?: string
  }[]
  onSelect: (value: string) => void
  onDeSelect: (value: string) => void
  selectedItems: string[]
}> = ({ menuItems, onSelect, selectedItems, className, style }) => {
  return (
    <Menu.NavigationMenu
      style={style}
      defaultSelected={[selectedItems[0]]}
      className={classnames('flex flex-col min-w-52 gap-1', className)}
      onSelect={v => {
        onSelect(v.key)
      }}
      layout={
        menuItems?.map(i => ({
          type: 'item',
          key: i.value,
          text: i.name,
          icon: i.icon,
          image: i.image,
          suffix: i.suffix
        })) || []
      }
    />
  )
}
Select.Option = SelectOption

export default Select
