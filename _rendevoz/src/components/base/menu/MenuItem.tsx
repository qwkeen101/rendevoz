import { FC, MouseEvent, MouseEventHandler } from 'react'
import Content from '../Content'
import styles from './index.module.less'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
import ClassName from '@/styles/classNames'

export interface MenuItemProps {
  onClick?: MouseEventHandler
  onDoubleClick?: MouseEventHandler
  onContextMenu?: MouseEventHandler
  icon?: React.ReactNode
  type: 'button' | 'link' | 'separator'
  children: React.ReactNode
  selected?: boolean
  id?: number | string
  gap?: number
  disabled?: boolean
}
const MenuItem: FC<MenuItemProps> = ({
  type,
  icon,
  onClick,
  onDoubleClick,
  onContextMenu,
  children,
  selected,
  id,
  gap = 10,
  disabled = false
}) => {
  return (
    <>
      {type === 'button' && (
        <Item
          gap={gap}
          id={id}
          selected={selected}
          children={children}
          icon={icon}
          onClick={onClick}
          disabled={disabled}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
        />
      )}
    </>
  )
}

const MenuItemClazzName = css({
  display: 'flex',
  cursor: 'pointer',
  width: '100%',
  alignItems: 'center',
  minHeight: 32,
  justifyContent: 'left',
  padding: '4px 12px'
})
const Item: FC<Omit<MenuItemProps, 'type'>> = ({ icon, children, onClick, onDoubleClick, onContextMenu, selected, id, gap, disabled }) => {
  const handleInternalClick = (e: MouseEvent) => {
    !disabled && onClick?.(e)
  }
  return (
    <Content
      gap={gap}
      flex
      id={String(id)}
      className={css([ClassName.flatButton(), MenuItemClazzName])}
      onContextMenuCapture={onContextMenu}
      onPointerDown={e => e.preventDefault()}
      onDoubleClick={onDoubleClick}
      onClick={handleInternalClick}
      style={{
        position: 'relative',
        cursor: disabled ? 'default' : undefined,
        background: disabled ? 'transparent' : selected ? Colors.Background.ButtonHover : undefined
      }}
    >
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.text}>{children}</div>
    </Content>
  )
}

export default MenuItem
