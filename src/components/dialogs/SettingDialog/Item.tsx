import { Content } from '@/components/base'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { FC, ReactNode } from 'react'

const SettingItem: FC<{
  children: ReactNode
  title: string
  description?: string
}> = ({ children, title, description }) => {
  const { defaultFontColorBlack, defaultFontColorGrey } = useTheme('defaultFontColorBlack', 'defaultFontColorGrey')
  return (
    <Content
      flex
      alignItems="center"
      justifyContent="space-between"
      gap={30}
      className={css({
        padding: '10px 0px',
        ':not(:last-child)': {
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }
      })}
    >
      <Content flex column>
        <div
          className={css({
            color: defaultFontColorBlack,
            fontWeight: 600,
            fontSize: 18
          })}
        >
          {title}
        </div>
        {description && <div className={css({ color: defaultFontColorGrey, fontSize: 13 })}>{description}</div>}
      </Content>
      <Content flex centered>
        {children}
      </Content>
    </Content>
  )
}

export default SettingItem
