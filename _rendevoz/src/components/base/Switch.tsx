import { useSetTheme, useTheme, useToggle } from '@/hooks'
import { CSSProperties, FC } from 'react'
import { motion } from 'framer-motion'
import { css } from '@emotion/css'

interface SwitchProps {
  onChange?: (value: boolean) => void
  defaultValue?: boolean
  width?: number
  height?: number
  value?: boolean
}
const spring = {
  type: 'spring',
  stiffness: 700,
  damping: 30
}
const SwitchClassName = css({
  width: 44,
  flexShrink: 0,
  height: 22,
  display: 'flex',
  borderRadius: 999,
  padding: 2,
  cursor: 'pointer',
  transition: 'background 0.3s ease',
  position: 'relative'
})
const Switch: FC<SwitchProps> = ({ onChange, defaultValue = false, value }) => {
  const [on, toggleOn] = useToggle(defaultValue)
  const { primaryColor } = useTheme('primaryColor')
  const realOn = value !== undefined ? value : on
  const switchStyle: CSSProperties = {
    backgroundColor: realOn ? primaryColor : '#00000040',
    justifyContent: realOn ? 'flex-end' : 'flex-start'
  }
  const handleStyle: CSSProperties = {
    width: 18,
    height: 18,
    backgroundColor: 'white',
    borderRadius: 999
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
      <motion.div style={handleStyle} layout transition={spring}></motion.div>
    </div>
  )
}

export default Switch
