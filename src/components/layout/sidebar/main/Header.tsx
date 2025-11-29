import { ReactElement } from 'react'
import classnames from 'classnames'

export default ({
  name,
  onCollapse,
  extra,
  className
}: {
  name: string | ReactElement
  extra?: ReactElement
  onCollapse?: VoidFunction
  className?: string
}) => {
  return (
    <div className={classnames('button !py-1.5 flex items-center justify-between', className)} onClick={onCollapse}>
      <div className={'menu-sub-title'}>{name}</div>
      {extra}
    </div>
  )
}
