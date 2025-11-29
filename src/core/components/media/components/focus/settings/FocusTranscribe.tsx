import { Icon } from '@/components'
import { memo } from 'react'

export default memo(() => {
  return (
    <div className='p-5 h-full flex flex-col'>
      <div className='flex items-center justify-between'>
        <div className='font-bold'>转录队列</div>
      </div>
      <div className='p-3 mt-5 border rounded-lg'>
        <div className='p-12 text-center font-size-12 py-24 transparent-font'>暂无正在转录的文件，点击下方转录按钮开始转录。</div>
      </div>
      <div className='font-size-12 mt-5 transparent-font'>
        使用Whisper模型对您的文件进行高质量字幕转录。当前支持对Youtube视频，互联网上可以下载的音频及本地文件进行转录。
      </div>
      <div className='mt-5 reverse-theme-button w-full !py-2 flex gap-3 justify-center items-center'>
        <Icon size={16} strokeWidth={5} name='park-acoustic' />
        开始转录
      </div>
    </div>
  )
})
