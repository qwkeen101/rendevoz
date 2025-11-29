import { Icon } from '@/components'
import { GlobalSetting } from '@/core'
import Colors from '@/consts/colors'
import { memo, useEffect, useState } from 'react'
import wechatpay from '@/assets/wechatpay.png'
import { css } from '@emotion/css'
import UpgradeService from '@/api/services/upgrade.service'
import QRCode from 'qrcode'
import { toast } from 'react-hot-toast'
import WeixinPay from '@/components/WeixinPay'
import UserService from '@/api/services/user.service'
import classnames from 'classnames'
import CommonService from '@/api/services/common.service'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { Icons } from '@/consts'
import { DateFormat } from '@/utils'

const plans: Record<
  string,
  {
    pricing: number
    text: string
    yearPricing?: number
    features: string[]
    isFire?: boolean
    isPro?: boolean
    description: string
  }
> = {
  free: {
    text: '免费版',
    pricing: 0,
    description: '免费使用，适用于轻度知识爱好者',
    features: ['最多创建100个实体', '超过创建限制后仍可以编辑一切资料', '使用受限的功能']
  },
  pro: {
    isPro: true,
    text: '专业版',
    pricing: 15,
    yearPricing: 158,
    description: '为知识爱好者而生',
    features: [
      '解锁全部本地功能，无限制使用',
      '不限额网页，文档，视频与PDF翻译',
      '解锁云端同步，AI对话与文字识别等功能',
      '每月免费获得2000AI点数',
      '优先客户支持服务'
    ]
  },
  lifetime: {
    text: '终身版',
    pricing: 328,
    description: '一次付费，终身使用',
    isFire: true,
    features: ['永久解锁现有与后续全部功能', '优先体验新内容', '优先客户支持服务', '赠送 10000 AI点数']
  }
}

