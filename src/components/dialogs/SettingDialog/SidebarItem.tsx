import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { FC } from 'react'

const SettingSidebarItem: FC<{ children: string; isSelected: boolean; onClick: MouseEventHandler }> = ({ children, isSelected, onClick }) => {
  const { defaultFontColorBlack, defaultButtonHoverBackgroundColor } = useTheme(
    'defaultFontColorBlack',
    'defaultButtonHoverBackgroundColor'
  )
  return (
    <div
      onClick={onClick}
      className={css({
        color: defaultFontColorBlack,
        transition: 'background 0.3s ease',
        fontWeight: 600,
        cursor: 'pointer',
        background: isSelected ? defaultButtonHoverBackgroundColor : undefined,
        padding: '4px 12px',
        borderRadius: 6,
        ':not(:last-child)': {
          marginBottom: 4
        },
        ':hover': {
          background: defaultButtonHoverBackgroundColor
        }
      })}
    >
      {children}
    </div>
  )
}

export default SettingSidebarItem
