import { Icon, IconWithPopover, WithBorder } from '@/components'
import { Icons } from '@/consts'
import { useState } from 'react'
import RSSIcon from './RSSIcon'
import classNames from 'classnames'
import useFeedInstance from '../hooks/useFeedInstance'

export default ({ size = 20 }: { size?: number }) => {
  const [createVisible, setCreateVisible] = useState(false)
  const instance = useFeedInstance()
  return (
    <IconWithPopover
      placement={['bottom']}
      align='start'
      onVisiblityChange={v => setCreateVisible(v)}
      content={setV => (
        <WithBorder className='py-2 w-64 select-none'>
          <div
            onClick={() => {
              instance.folderOps?.createFolder()
              setV(false)
            }}
            className='p-3 group flex items-center gap-4 light-hover'
          >
            <Icon
              className='group-hover:rotate-6 group-hover:scale-[1.1] transition-all group-hover:text-green-400'
              name={Icons.Folder}
              size={20}
            />
            <div>文件夹</div>
          </div>
          <div
            onClick={() => {
              instance.importRSS?.()
              setV(false)
            }}
            className='p-3 flex group light-hover items-center gap-4'
          >
            <RSSIcon className='group-hover:rotate-6 group-hover:scale-[1.1] transition-all group-hover:text-orange-400' size={20} />
            <div>导入RSS订阅</div>
          </div>
        </WithBorder>
      )}
      size={size}
      className={classNames('hover-active-button', createVisible && 'rotate-45', '!transition-transform')}
      name={Icons.Create}
    />
  )
}
