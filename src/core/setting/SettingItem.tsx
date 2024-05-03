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
      width?: number
      placeholder?: string
      onChange?: (v: string) => void
    }
  | {
      type?: 'title' | 'item'
      children?: ReactNode
    }
)
const SettingItem: FC<ISettingItem> = ({ title, description, column = false, titleSize = 14, childrenContainerStyle, ...rest }) => {
  if (rest.type === 'title') {
    return (
      <div
        style={{
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
            padding: '4px 8px',
            fontSize: 13,
            width: rest.width ?? 240
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
      gap={column ? 6 : '10%'}
      className={css({
        userSelect: 'none',
        maxHeight: '100%',
        minHeight: 30
      })}
    >
      <div>
        {title && (
          <div
            style={{
              fontSize: titleSize
            }}
          >
            {title}
          </div>
        )}
        {description && <div className="font-size-12 transparent-font">{description}</div>}
      </div>
      <div style={{ fontSize: 14, display: 'flex', flexDirection: column ? 'column' : 'row', flexShrink: 0, ...childrenContainerStyle }}>
        {renderChildren()}
      </div>
    </Content>
  )
}

export default SettingItem
