import { MouseEventHandler } from 'react'

const Link = ({ onClick }: { onClick: MouseEventHandler }) => {
  return <div onClick={onClick} className={'w-full h-full transition-colors cursor-pointer hover-bg-super-transparent-select-color'}></div>
}

export default Link
