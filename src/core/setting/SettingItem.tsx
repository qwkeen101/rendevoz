import { Content } from '@/components/base'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { CSSProperties, FC, ReactNode } from 'react'

export type ISettingItem = {
  children?: ReactNode
  title: string
  description?: string
  column?: boolean
  titleSize?: number
  childrenContainerStyle?: CSSProperties
  type?: 'title' | 'item'
}
const SettingItem: FC<ISettingItem> = ({
  children,
  title,
  description,
  column = false,
  titleSize = 15,
  type = 'item',
  childrenContainerStyle
}) => {
  if (type === 'title') {
    return (
      <div
        style={{
          fontWeight: 500,
          fontSize: titleSize
        }}
      >
        {children}
      </div>
    )
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
        maxHeight: '100%'
      })}
    >
      <div>
        <div
          style={{
            fontWeight: 500,
            fontSize: titleSize
          }}
        >
          {title}
        </div>
        {description && <div className={ClassName.description('12px')}>{description}</div>}
      </div>
      <Content flex centered={!column} style={{ fontSize: 14, flexShrink: 0, ...childrenContainerStyle }}>
        {children}
      </Content>
    </Content>
  )
}

export default SettingItem
