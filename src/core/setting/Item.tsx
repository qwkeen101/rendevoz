import { Content } from '@/components/base'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { CSSProperties, FC, ReactNode } from 'react'

type SettingItem = {
  children?: ReactNode
  title: string
  description?: string
  column?: boolean
  titleSize?: number
  childrenContainerStyle?: CSSProperties
}
const SettingItem: FC<SettingItem> = ({ children, title, description, column = false, titleSize = 18, childrenContainerStyle }) => {
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
        maxHeight: '100%',
        ':not(:last-child)': {
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }
      })}
    >
      <div>
        <div
          className={css({
            fontWeight: 600,
            fontSize: titleSize
          })}
        >
          {title}
        </div>
        {description && <div className={css({ fontSize: 13 })}>{description}</div>}
      </div>
      <Content flex centered={!column} style={childrenContainerStyle}>
        {children}
      </Content>
    </Content>
  )
}

export default SettingItem
