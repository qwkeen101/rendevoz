import { Content, Icon } from '@/components'
import { CreditToYuan } from '@/api/services/ai/AI.service'
import { memo, useEffect, useRef, useState } from 'react'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { AIService } from '@/api/services'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { useToggle } from '@/hooks'
import WeixinPay from '@/components/WeixinPay'
import UserService from '@/api/services/user.service'
import toast from 'react-hot-toast'
import { css } from '@emotion/css'
import classnames from 'classnames'
import CommonService from '@/api/services/common.service'
import trans from '@/consts/trans'

export default memo(() => {
  const [selectedPlan, setSelectedPlan] = useState<string>('200')
  const [qrcode, setqrcode] = useState('')
  const [modalV, toggleModalV] = useToggle(false)
  const [orderId, setOrderId] = useState<string>()
  const { t } = useTranslation()
  const checkOrderDetails = async (toastFail = false) => {
    if (orderId) {
      try {
        const state = await CommonService.checkPayOrder(orderId)
        if (state === 'SUCCESS') {
          setOrderId(undefined)
          setqrcode('')
          toast.success(t(trans.Success.PaymentSuccessful))
          setTimeout(() => {
            UserService.getUserDetails()
          }, 1000)
          toggleModalV(false)
          return
        }
      } catch (e) {
        console.error(e)
      }
      if (toastFail) {
        toast.error(t(trans.Errors.PaymentUnsuccessful))
      }
    }
  }
  useEffect(() => {
    if (orderId) {
      const interval = setInterval(async () => {
        checkOrderDetails()
      }, 3000)
      return () => {
        clearInterval(interval)
      }
    }
  }, [orderId])
  const canBuy = UserService.useIsUserPro(true)
  return (
    <div className={'p-6 w-[90vw] max-w-xl'}>
      <div className={'font-bold gap-2 flex text-2xl mb-1.5'}>
        <Icon
          className={css({
            svg: {
              fill: 'url(#aigradient)'
            }
          })}
          name={'custom-stars'}
        />
        <span
          style={{
            backgroundImage: 'linear-gradient(270deg,#794aff,#0a7bff)',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          {t('settings.AI can be your study copilot')}
        </span>
      </div>
      <div className={'transparent-font font-size-13'}>
        AI可以为您总结视频，PDF，网页与文档，快速提炼要点并生成导图，是您最好的学习助手。（100点数 ≈ 总结20个视频 / 转录30分钟音频）
      </div>
      <div className={'transparent-font'}></div>
      <div className={'grid grid-cols-3 gap-4 mt-5'}>
        {Object.entries(CreditToYuan).map((i, idx) => (
          <div
            className={classnames(
              'border grow transition-all p-4 items-center rounded-lg flex flex-col cursor-pointer',
              selectedPlan === i[0] && 'select-color-border select-color-font select-color-super-transparent-bg'
            )}
            onClick={() => setSelectedPlan(i[0])}
            key={i[0]}
          >
            <div className={'whitespace-nowrap shrink-0 font-bold'}>
              <span className={'font-size-16'}>{i[0]}</span> <span className={'font-size-13'}>{t('settings.Credits')}</span>
            </div>
            <div className={classnames('font-medium font-size-13', selectedPlan === i[0] ? 'select-color-font' : 'transparent-font')}>
              ¥ {i[1]}
            </div>
          </div>
        ))}
      </div>
      {selectedPlan !== undefined && (
        <div
          style={{
            padding: 1
          }}
          onClick={() => {
            if (canBuy) {
              AIService.buyAICredit(Number(selectedPlan)).then(res => {
                setOrderId(res.orderId)
                setqrcode(res.code)
                toggleModalV()
              })
            }
          }}
        >
          <div className={'select-button text-center text-lg font-medium !py-2 !rounded-lg mt-6'}>
            <div>{canBuy ? t('settings.Select plan') : t('settings.Subscribe to buy AI credits')}</div>
          </div>
        </div>
      )}
      <WeixinPay
        visible={modalV}
        onClose={toggleModalV}
        code={qrcode}
        onSubmit={() => {
          checkOrderDetails(true)
        }}
      />
    </div>
  )
})
