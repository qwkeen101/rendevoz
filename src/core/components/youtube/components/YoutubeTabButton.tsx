import classnames from 'classnames'

export default ({ isActive, name, onClick }: { isActive?: boolean; name: string; onClick: VoidFunction }) => {
  const tabClass = classnames('button font-medium !rounded-md !px-3 capitalize', isActive && 'reverse-theme-button')
  return (
    <div className={'bg-secondary rounded-md'}>
      <div onClick={onClick} className={tabClass}>
        {name}
      </div>
    </div>
  )
}
