import { Content, Switch } from '@/components'
import { ClassName } from 'rendevoz'
import { CSSProperties } from 'react'
import classnames from 'classnames'

export default ({
  value,
  onChange,
  name,
  style,
  className,
  disableButtonStyle = false
}: {
  value: boolean
  onChange: (v: boolean) => void
  name: string
  style?: CSSProperties
  disableButtonStyle?: boolean
  className?: string
}) => {
  return (
    <Content
      onClick={() => {
        if (disableButtonStyle) return
        onChange(!value)
      }}
      style={style}
      flex
      alignItems={'center'}
      justifyContent={'space-between'}
      className={classnames(!disableButtonStyle && ClassName.flatButton(), className)}
    >
      <div>{name}</div>
      <Switch value={value} onChange={onChange} small={true} />
    </Content>
  )
}
