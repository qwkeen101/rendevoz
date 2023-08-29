import { useRef } from 'react'

const BetterInput = ({ onChange, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) => {
  const isCompo = useRef(false)
  return (
    <input
      {...rest}
      onChange={e => {
        if (!isCompo.current) {
          onChange?.(e)
        }
      }}
      onCompositionStart={() => (isCompo.current = true)}
      onCompositionEnd={e => {
        isCompo.current = false
        onChange?.(e)
      }}
    />
  )
}

export default BetterInput
