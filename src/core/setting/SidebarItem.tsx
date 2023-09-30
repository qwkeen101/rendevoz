import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import classNames from 'classnames'
import { FC, MouseEventHandler } from 'react'
import { Colors } from '@/consts'

const SettingSidebarItem: FC<{
  children: string
  isSelected: boolean
  onClick: MouseEventHandler
}> = ({ children, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{ background: isSelected ? Colors.Background.ButtonActive : undefined }}
      className={classNames(
        ClassName.flatButton(),
        css({
          ':not(:last-child)': {
            marginBottom: 4
          }
        })
      )}
    >
      {children}
    </div>
  )
}

export default SettingSidebarItem
