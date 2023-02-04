import { Children, cloneElement, FC } from 'react'
import BreadcrumbItem from './BreadcrumbItem'
import classNames from 'classnames'
import styles from './index.module.less'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'

export interface BreadcrumbProps {
  separator?: React.ReactNode
  style?: React.CSSProperties
  className?: string
  children: React.ReactNode
}

interface IBreadcrumb extends FC<BreadcrumbProps> {
  Item: typeof BreadcrumbItem
}

const Breadcrumb: IBreadcrumb = ({ separator = '/', style, className, children }) => {
  const { primaryColor } = useTheme('primaryColor')
  const clazzName = classNames(styles.breadcrumb, css({ color: primaryColor }), className)
  let crumbs
  if (children) {
    crumbs = Children.toArray(children).map((item, index) => {
      if (!item) {
        return item
      }
      return cloneElement(item, {
        separator: item.props?.separator ?? separator,
        key: index
      })
    })
  }
  return (
    <nav style={style} className={clazzName}>
      <ol>{crumbs}</ol>
    </nav>
  )
}

Breadcrumb.Item = BreadcrumbItem

export default Breadcrumb
