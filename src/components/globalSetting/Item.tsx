import { Content } from '@/components/base'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { FC, ReactNode } from 'react'

type SettingItem = {
  children?: ReactNode
  title: string
  description?: string
  column?: boolean
  titleSize?: number
}
const SettingItem: FC<SettingItem> = ({ children, title, description, column = false, titleSize = 18 }) => {
  const { defaultFontColorBlack, defaultFontColorGrey } = useTheme('defaultFontColorBlack', 'defaultFontColorGrey')
  return (
    <Content
      flex
      column={column}
      alignItems={!column ? 'center' : undefined}
      justifyContent={!column ? 'space-between' : undefined}
      gap={column ? 6 : 30}
      className={css({
        userSelect: 'none',
        padding: '10px 0px',
        ':not(:last-child)': {
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }
      })}
    >
      <div>
        <div
          className={css({
            color: defaultFontColorBlack,
            fontWeight: 600,
            fontSize: titleSize
          })}
        >
          {title}
        </div>
        {description && <div className={css({ color: defaultFontColorGrey, fontSize: 13 })}>{description}</div>}
      </div>
      <Content flex centered={!column}>
        {children}
      </Content>
    </Content>
  )
}

export default SettingItem
