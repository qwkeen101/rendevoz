import { CSSProperties } from 'react'
import { Content, Icon } from '@/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'

type Props = {
  value: string
  options: string[]
  name?: string
  icon?: string
  onChange?: (v: string) => void
  style?: CSSProperties
  buttonSize?: number
}
function ButtonChooser({ value, options, name, icon, onChange, style, buttonSize = 16 }: Props) {
  const realValue = value || options[0]
  return (
    <Content flex alignItems={'center'} gap={8} style={style}>
      {icon && <Icon size={16} containerStyle={{ color: Colors.Font.Transparent }} name={icon} />}
      {name && <div>{name}</div>}
      <Content flex gap={6} alignItems={'center'} style={{ marginLeft: 'auto' }}>
        <div style={{ color: Colors.Font.Transparent, fontSize: 12 }}>{realValue}</div>
        <Content flex gap={3}>
          <Icon
            size={buttonSize}
            className={ClassName.flatButton(4, '4px', undefined, true)}
            name={'park-minus'}
            onClick={() => {
              const currentIndex = options.findIndex(i => i === realValue)
              const nextIndex = currentIndex - 1
              const next = Math.max(0, nextIndex)
              onChange?.(options[next])
            }}
          />
          <Icon
            size={buttonSize}
            className={ClassName.flatButton(4, '4px', undefined, true)}
            name={'park-plus'}
            onClick={() => {
              const currentIndex = options.findIndex(i => i === realValue)
              const nextIndex = currentIndex + 1
              const next = Math.min(nextIndex, options.length - 1)
              onChange?.(options[next])
            }}
          />
        </Content>
      </Content>
    </Content>
  )
}

export default ButtonChooser
