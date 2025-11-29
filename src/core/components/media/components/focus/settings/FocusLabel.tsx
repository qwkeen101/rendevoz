import classnames from 'classnames'
import FocusSettingsConsts from './FocusSettingsConsts'
import { Icon } from '@/components'
import { memo } from 'react'

export default memo(() => {
  const CLASS = 'p-3 gap-3 flex items-center cursor-pointer'
  const SIZE = 18
  const renderSelect = FocusSettingsConsts.renderSelect
  return (
    <div
      style={{
        color: 'rgba(255, 255, 255, 0.8)'
      }}
      className='p-5'
    >
      <div className='border rounded-lg reader-subtitle'>
        <div className={classnames(CLASS, 'border-bottom')}>
          <div className='label-highlight'>Text</div>
          <div>背景高亮</div>
          {renderSelect(true)}
        </div>
        <div className={classnames(CLASS, 'border-bottom')}>
          <div className='label-underline'>Text</div>
          <div>下划线</div>
          {renderSelect()}
        </div>
        <div className={classnames(CLASS, 'border-bottom')}>
          <div className='label-font-highlight'>Text</div>
          <div>字体高亮</div>
          {renderSelect()}
        </div>
        <div className={classnames(CLASS, 'border-bottom')}>
          <div className='label-border-highlight'>Text</div>
          <div>边框高亮</div>
          {renderSelect()}
        </div>
        <div className={CLASS}>
          <div>Text</div>
          <div>无特殊样式</div>
          {renderSelect()}
        </div>
      </div>
      <div className='transparent-font mt-5 font-size-12'>添加的标注会以高亮的方式在字幕中显示。</div>
    </div>
  )
})
