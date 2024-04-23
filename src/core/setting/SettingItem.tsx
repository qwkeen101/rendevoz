import { Content } from '@/components/base'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { CSSProperties, FC, ReactNode } from 'react'
import { Select, Switch } from '@/components'

export type ISettingItem = {
  title?: string
  description?: string
  column?: boolean
  titleSize?: number
  childrenContainerStyle?: CSSProperties
} & (
  | {
      type: 'select'
      options: { value: string; children: string }[]
      onChange?: (v: string) => void
      value?: string
    }
  | {
      type: 'switch'
      value: boolean
      onChange: (v: boolean) => void
    }
  | {
      type: 'input'
      value?: string
      placeholder?: string
      onChange?: (v: string) => void
    }
  | {
      type?: 'title' | 'item'
      children?: ReactNode
    }
)
const SettingItem: FC<ISettingItem> = ({ title, description, column = false, titleSize = 15, childrenContainerStyle, ...rest }) => {
  if (rest.type === 'title') {
    return (
      <div
        style={{
          fontWeight: 500,
          fontSize: titleSize
        }}
      >
        {rest.children}
      </div>
    )
  }
  const renderChildren = () => {
    if (rest.type === 'item' || rest.type === undefined) {
      return rest.children
    }
    if (rest.type === 'switch') {
      return <Switch value={rest.value} onChange={rest.onChange} />
    }
    if (rest.type === 'select') {
      return (
        <Select
          onSelect={v => {
            rest.onChange?.(v[0])
          }}
          options={rest.options}
          value={rest.value}
        />
      )
    }
    if (rest.type === 'input') {
      return (
        <input
          spellCheck={'false'}
          placeholder={rest.placeholder}
          value={rest.value}
          onChange={e => {
            rest.onChange?.(e.target.value)
          }}
          className={'focus-input border-box-shadow'}
          style={{
            borderRadius: 4,
            padding: '3px 8px'
          }}
        />
      )
    }
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
        {title && (
          <div
            style={{
              fontWeight: 500,
              fontSize: titleSize
            }}
          >
            {title}
          </div>
        )}
        {description && <div className={ClassName.description('12px')}>{description}</div>}
      </div>
      <Content flex centered={!column} style={{ fontSize: 14, flexShrink: 0, ...childrenContainerStyle }}>
        {renderChildren()}
      </Content>
    </Content>
  )
}

export default SettingItem
