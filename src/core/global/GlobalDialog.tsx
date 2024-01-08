import { memo, useState } from 'react'
import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { Content, Icon, Modal } from '@/components'
import { useTranslation } from 'react-i18next'
import { ClassName } from 'rendevoz'

export default memo(() => {
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState<{
    visible: boolean
    res?: any
  }>()
  const { t } = useTranslation()
  assignProperties(GlobalInstance, {
    dialogOps: {
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
  return (
    <Modal
      visible={!!open?.visible}
      onClose={() => {
        setOpen({ visible: false })
        open?.res?.(false)
      }}
    >
      <Content
        flex
        column
        gap={16}
        style={{
          padding: 16,
          width: 'min(90vw, 360px)'
        }}
      >
        <Content flex gap={12} alignItems={'center'}>
          <Icon name={'park-info'} size={18} />
          {message}
        </Content>
        <Content flex gap={16} alignItems={'center'}>
          <div
            className={ClassName.flatButton(undefined, undefined, undefined, true)}
            onClick={() => {
              setOpen({ visible: false })
              open?.res?.(false)
            }}
            style={{
              flex: 1,
              padding: '4px 12px',
              textAlign: 'center'
            }}
          >
            {t('footer.cancel')}
          </div>
          <div
            className={ClassName.selectButton()}
            style={{
              flex: 1,
              padding: '4px 12px',
              textAlign: 'center'
            }}
            onClick={() => {
              setOpen({ visible: false })
              open?.res?.(true)
            }}
          >
            {t('general.OK')}
          </div>
        </Content>
      </Content>
    </Modal>
  )
})
