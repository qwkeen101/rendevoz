import * as React from 'react'
import { motion } from 'framer-motion'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'

const variants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 }
    }
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 }
    }
  }
}

export const MenuItem = React.forwardRef(
  (
    {
      children,
      onClick,
      style,
      className
    }: { className?: string; children: React.ReactNode; to?: string; onClick?: React.MouseEventHandler; style?: React.CSSProperties },
    ref: React.ForwardedRef<HTMLLIElement>
  ) => {
    return (
      <motion.li
        style={style}
        ref={ref}
        onClick={onClick}
        className={css([
          className,
          ClassName.ellipsisFont(1),
          ClassName.flatButton(),
          ClassName.flexLayout('center', 'flex-start'),
          {
            minWidth: 150,
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0
          }
        ])}
        variants={variants}
      >
        {children}
      </motion.li>
    )
  }
)
