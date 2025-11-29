import { CSSProperties, useEffect, useRef } from 'react'

const CheckBox = ({
  checked,
  onChange,
  style,
  className,
  indeterminate
}: {
  checked?: boolean
  onChange?: (checked: boolean) => void
  style?: CSSProperties
  className?: string
  indeterminate?: boolean
}) => {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const ele = ref.current
    if (ele) {
      ele.indeterminate = indeterminate ?? false
    }
  }, [indeterminate])
  return (
    <input
      ref={ref}
      onChange={() => onChange?.(!checked)}
      className={className}
      type={'checkbox'}
      checked={checked}
      style={{ width: 14, height: 14, cursor: 'pointer', ...style }}
    />
  )
}

export default CheckBox
