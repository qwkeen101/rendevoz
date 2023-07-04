import { CSSProperties, Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react'
import Content from './Content'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { useMeasure } from 'react-use'
import useToggle from '@/hooks/utils/useToggle'
import ClassName from '@/styles/classNames'
import React from 'react'

interface PanelProps {
  title: string | React.ReactNode | ((set: Dispatch<SetStateAction<boolean>>) => ReactNode)
  children: React.ReactNode
  style?: React.CSSProperties
  defaultVisible?: boolean
  className?: string
  childrenStyle?: CSSProperties
  titleContainerStyle?: CSSProperties
  overflow?: 'hidden' | 'auto' | 'visible'
}
const variants = {
  open: {
    opacity: 1,
    height: 'auto'
  },
  hide: {
    opacity: 0,
    height: 0
  }
}
const Panel: React.FC<PanelProps> = ({
  title,
  children,
  style,
  defaultVisible = true,
  className,
  titleContainerStyle,
  overflow = 'hidden',
  childrenStyle
}) => {
  const [hide, toggle] = useState(!defaultVisible)
  const [duration, setDuration] = useState(0.3)
  const [ref, { height }] = useMeasure()
  useEffect(() => {
    setDuration(getAutoHeightDuration(height) / 1000)
  }, [height])
  return (
    <Content fullWidth flex column style={style} className={className}>
      <Content flex alignItems="center" justifyContent="space-between" style={titleContainerStyle}>
        {typeof title === 'function' ? (
          title(toggle)
        ) : (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              toggle(s => !s)
            }}
          >
            {title}
          </div>
        )}
        <Icon cursor="pointer" name={hide ? 'park-down' : 'park-up'} onClick={() => toggle(s => !s)} className={ClassName.circleButton()} />
      </Content>
      <motion.div
        inherit={false}
        style={{ overflow, ...childrenStyle }}
        ref={ref}
        initial={hide ? 'hide' : 'open'}
        animate={hide ? 'hide' : 'open'}
        variants={variants}
        transition={{ ease: 'easeOut', duration: duration }}
      >
        {children}
      </motion.div>
    </Content>
  )
}
function getAutoHeightDuration(height: number) {
  if (!height) {
    return 0
  }
  const constant = height / 36
  const duration = Math.round((4 + 15 * constant ** 0.25 + constant / 5) * 10)
  return duration
}
export default Panel
