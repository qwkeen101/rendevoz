import classnames from 'classnames'
import { memo } from 'react'

export default memo(({ isActive, name, onClick }: { isActive?: boolean; name: string; onClick: VoidFunction }) => {
  const tabClass = classnames(
    'icon-button font-medium !rounded-md !px-3 capitalize',
    isActive ? 'reverse-theme-button' : 'transparent-font'
  )
  return (
    <div className={'rounded-md'}>
      <div onClick={onClick} className={tabClass}>
        {name}
      </div>
    </div>
  )
})
