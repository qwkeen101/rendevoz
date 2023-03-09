import { FC } from 'react'
import styles from './index.module.less'
import classnames from 'classnames'
import Content from '../Content'
import { css } from '@emotion/css'
import { useTheme } from '@/hooks'
interface CommonItem {
  style?: React.CSSProperties
  className?: string
  separator?: React.ReactNode
}
interface ButtonItem {
  type: 'button'
  to?: never
  children: React.ReactNode
  onClick: () => void
}

export type BreadcrumbItemProps = CommonItem & ButtonItem

const BreadcrumbItem: FC<BreadcrumbItemProps> = ({ type, onClick, children, separator = '/', style, className }) => {
  const { primaryColor, defaultFontColorGrey } = useTheme('primaryColor', 'defaultFontColorGrey')
  const clazzName = classnames(className, styles.item, css({ color: primaryColor, ':hover': { color: defaultFontColorGrey } }))
  let item = null
  switch (type) {
    case 'button':
      item = (
        <span className={clazzName} style={style} onClick={onClick}>
          {children}
        </span>
      )
      break
    default:
      break
  }

  return (
    <Content flex alignItems="center">
      {item}
      {separator && (
        <span role="separator" className={css({ marginLeft: 4, color: primaryColor })}>
          {separator}
        </span>
      )}
    </Content>
  )
}

export default BreadcrumbItem
