import { ForwardedRef, forwardRef, useEffect, useRef } from 'react'
import { useMergedRef } from '@/hooks'

const BetterInput = forwardRef(
  ({ onChange, value, ...rest }: React.InputHTMLAttributes<HTMLInputElement>, ref: ForwardedRef<HTMLInputElement>) => {
    const isCompo = useRef(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const mergedRef = useMergedRef(inputRef, ref)
    useEffect(() => {
      if (value !== undefined) {
        const ele = inputRef.current
        if (ele) {
          ele.value = value
        }
      }
    }, [value])
    return (
      <input
        ref={mergedRef}
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
)
export default BetterInput
