import { Colors } from '@/consts'
import { Content, Icon } from '@/components'
import { CSSProperties, useRef } from 'react'
import { ClassName } from 'rendevoz'
type NumberInputProps = {
  onChange: (value: number) => void
  defaultValue: number
  min: number
  max: number
  step: number
  style?: CSSProperties
}
const NumberInput = ({ onChange, defaultValue, min, max, step = 1, style }: Partial<NumberInputProps>) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Content>
      <input
        ref={inputRef}
        type={'number'}
        max={max}
        min={min}
        defaultValue={defaultValue}
        onBlur={v => {
          const value = v.target.value
          const n = parseInt(value)
          let finalValue = n
          if (min !== undefined) {
            if (n < min) {
              finalValue = min
            }
          }
          if (max !== undefined) {
            if (n > max) {
              finalValue = max
            }
          }
          onChange?.(finalValue)
          v.target.value = `${finalValue}`
        }}
        style={{ background: 'transparent', border: 'none', width: 100, ...style }}
      />
      <Content flex column style={{ cursor: 'pointer', position: 'absolute', right: 0, top: 0, height: '100%' }}>
        <Icon
          className={ClassName.flatButton(4, 0)}
          name="park-up"
          onClick={() => {
            const v = inputRef.current?.value
            if (v) {
              const n = parseInt(v)
              const next = n + step
              if (max !== undefined && next <= max) {
                inputRef.current.value = `${next}`
              }
              onChange?.(next)
            }
          }}
        />
        <Icon
          name="park-down"
          className={ClassName.flatButton(4, 0)}
          onClick={() => {
            const v = inputRef.current?.value
            if (v) {
              const n = parseInt(v)
              const next = n - step
              if (min !== undefined && next >= min) {
                inputRef.current.value = `${next}`
              }
              onChange?.(next)
            }
          }}
        />
      </Content>
    </Content>
  )
}

export default NumberInput
