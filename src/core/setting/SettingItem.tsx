import { Content } from '@/components/base'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { CSSProperties, FC, ReactNode } from 'react'
import { Select, Switch } from '@/components'
import classnames from 'classnames'
import UserService from '@/api/services/user.service'

export type ISettingItem = {
  title?: string
  description?: string
  column?: boolean
  titleSize?: number
  titleClassName?: string
  childrenContainerStyle?: CSSProperties
  containerClassName?: string
  focusKey?: string
  onClick?: VoidFunction
  isPro?: boolean
  extra?: ReactNode
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
      inputType?: 'number'
    }
  | {
      type?: 'title' | 'item'
      children?: ReactNode
    }
)
const SettingItem: FC<ISettingItem> = ({
  title,
  focusKey,
  description,
  column = false,
  onClick,
  titleClassName,
  containerClassName,
  titleSize = 14,
  isPro,
  childrenContainerStyle,
  extra,
  ...rest
}) => {
  const userPro = UserService.useIsUserPro(true)
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
    if (isPro && !userPro) return null
    if (rest.type === 'item' || rest.type === undefined) {
      return rest.children
    }
    if (rest.type === 'switch') {
      return <Switch value={rest.value} onChange={rest.onChange} />
    }
    if (rest.type === 'select') {
      return (
        <Select
          menuStyle={{
            maxHeight: 300,
            overflowY: 'auto'
          }}
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
          type={rest.inputType}
          placeholder={rest.placeholder}
          value={rest.value}
          onChange={e => {
            rest.onChange?.(e.target.value)
          }}
          className={'focus-input font-size-13 bg-input border-box-shadow rounded px-2 py-1'}
          style={{
            width: rest.width ?? (column ? '100%' : 240)
          }}
        />
      )
    }
  }
  return (
    <>
      <Content
        id={focusKey}
        onClick={onClick}
        flex
        column={column}
        alignItems={!column ? 'center' : undefined}
        justifyContent={!column ? 'space-between' : undefined}
        gap={column ? 6 : '10%'}
        className={classnames('min-h-[30px] max-h-full select-none', containerClassName)}
      >
        {(title || description) && (
          <div>
            {title && (
              <div
                style={{
                  fontSize: titleSize,
                  display: 'flex',
                  alignItems: 'center'
                }}
                className={titleClassName}
              >
                {title}
                {isPro && <span className={'font-size-10 rounded bg-yellow-500 ml-2 text-white px-1 leading-none py-[2px]'}>Pro</span>}
              </div>
            )}
            {description && <div className="font-size-12 transparent-font">{description}</div>}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: column ? 'column' : 'row',
            flexShrink: 0,
            ...childrenContainerStyle
          }}
        >
          {renderChildren()}
        </div>
      </Content>
      {extra}
    </>
  )
}

export default SettingItem
