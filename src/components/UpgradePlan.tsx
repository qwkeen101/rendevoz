import ClassName from '@/styles/classNames'
import { Button, Content, Icon } from './base'
import { GlobalSetting } from '@/core'
import Colors from '@/consts/colors'
import { useUser } from '@/api/services/login.service'
import { useToggle } from '@/hooks'
import FontSize from '@/consts/font'
import { useEffect, useState } from 'react'
import BorderInput from './base/BorderInput'
import wechatpay from '@/assets/wechatpay.png'
import { css } from '@emotion/css'
import UpgradeService from '@/api/services/upgrade.service'
import QRCode from 'qrcode'
import { toast } from 'react-hot-toast'
import WeixinPay from '@/components/WeixinPay'
import UserService from '@/api/services/user.service'

const FreePlanIncludes = [
  '最多创建100个实体',
  '超过创建限制后仍可以编辑一切资料',
  '使用大部分本地功能',
  '查看实体关系图',
  '文档与实体全文搜索'
]
const ProPlanIncludes = [
  '解锁全部本地功能，无限制使用',
  '不限额网页，文档与PDF翻译',
  '每月免费使用200次图片文字识别',
  '优先体验云端同步与AI功能',
  '每月免费使用2000AI点数',
  '优先客户支持'
]
const LifetimePlanIncludes = [
  '永久解锁使用本地功能与后续更新内容，不限平台，不限版本',
  '优先体验新内容',
  '优先客户支持',
  '优先享受订阅折扣优惠'
]

const UpgradePlan = () => {
  const [setting] = GlobalSetting.useSetting()
  const [user, setUser] = useUser()
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
  const [upgradeModalVisible, toggleUpgradeModalVisible] = useToggle(false)
  if (setting.general.language === 'en-US') {
    return <div>Not Avaliable Outside China Mainland Right Now.</div>
  }
  const getPrice = () => {
    const { method, count } = upgradeDetails
    if (method === 'lifetime') return 238
    if (method === 'monthly') {
      return count * 15
    }
    if (method === 'yearly') {
      return user?.lifetimePro ? count * 108 : count * 158
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
        method: 'lifetime',
        count: 1,
        qrcodeStr: undefined,
        qrcodeImgData: undefined,
        loading: 'none'
      }))
    }
  }, [upgradeModalVisible])

  return (
    <>
      <Content flex gap={30} style={{ borderRadius: 12, overflow: 'hidden', padding: 32 }}>
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
            <Content flex column gap={6} style={{ width: 250, fontSize: 14 }}>
              {FreePlanIncludes.map(i => (
                <Content flex gap={6} key={i}>
                  <Icon fill={'rgb(34,197,94)'} name="park-check" />
                  <div>{i}</div>
                </Content>
              ))}
            </Content>
          </Content>

          <Content
            flex
            gap={40}
            alignItems="center"
            justifyContent="space-between"
            style={{ paddingTop: 40, borderBottom: `1px solid ${Colors.Background.Border}`, paddingBottom: 40 }}
          >
            <Content flex column gap={10}>
              <div className={ClassName.title()}>标准账户</div>
              <Content className={ClassName.description()}>
                <div style={{ marginBottom: 4 }}>￥15 / 月</div>
                <div style={{ marginBottom: 4 }}>￥158 / 年</div>
                <div>￥108 / 年 (永久会员优惠价)</div>
              </Content>
            </Content>
            <Content flex column gap={6} style={{ width: 250, fontSize: 14 }}>
              {ProPlanIncludes.map(i => (
                <Content flex gap={6} key={i}>
                  <Icon fill={'rgb(34,197,94)'} name="park-check" />
                  <div>{i}</div>
                </Content>
              ))}
            </Content>
          </Content>
          <Content flex gap={40} alignItems="center" justifyContent="space-between" style={{ paddingTop: 40 }}>
            <Content flex column gap={10}>
              <div className={ClassName.title()}>永久账户</div>
              <Content className={ClassName.description()}>
                <div>解锁永久账户，终生使用。</div>
                <div>(不包含云端服务)</div>
              </Content>
              <Content className={ClassName.description()}>
                <div>￥238</div>
              </Content>
            </Content>
            <Content flex column gap={6} style={{ width: 250, fontSize: 14 }}>
              {LifetimePlanIncludes.map(i => (
                <Content flex gap={6} key={i}>
                  <Icon fill={'rgb(34,197,94)'} name="park-check" />
                  <div>{i}</div>
                </Content>
              ))}
            </Content>
          </Content>
        </Content>
        <Content flex column gap={10}>
          <div className={ClassName.title(FontSize['15px'])}>升级为会员</div>
          <div className={ClassName.description()}>订阅方式</div>
          <Content flex gap={6}>
            <Button.IconButton
              style={{ fontWeight: 600 }}
              onClick={() => setUpgradeDetails(s => ({ ...s, method: 'lifetime' }))}
              selected={upgradeDetails?.method === 'lifetime' || undefined}
              text="永久"
            />
            <Button.IconButton
              style={{ fontWeight: 600 }}
              onClick={() => setUpgradeDetails(s => ({ ...s, method: 'yearly' }))}
              selected={upgradeDetails?.method === 'yearly' || undefined}
              text="年付"
            />
            <Button.IconButton
              style={{ fontWeight: 600 }}
              onClick={() => setUpgradeDetails(s => ({ ...s, method: 'monthly' }))}
              selected={upgradeDetails?.method === 'monthly' || undefined}
              text="月付"
            />
          </Content>
          {upgradeDetails.method !== 'lifetime' && (
            <>
              <div className={ClassName.description()}>
                订阅价格:
                {upgradeDetails.method === 'monthly' && ' 15元 / 月'}
                {upgradeDetails.method === 'yearly' && <span> {user?.lifetimePro ? 108 : 158}元 / 年</span>}
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
            </>
          )}
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
                upgradeDetails.method === 'monthly' || upgradeDetails.method === 'lifetime'
                  ? upgradeDetails.count
                  : upgradeDetails.count * 12
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
                color: Colors.Common.SelectColor
              })}
              href="https://rendevoz.com/zh/terms"
              target="_blank"
            >
              使用条款
            </a>
          </div>
          <div style={{ fontWeight: 600 }} className={ClassName.description()}>
            如您成功升级账户，则不予退款。
          </div>
          <div style={{ fontWeight: 600 }} className={ClassName.description()}>
            更多问题，请加入官方QQ群：704637839
          </div>
        </Content>
      </Content>
      <WeixinPay
        code={upgradeDetails.qrcodeImgData}
        visible={!!upgradeDetails.qrcodeImgData}
        onSubmit={async () => {
          setUpgradeDetails({ count: 1, method: 'lifetime' })
          toggleUpgradeModalVisible()
          UserService.getUserDetails().then(res => {
            if (res.lifetimePro || (res.premiumEndDate ?? 0) > Date.now()) {
              toast.success('You are Pro now!')
            } else {
              toast.error('Failed to upgrade.')
            }
          })
        }}
        onClose={() => {
          setUpgradeDetails({ method: 'lifetime', count: 1 })
        }}
      />
    </>
  )
}

export default UpgradePlan
