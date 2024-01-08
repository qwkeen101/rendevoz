import Icon from '@/components/base/Icon'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { CSSProperties, FC, ReactNode, useEffect, useRef, useState } from 'react'
import AnimatePopover from '../AnimatePopover'
import Content from '../Content'
import SelectOption, { SelectOptionProps } from './SelectOption'
import styles from './index.module.less'
import WithBorder from '../WithBorder'
import classNames from 'classnames'
import { isArray } from 'lodash'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Button } from '../button'
import { Menu } from '@/components'

export interface SelectProps {
  multiple?: boolean
  value?: string | string[] | number | number[]
  closeOnSelect?: boolean
  disabled?: boolean
  deselectable?: boolean
  defaultValue?: string
  placeholder?: string
  className?: string
  displayRenderer?: (value: string | string[] | number | number[], children: string) => ReactNode
  onSelect: (value: string[] | number[]) => void
  style?: CSSProperties
  menuStyle?: CSSProperties
  menuPosition?: 'top' | 'bottom'
  options: SelectOptionProps[]
  gap?: number
  padding?: number
  containerStyle?: CSSProperties
  align?: 'start' | 'center' | 'end'
  reposition?: boolean
}
interface ISelect extends FC<SelectProps> {
  Option: typeof SelectOption
}
const Select: ISelect = ({
  disabled,
  multiple,
  closeOnSelect,
  onSelect,
  padding = 10,
  placeholder,
  style,
  menuStyle,
  className,
  value,
  defaultValue,
  deselectable,
  containerStyle,
  align = 'center',
  gap = 12,
  menuPosition = 'bottom',
  options,
  reposition = true,
  displayRenderer
}) => {
  let d = []
  if (defaultValue) {
    d = [defaultValue]
  }
  const containerRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<string[]>(d)
  let v = null
  if (value) {
    if (isArray(value)) {
      v = value
    } else {
      v = [value]
    }
  }
  const [menuVisible, setMenuVisible] = useState(false)
  const menuItems = options
    .filter(i => i)
    ?.map(o => ({
      name: o.children,
      value: o.value,
      icon: o.icon
    }))

  useEffect(() => {
    if (v) {
      setSelected(v)
    }
  }, [value])
  const renderMultiple = () => {
    return (
      <LayoutGroup>
        <AnimatePresence>
          {selected.map(i => (
            <motion.div
              layout
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <Tag
                key={i}
                tag={i}
                onDelete={() => {
                  setSelected(() => {
                    const newSelected = selected.filter(o => o !== i)
                    onSelect(newSelected)
                    return newSelected
                  })
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </LayoutGroup>
    )
  }
  const renderSingle = () => {
    const name = menuItems.find(i => i.value === selected[0])?.name
    return (
      <Content flex centered>
        <span className={styles.placeholder}>{name}</span>
      </Content>
    )
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
      <Content fullWidth flex justifyContent="space-between" gap={gap}>
        {multiple ? renderMultiple() : renderSingle()}
        <Icon name="park-down" />
      </Content>
    ) : (
      <Content fullWidth flex justifyContent="space-between" gap={gap}>
        <span className={styles.placeholder}>{placeholder}</span>
        <Icon name="park-down" />
      </Content>
    )
  }
  return (
    <div style={containerStyle} ref={containerRef}>
      <AnimatePopover
        visible={menuVisible}
        positions={[menuPosition]}
        onClickOutside={() => setMenuVisible(false)}
        padding={padding}
        containerStyle={{ zIndex: '50000' }}
        // parentElement={containerRef.current}
        align={align}
        reposition={reposition}
        boundaryElement={document.body}
        boundaryInset={20}
        content={
          <WithBorder padding={'0.25rem 0'} style={{ fontSize: 13 }}>
            <SelectMenu
              style={menuStyle}
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
          className={classNames(
            styles.selectContainer,
            menuVisible ? styles.focused : undefined,
            disabled ? styles.disabled : undefined,
            className,
            ClassName.flatButton()
          )}
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
  menuItems?: {
    name: string
    value: string
    icon?: string
  }[]
  onSelect: (value: string) => void
  onDeSelect: (value: string) => void
  selectedItems: string[]
}> = ({ menuItems, onDeSelect, onSelect, selectedItems, style }) => {
  return (
    <Menu.NavigationMenu
      style={style}
      defaultSelected={[selectedItems[0]]}
      className={css({
        minWidth: 140,
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      })}
      onSelect={v => {
        onSelect(v.key)
      }}
      layout={
        menuItems?.map(i => ({
          type: 'item',
          key: i.value,
          text: i.name,
          icon: i.icon
        })) || []
      }
    />
  )
}
const Tag: FC<{
  tag: string
  onDelete: () => void
}> = ({ tag, onDelete }) => {
  return (
    <Content centered className={styles.tag} onClick={e => e.stopPropagation()} flex>
      <span>{tag}</span>
      <Icon size={12} onClick={onDelete} name="park-close" />
    </Content>
  )
}
Select.Option = SelectOption

export default Select
