import { Icon, Modal } from '@/components'
import { useState } from 'react'

export default ({ description, url }: { description?: string; url: string }) => {
  const [visible, setVisible] = useState(false)
  const renderModal = () => (
    <Modal
      visible={visible}
      onClose={() => {
        setVisible(false)
      }}
    >
      <div className={'relative overflow-hidden'}>
        <div className={'p-6 w-[90vw] max-h-[80vh] flex flex-col gap-4 overflow-y-auto no-scrollbar max-w-xl relative overflow-hidden'}>
          {description && (
            <div>
              <div className={'font-bold text-xl mb-2'}>About</div>
              <div className={'w-full whitespace-pre-wrap'}>{description}</div>
            </div>
          )}
          <div>
            <div className={'font-bold text-xl mb-2'}>Details</div>
            <div className={'flex items-center gap-2'}>
              <Icon name={'park-link'} />
              <a className={'primary-font line-clamp-1 break-all'} target={'_blank'} href={url}>
                {url}
              </a>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )

  const renderMore = () => {
    return (
      <span onClick={() => setVisible(true)} className={'primary-font cursor-pointer font-semibold'}>
        ...more
      </span>
    )
  }

  return {
    renderMore,
    renderModal,
    open: () => setVisible(true)
  }
}
