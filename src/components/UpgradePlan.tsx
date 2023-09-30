import ClassName from '@/styles/classNames'
import { Button, Content, Icon } from './base'
import { useSetting } from '@/core'
import Colors from '@/consts/colors'
import LoginService, { useUser } from '@/services/login.service'
import { useToggle } from '@/hooks'
import FontSize from '@/consts/font'
import { useEffect, useState } from 'react'
import BorderInput from './base/BorderInput'
import wechatpay from '@/assets/wechatpay.png'
import { css } from '@emotion/css'
import UpgradeService from '@/services/upgrade.service'
import QRCode from 'qrcode'
import { toast } from 'react-hot-toast'
import DateFormat from '@/utils/dateFormat'

const FreePlanIncludes = ['最多创建100个实体', '查看实体关系图', '每月最多50次翻译', '全文搜索已有笔记，PDF，网页']
const ProPlanIncludes = [
  '解锁全部本地功能，无限制使用',
  '每月可使用多达10000次翻译',
  '每月最多200次图片文字识别，使图片也可被搜索',
  '10GB文件云存储*',
  '优先客户支持'
]

const UpgradePlan = () => {
  const [setting] = useSetting()
  const [user, setUser] = useUser()
  const [upgradeDetails, setUpgradeDetails] = useState<{
    method: 'monthly' | 'yearly'
    count: number
    qrcodeStr?: string
    qrcodeImgData?: string
    loading?: 'none' | 'getQrcode' | 'loadUserDetails'
  }>({
    method: 'yearly',
    count: 1
  })
  const [upgradeModalVisible, toggleUpgradeModalVisible] = useToggle(false)
  if (setting.general.language === 'en-US') {
    return <div>Not Avaliable Outside China Mainland Right Now.</div>
  }
  const getPrice = () => {
    const { method, count } = upgradeDetails
    if (method === 'monthly') {
      return count * 15
    }
    if (method === 'yearly') {
      return count * 108
    }
  }
  useEffect(() => {
    if (upgradeDetails.qrcodeStr) {
      QRCode.toDataURL(document.createElement('canvas'), upgradeDetails.qrcodeStr).then(data =>
        setUpgradeDetails(s => ({ ...s, qrcodeImgData: data }))
      )
    }
  }, [upgradeDetails.qrcodeStr])
  useEffect(() => {
    if (upgradeModalVisible === false) {
      setUpgradeDetails(s => ({
        ...s,
        method: 'yearly',
        count: 1,
        qrcodeStr: undefined,
        qrcodeImgData: undefined,
        loading: 'none'
      }))
    }
  }, [upgradeModalVisible])

  return (
    <Content
      className={ClassName.Background.pseudoBlurContrastBackground}
      flex
      gap={30}
      style={{ borderRadius: 12, overflow: 'hidden', padding: 32 }}
    >
      <Content flex column style={{ paddingRight: 30, borderRight: `1px solid ${Colors.Background.Border}` }}>
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          gap={40}
          style={{
            paddingBottom: 40,
            borderBottom: `1px solid ${Colors.Background.Border}`
          }}
        >
          <Content flex column gap={10}>
            <div className={ClassName.title()}>免费账户</div>
            <div className={ClassName.description()}>￥0 / 月</div>
          </Content>
          <Content flex column gap={6} style={{ width: 250 }}>
            {FreePlanIncludes.map(i => (
              <Content flex gap={6} key={i}>
                <Icon fill={'rgb(34,197,94)'} name="park-check" />
                <div>{i}</div>
              </Content>
            ))}
          </Content>
        </Content>

        <Content flex gap={40} alignItems="center" justifyContent="space-between" style={{ paddingTop: 40 }}>
          <Content flex column gap={10}>
            <div className={ClassName.title()}>标准账户</div>
            <Content className={ClassName.description()}>
              <div>￥15 / 月</div>
              <div>
                <span style={{ textDecoration: 'line-through', marginRight: 6 }}>￥158</span>
                ￥108{' (早鸟特惠) '} / 年{' '}
              </div>
            </Content>
          </Content>
          <Content flex column gap={6} style={{ width: 250 }}>
            {ProPlanIncludes.map(i => (
              <Content flex gap={6} key={i}>
                <Icon fill={'rgb(34,197,94)'} name="park-check" />
                <div>{i}</div>
              </Content>
            ))}
            <div style={{ marginTop: 15 }} className={ClassName.description('11px')}>
              带*为当前版本暂未上线的功能
            </div>
          </Content>
        </Content>
      </Content>
      <Content>
        {upgradeDetails.qrcodeStr ? (
          <Content flex column gap={10}>
            <Content fullWidth flex justifyContent="space-between">
              <div className={ClassName.title()}>请使用微信扫码支付</div>
              <Icon
                name="park-close"
                className={ClassName.circleButton()}
                onClick={() => {
                  setUpgradeDetails(s => ({
                    ...s,
                    qrcodeStr: undefined,
                    qrcodeImgData: undefined
                  }))
                }}
              />
            </Content>
            <img
              style={{
                width: '100%',
                border: `1px solid ${Colors.Background.Border}`
              }}
              src={upgradeDetails.qrcodeImgData}
            />
            <Content
              flex
              justifyContent="center"
              className={ClassName.flatButton()}
              onClick={() => {
                if (user && user.email && user.password) {
                  setUpgradeDetails(s => ({
                    ...s,
                    loading: 'loadUserDetails'
                  }))
                  LoginService.login(user.email, user.password)
                    .then(data => {
                      LoginService.getUserDetails(user.email, data.data.token).then(data => {
                        setUser({ ...user, ...data.data })
                        const premiumEndDate = data.data.premiumEndDate && new Date(data.data.premiumEndDate)
                        if (premiumEndDate) {
                          if (premiumEndDate.getTime() > Date.now()) {
                            toast.success(
                              `升级成功！您的会员将于${DateFormat.format(premiumEndDate.getTime(), DateFormat.Formats.default)}到期`
                            )
                          } else {
                            toast.error('您现在还不是会员！')
                          }
                        }
                        toggleUpgradeModalVisible(false)
                      })
                    })
                    .catch(e => {
                      toast.error('获取用户资料失败，请重新登录！')
                    })
                } else {
                  toast.error('缺失用户信息，请重试！')
                }
              }}
              gap={10}
              style={{
                border: `1px solid ${Colors.Background.Border}`,
                textAlign: 'center',
                fontWeight: 600
              }}
            >
              <div>付款完成后请点击我</div>
              {upgradeDetails.loading === 'loadUserDetails' && <Icon name="park-loading-four" spin />}
            </Content>
          </Content>
        ) : (
          <Content flex column gap={10}>
            <div className={ClassName.title(FontSize['15px'])}>升级为会员</div>
            <div className={ClassName.description()}>订阅方式</div>
            <Content flex gap={6}>
              <Button.IconButton
                style={{fontWeight: 600}}
                onClick={() => setUpgradeDetails(s => ({ ...s, method: 'yearly' }))}
                selected={upgradeDetails?.method === 'yearly' || undefined}
                text="年付 (-40%)"
              />
              <Button.IconButton
                onClick={() => setUpgradeDetails(s => ({ ...s, method: 'monthly' }))}
                selected={upgradeDetails?.method === 'monthly' || undefined}
                text="月付"
              />
            </Content>
            <div className={ClassName.description()}>
              订阅价格:{' '}
              {upgradeDetails.method === 'monthly' ? (
                ' 15元 / 月'
              ) : (
                <span>
                  <span style={{ textDecoration: 'line-through' }}>158元</span>
                  <span> 108元 / 年 {'(早鸟特惠)'}</span>
                </span>
              )}
            </div>
            <div className={ClassName.description()}>订阅时长 {upgradeDetails?.method === 'monthly' ? '(月)' : '(年)'}</div>
            <BorderInput
              textarea={false}
              value={upgradeDetails.count}
              onChange={v => {
                setUpgradeDetails(s => ({
                  ...s,
                  count: Number.isSafeInteger(Number(v)) ? Number(v) : s.count
                }))
              }}
              style={{ padding: '6px 12px' }}
            ></BorderInput>
            <div className={ClassName.description()}>总计费用：{getPrice()}元</div>
            <Content
              flex
              gap={10}
              alignItems="center"
              onClick={() => {
                const price = getPrice() || 0
                if (price <= 0) {
                  toast.error('价格不能等于0！')
                  return
                }
                if (price > 999) {
                  toast.error('请选择合适的价格！')
                  return
                }
                setUpgradeDetails(s => ({ ...s, loading: 'getQrcode' }))
                UpgradeService.upgradeSub(
                  upgradeDetails.method,
                  upgradeDetails.method === 'monthly' ? upgradeDetails.count : upgradeDetails.count * 12
                )
                  .then(res => {
                    if (res) {
                      setUpgradeDetails(s => ({
                        ...s,
                        qrcodeStr: res,
                        loading: 'none'
                      }))
                    } else {
                      setUpgradeDetails(s => ({ ...s, loading: 'none' }))
                      toast.error('获取微信支付失败！')
                    }
                  })
                  .catch(e => {
                    setUpgradeDetails(s => ({ ...s, loading: 'none' }))
                    toast.error('获取微信支付失败！')
                  })
              }}
              style={{ border: `1px solid ${Colors.Background.Border}` }}
              className={ClassName.flatButton(undefined, '6px 12px')}
            >
              <img style={{ height: '20px' }} src={wechatpay}></img>
              <div>微信支付</div>
              {upgradeDetails.loading === 'getQrcode' && <Icon name="park-loading-four" spin />}
            </Content>
            <div style={{ fontWeight: 600, marginTop: 16 }} className={ClassName.description()}>
              若您选择升级，则代表您同意了我们的
              <a
                className={css({
                  color: 'inherit !important'
                })}
                href="https://www.yuque.com/realrong/rendevozdoc/terms"
                target="_blank"
              >
                使用条款
              </a>
            </div>
          </Content>
        )}
      </Content>
    </Content>
  )
}

export default UpgradePlan
