import { memo, useState } from 'react'
import { assignProperties } from '@/utils'
import { Icon, Modal } from '@/components'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'

export default memo(() => {
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState<{
    visible: boolean
    res?: any
  }>()
  assignProperties(Global, {
    dialogOps: {
      ...Global.dialogOps,
      confirm: message => {
        return new Promise(res => {
          setMessage(message)
          setOpen({
            visible: true,
            res
          })
        })
      }
    }
  })
  const { t } = useTranslation()
  return (
    <Modal
      visible={!!open?.visible}
      onClose={() => {
        setOpen({ visible: false })
        open?.res?.(false)
      }}
    >
      <div
        className={'flex flex-col p-6 pb-3 items-center'}
        style={{
          width: 'min(90vw, 360px)'
        }}
      >
        <Icon name={'park-caution'} size={40} className={'text-yellow-500 mb-3'} theme={'filled'} />
        <div className={'text-xl font-semibold mb-1 text-yellow-500'}>{message}</div>
        <div className={'transparent-font text-center'}>{t('general.This action cannot be undone')}</div>
        <div
          onClick={() => {
            setOpen({ visible: false })
            open?.res?.(true)
          }}
          className={
            'bg-yellow-500 text-white rounded-lg cursor-pointer hover:bg-opacity-90 transition-colors flex gap-2 items-center justify-center w-full mt-3 !py-1.5 text-center font-medium'
          }
        >
          {t(trans.Continue)}
        </div>
        <div
          className={'button transparent-font w-fit mt-2 text-center font-medium'}
          onClick={() => {
            setOpen({ visible: false })
            open?.res?.(false)
          }}
        >
          {t(trans.Cancel)}
        </div>
      </div>
    </Modal>
  )
})
