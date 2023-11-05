import { useTheme, useToggle } from '@/hooks'
import { CSSProperties, FC } from 'react'
import { motion } from 'framer-motion'
import { css } from '@emotion/css'
import { Colors } from '@/consts'

interface SwitchProps {
  onChange?: (value: boolean) => void
  defaultValue?: boolean
  width?: number
  height?: number
  value?: boolean
  small?: boolean
}
const spring = {
  type: 'spring',
  stiffness: 700,
  damping: 30
}
const SwitchClassName = css({
  flexShrink: 0,
  display: 'flex',
  borderRadius: 999,
  padding: 2,
  cursor: 'pointer',
  transition: 'background 0.3s ease',
  position: 'relative'
})
const Switch: FC<SwitchProps> = ({ onChange, defaultValue = false, value, small }) => {
  const [on, toggleOn] = useToggle(defaultValue)
  const realOn = value !== undefined ? value : on
  const switchStyle: CSSProperties = {
    backgroundColor: realOn ? Colors.Common.SelectColor : '#00000040',
    // justifyContent: realOn ? 'flex-end' : 'flex-start',
    height: small ? 16 : 22,
    width: small ? 32 : 44,
    position: 'relative'
  }
  const handleStyle: CSSProperties = {
    width: small ? 12 : 18,
    height: small ? 12 : 18,
    backgroundColor: 'white',
    borderRadius: 999,
    flexShrink: 0
  }
  return (
    <div
      className={SwitchClassName}
      onClick={() => {
        toggleOn()
        onChange?.(!on)
      }}
      style={switchStyle}
    >
      <div
        style={{
          width: realOn ? '100%' : 0,
          transition: 'width 0.25s ease'
        }}
      ></div>
      <div style={handleStyle}></div>
    </div>
  )
}

export default Switch
