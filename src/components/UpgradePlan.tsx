import ClassName from '@/styles/classNames'
import { Button, Content, Icon, Modal } from './base'
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

const FreePlanIncludes = ['最多创建300个实体', '查看实体关系图', '每月最多50次翻译', '全文搜索已有笔记，PDF，网页']
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
    method: 'monthly',
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
      setUpgradeDetails(s => ({ ...s, method: 'monthly', count: 0, qrcodeStr: undefined, qrcodeImgData: undefined, loading: 'none' }))
    }
  }, [upgradeModalVisible])

  return (
    <Content
      flex
      column
      className={ClassName.Background.pseudoBlurContrastBackground}
      style={{
        padding: '24px 60px',
        borderRadius: 10
      }}
    >
      <Modal noStyle visible={upgradeModalVisible} onClose={toggleUpgradeModalVisible}>
        {upgradeDetails.qrcodeStr ? (
          <Content
            flex
            column
            gap={10}
            className={ClassName.Background.pseudoBlurContrastBackground}
            style={{
              width: 320,
              padding: '16px 20px',
              borderRadius: 10
            }}
          >
            <Content fullWidth flex justifyContent="space-between">
              <div className={ClassName.title()}>请使用微信扫码支付</div>
              <Icon
                name="park-close"
                className={ClassName.circleButton()}
                onClick={() => {
                  setUpgradeDetails(s => ({ ...s, qrcodeStr: undefined, qrcodeImgData: undefined }))
                }}
              />
            </Content>
            <img
              style={{ borderRadius: 8, width: '100%', border: `1px solid ${Colors.Background.Border}` }}
              src={upgradeDetails.qrcodeImgData}
            />
            <Content
              flex
              justifyContent="center"
              className={ClassName.flatButton()}
              onClick={() => {
                if (user && user.email && user.password) {
                  setUpgradeDetails(s => ({ ...s, loading: 'loadUserDetails' }))
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
          <Content
            flex
            column
            gap={10}
            className={ClassName.Background.pseudoBlurContrastBackground}
            style={{
              width: 360,
              padding: 20,
              borderRadius: 10
            }}
          >
            <div className={ClassName.title(FontSize['15px'])}>升级为会员</div>
            <div className={ClassName.description()}>订阅方式</div>
            <Content flex gap={6}>
              <Button.IconButton
                onClick={() => setUpgradeDetails(s => ({ ...s, method: 'monthly' }))}
                selected={upgradeDetails?.method === 'monthly' || undefined}
                text="月付"
              />
              <Button.IconButton
                onClick={() => setUpgradeDetails(s => ({ ...s, method: 'yearly' }))}
                selected={upgradeDetails?.method === 'yearly' || undefined}
                text="年付 (-40%)"
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
                setUpgradeDetails(s => ({ ...s, count: Number.isSafeInteger(Number(v)) ? Number(v) : s.count }))
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
                      setUpgradeDetails(s => ({ ...s, qrcodeStr: res, loading: 'none' }))
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
      </Modal>
      <Content
        flex
        alignItems="center"
        justifyContent="space-between"
        gap={40}
        style={{
          borderBottom: `1px solid ${Colors.Background.Border}`,
          padding: '40px 0px'
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

      <Content flex gap={40} alignItems="center" style={{ padding: '40px 0px' }} justifyContent="space-between">
        <Content flex column gap={10}>
          <div className={ClassName.title()}>标准账户</div>
          <Content flex className={ClassName.description()}>
            ￥15 / 月或 <span style={{ textDecoration: 'line-through', marginRight: 6 }}>￥158</span>
            <span>￥108{' (早鸟特惠) '} </span> / 年
          </Content>
          <Button.IconButton
            style={{
              justifyContent: 'center',
              border: `1px solid ${Colors.Background.Border}`
            }}
            icon="park-arrow-circle-up"
            text="现在升级"
            onClick={toggleUpgradeModalVisible}
          />
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
  )
}

export default UpgradePlan
