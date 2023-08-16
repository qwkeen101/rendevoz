import { Content } from '@/components/base'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { CSSProperties, FC, ReactNode } from 'react'

type SettingItem = {
  children?: ReactNode
  title: string
  description?: string
  column?: boolean
  titleSize?: number
  childrenContainerStyle?: CSSProperties
  type?: 'title' | 'item'
}
const SettingItem: FC<SettingItem> = ({
  children,
  title,
  description,
  column = false,
  titleSize = 18,
  type = 'item',
  childrenContainerStyle
}) => {
  if (type === 'title') {
    return <div className={ClassName.title(FontSize['18px'])}>{children}</div>
  }
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
          borderBottom: `1px solid ${Colors.Background.Border}`
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