export default memo(() => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'lifetime' | 'pro'>('lifetime')
  const [setting] = GlobalSetting.useSetting()
  const [upgradeDetails, setUpgradeDetails] = useState<{
    method: 'monthly' | 'yearly' | 'lifetime'
    count: number
    qrcodeStr?: string
    qrcodeImgData?: string
    loading?: 'none' | 'getQrcode' | 'loadUserDetails'
  }>({
    method: 'lifetime',
    count: 1
  })
  const [user] = UserService.useUser()
  const { t } = useTranslation()
  const isPro = UserService.useIsUserPro(false)
  const isLifetime = UserService.useIsUserLifetime()
  const currentPlans = []
  if (isLifetime) {
    currentPlans.push(t(trans.Settings.LifetimePlan))
  }
  if (isPro) {
    currentPlans.push(t(trans.Settings.ProPlan))
  }
  if (!isPro && !isLifetime) {
    currentPlans.push(t(trans.Settings.FreePlan))
  }
  if (setting.general.language === 'en-US') {
    return (
      <div className={'flex w-full text-xl h-full items-center justify-center'}>
        Subscription is not avaliable outside China mainland right now.
      </div>
    )
  }

  useEffect(() => {
    if (upgradeDetails.qrcodeStr) {
      QRCode.toDataURL(document.createElement('canvas'), upgradeDetails.qrcodeStr).then(data =>
        setUpgradeDetails(s => ({ ...s, qrcodeImgData: data }))
      )
    }
  }, [upgradeDetails.qrcodeStr])
  const desc =
    isPro && user?.premiumEndDate
      ? `${t(trans.Settings.SubEndDate)}: ${DateFormat.format(user.premiumEndDate, DateFormat.Formats.yearMonthDays)}`
      : !isPro && !isLifetime
        ? t(trans.Settings.FreePlanDesc)
        : ''
  const alreadyPro = isPro || isLifetime
  const canSub = true
  return (
    <div className={'w-full @container pt-4'}>
      <div className={'font-bold text-2xl mb-3'}>{t(trans.Settings.CurrentPlan)}</div>
      <div className={classnames('font-medium text-lg flex items-center gap-2', alreadyPro && 'text-yellow-500')}>
        {currentPlans.join(', ')}
        {alreadyPro && <Icon name={'park-vip'} theme={'filled'} />}
      </div>
      {desc && <div className={'transparent-font mt-1 font-size-12'}>{desc}</div>}
      <div className={'font-bold text-2xl mb-4 mt-6'}>{canSub ? '选择订阅' : '全部订阅'}</div>
      <div className={'grid @2xl:grid-cols-3 gap-6 @lg:grid-cols-2 grid-cols-0'}>
        {Object.entries(plans).map(([key, value]) => (
          <div onClick={() => setSelectedPlan(key)} className={classnames('cursor-pointer rounded-xl p-6 border')} key={key}>
            <div className={'flex items-center justify-between'}>
              <div className={'font-bold gap-2 capitalize text-2xl flex items-center'}>
                {value.isFire && <Icon className={'text-orange-400'} theme={'filled'} name={'park-fire'} />}
                {value.isPro && <Icon className={'text-blue-400'} theme={'filled'} name={'park-lightning'} />}
                <span className={value.isFire ? 'text-orange-400' : value.isPro ? 'text-blue-400' : undefined}>{value.text}</span>
              </div>
              {canSub && (
                <div className={classnames('size-5 rounded-full p-1 border', selectedPlan === key && 'primary-border-color')}>
                  <div className={classnames('w-full h-full rounded-full', selectedPlan === key && 'bg-black dark:bg-white')}></div>
                </div>
              )}
            </div>
            <div className={'transparent-font text-sm mt-1'}>{value.description}</div>
            <div className={'mt-3 mb-3 gap-0.5 flex items-end'}>
              {key === 'lifetime' ? (
                <span className={'font-bold text-3xl'}>¥{value.pricing}</span>
              ) : (
                <>
                  <span className={'font-bold text-3xl'}>¥{value.pricing}</span>
                  <span className={'text-lg font-medium'}>/月</span>
                </>
              )}
              {value.yearPricing && (
                <span className={'bg-border h-fit ml-2 w-fit font-medium rounded-full px-3 py-0.5'}>年付 ¥{value.yearPricing}</span>
              )}
            </div>
            <div className={'flex flex-col gap-2'}>
              {value.features.map(i => (
                <div className={'flex gap-2 text-sm'} key={i}>
                  <Icon name={'park-check'} />
                  <span>{i}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {canSub && <PricingCalculator type={selectedPlan} />}
    </div>
  )
})

const PricingCalculator = ({ type }: { type: 'lifetime' | 'pro' | 'free' }) => {
  const [upgradeState, setUpgradeState] = useState<{
    method?: 'monthly' | 'yearly'
    qrcodeStr?: string
    isLoading?: boolean
    orderId?: string
  }>({
    method: 'monthly'
  })
  const { method, orderId, isLoading } = upgradeState
  const { t } = useTranslation()
  const checkOrderDetails = async (toastFail = false) => {
    if (orderId) {
      try {
        const state = await CommonService.checkPayOrder(orderId)
        if (state === 'SUCCESS') {
          setUpgradeState(s => ({ ...s, orderId: undefined, qrcodeStr: undefined, isLoading: false }))
          toast.success(t(trans.Success.PaymentSuccessful))
          GlobalSetting.focusSetting('subscription')
          setTimeout(() => {
            UserService.getUserDetails()
          }, 1000)
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
  const getPrice = () => {
    const { method = 'monthly' } = upgradeState
    if (type === 'lifetime') return 328
    if (type === 'pro') {
      if (method === 'monthly') {
        return 15
      }
      if (method === 'yearly') {
        return 158
      }
    }
    if (type === 'free') {
      return 0
    }
    return 0
  }
  const pricing = getPrice()
  if (pricing === 0) return null
  return (
    <div className={'mt-7 flex flex-col gap-3 w-full'}>
      {type === 'pro' && (
        <div className={'flex p-1 -mt-1 mb-1 bg-third rounded w-fit font-medium gap-2'}>
          <div
            onClick={() => setUpgradeState(s => ({ ...s, method: 'monthly' }))}
            className={classnames('rounded px-6 cursor-pointer py-1.5', method === 'monthly' ? 'bg-border' : 'transparent-font')}
          >
            按月订阅
          </div>
          <div
            onClick={() => setUpgradeState(s => ({ ...s, method: 'yearly' }))}
            className={classnames('rounded px-6 cursor-pointer py-1.5', method === 'yearly' ? 'bg-border' : 'transparent-font')}
          >
            按年订阅
          </div>
        </div>
      )}
      <div className={'flex gap-8 items-center'}>
        <div className={'text-2xl font-bold'}>
          总计费用: <span className={'ml-2'}>¥{pricing}</span>
        </div>
        {pricing > 0 ? (
          <div
            onClick={() => {
              setUpgradeState(s => ({ ...s, isLoading: true }))
              UpgradeService.upgradeSub(type === 'lifetime' ? 'lifetime' : method ?? 'monthly')
                .then(res => {
                  setUpgradeState(s => ({ ...s, orderId: res.orderId, qrcodeStr: res.code, isLoading: false }))
                })
                .catch(() => {
                  setUpgradeState(s => ({ ...s, isLoading: false }))
                })
            }}
            className={
              'border-round-button text-green-600 hover:!bg-green-100 hover:dark:!bg-green-900 hover:!bg-opacity-60 hover:dark:!bg-opacity-40 !border-green-600 flex font-medium !px-5 gap-3'
            }
          >
            {isLoading ? <Icon name={Icons.Loading} spin size={18} /> : <img src={wechatpay} className={'w-6 object-cover'} />}
            立即支付
          </div>
        ) : null}
      </div>
      <Details />
      <WeixinPay
        code={upgradeState.qrcodeStr}
        visible={!!upgradeState.qrcodeStr}
        onSubmit={() => {
          checkOrderDetails(true)
        }}
        onClose={() => {
          setUpgradeState(s => ({ ...s, isLoading: false, qrcodeStr: undefined, orderId: undefined }))
        }}
      />
    </div>
  )
}

const Details = () => (
  <div className={'transparent-font mt-1 text-sm'}>
    <p>
      若您选择升级，则代表您同意了我们的
      <a
        className={css({
          color: Colors.Common.SelectColor
        })}
        href="https://rendevoz.com/zh/terms"
        target="_blank"
      >
        使用条款
      </a>
      。<span>如您成功升级账户，则不予退款。</span>
      <span>更多问题，请加入官方QQ群：704637839</span>
    </p>
  </div>
)
