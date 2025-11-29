import { memo, useState } from 'react'
import { TabPane, Tabs } from '@/components'
import FileUploader from '@/core/components/group/components/popupRenderer/FileUploader'

export default memo(() => {
  const [mode, setMode] = useState<'web' | 'local'>('web')
  return (
    <div className='p-5 flex-1 flex flex-col'>
      <div className='font-size-12 transparent-font mb-5'>支持导入SRT与VTT格式的字幕。</div>
      <FileUploader style={{ flex: '1', flexDirection: 'column', display: 'flex' }} uploadClassName='flex-1 w-full' />
    </div>
  )
})
