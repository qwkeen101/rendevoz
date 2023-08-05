import { Colors } from '@/consts'
import { Content, Icon } from '@/components'
import { useRef } from 'react'
import { ClassName } from 'rendevoz'
type NumberInputProps = {
  onChange: (value: number) => void
  defaultValue: number
  min: number
  max: number
  step: number
}
const NumberInput = ({ onChange, defaultValue, min, max, step = 1 }: Partial<NumberInputProps>) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Content>
      <input
        ref={inputRef}
        defaultValue={defaultValue}
        onChange={v => {
          const value = v.target.value
          const n = parseInt(value)
          if (min !== undefined && n >= min) {
            onChange?.(n)
          }
          if (max !== undefined && n <= max) {
            onChange?.(n)
          }
        }}
        style={{ background: 'transparent', border: 'none', width: 100 }}
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
