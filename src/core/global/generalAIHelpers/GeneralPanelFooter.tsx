import { Button, Icon } from '@/components'
import { Icons } from '@/consts'
import { memo } from 'react'

const GeneralPanelFooter = memo(({ on }: { on?: (type: 'copy' | 'addAsObject' | 'tag' | 'moveTo') => void }) => {
  return (
    <div className={'flex gap-3 justify-between flex-wrap items-center'} style={{ padding: '0px 12px' }}>
      <Button.IconButton icon={'park-notes'} text={'保存为笔记'} className={'border-round-icon-button'} />
      <div className={'flex gap-3 items-center'}>
        <Icon onClick={() => on?.('copy')} name={Icons.Copy} tooltip={'复制'} className={'border-rounded-button !p-2'} />
        <Icon
          onClick={() => on?.('addAsObject')}
          name={Icons.AddAsObject}
          tooltip={'添加为实体'}
          className={'border-rounded-button !p-2'}
        />
        <Icon onClick={() => on?.('tag')} name={Icons.Tag} className={'border-rounded-button !p-2'} />
        <Icon onClick={() => on?.('moveTo')} name={Icons.MoveTo} className={'border-rounded-button !p-2'} />
      </div>
    </div>
  )
})

export default GeneralPanelFooter
