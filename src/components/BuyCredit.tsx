import { Content, Icon } from '@/components'
import { CreditToYuan } from '@/api/services/ai/AI.service'
import { memo, useState } from 'react'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { AIService } from '@/api/services'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { useToggle } from '@/hooks'
import WeixinPay from '@/components/WeixinPay'
import UserService from '@/api/services/user.service'
import toast from 'react-hot-toast'
import { useIsUserPro } from '@/api/services/login.service'

export default memo(() => {
  const [selectedPlan, setSelectedPlan] = useState<string>()
  const [qrcode, setqrcode] = useState('')
  const [modalV, toggleModalV] = useToggle(false)
  const canBuy = useIsUserPro(true)
  const { t } = useTranslation()
  return (
    <Content
      style={{
        padding: '12px 48px'
      }}
    >
      <div
        style={{
          padding: '12px 0px',
          borderBottom: '1px solid var(--border-background)',
          fontSize: 22,
          fontWeight: 600
        }}
      >
        {t('settings.Pay for AI')}
      </div>
      <Content flex gap={100}>
        <Content
          style={{
            padding: '24px 12px 12px 0px'
          }}
          flex
          column
        >
          <div
            style={{
              fontWeight: 500,
              fontSize: 18,
              marginBottom: 6
            }}
          >
            {t('settings.AI can be your study copilot')}:
          </div>
          {[t('settings.Summarize articles'), t('settings.Generate questions'), t('settings.Smart search')].map(i => (
            <Content
              flex
              gap={10}
              alignItems={'center'}
              style={{
                margin: '15px 0px'
              }}
            >
              <Icon strokeWidth={5} name={'park-check'} />
              {i}
            </Content>
          ))}
        </Content>
        <Content
          flex
          column
          gap={6}
          style={{
            padding: 24
          }}
        >
          {Object.entries(CreditToYuan).map((i, idx) => (
            <div
              style={{
                border: '1px solid var(--border-background)',
                padding: '12px',
                minWidth: 300,
                cursor: 'pointer',
                borderRadius: 12
              }}
              onClick={() => setSelectedPlan(i[0])}
              key={i[0]}
            >
              <Content flex justifyContent={'space-between'} alignItems={'center'}>
                <Content flex gap={8} alignItems={'center'}>
                  <div
                    style={{
                      border: '1px solid var(--font-primary)',
                      borderRadius: 999,
                      padding: 2,
                      width: '1em',
                      height: '1em'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: selectedPlan === i[0] ? 'var(--font-primary)' : undefined,
                        borderRadius: 999
                      }}
                    ></div>
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 600
                    }}
                  >
                    {i[0]} {t('settings.Credits')}
                  </div>
                </Content>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 500
                  }}
                >
                  ¥{i[1]}
                </div>
              </Content>
              <Content
                flex
                justifyContent={'flex-end'}
                alignItems={'center'}
                gap={20}
                style={{
                  fontSize: 13,
                  color: Colors.Font.Transparent
                }}
              >
                {i[0] === '11500' && (
                  <div
                    style={{
                      marginRight: 'auto'
                    }}
                  >
                    {t('settings.Plus credits', { num: 1500 })}
                  </div>
                )}
                {i[0] === '24000' && (
                  <div
                    style={{
                      marginRight: 'auto'
                    }}
                  >
                    {t('settings.Plus credits', { num: 4000 })}
                  </div>
                )}
                {i[0] === '2000' && <div>≈ {t('settings.Sum articles', { num: 100 })}</div>}
                {i[0] === '5000' && <div>≈ {t('settings.Sum articles', { num: 250 })}</div>}
                {i[0] === '11500' && <div>≈ {t('settings.Sum articles', { num: 550 })}</div>}
                {i[0] === '24000' && <div>≈ {t('settings.Sum articles', { num: 1200 })}</div>}
              </Content>
            </div>
          ))}
          {selectedPlan !== undefined && (
            <div
              style={{
                textAlign: 'center',
                fontWeight: 500,
                fontSize: 16,
                marginTop: 8
              }}
              onClick={() => {
                if (canBuy) {
                  AIService.buyAICredit(Number(selectedPlan)).then(res => {
                    console.log(res)
                    QRCode.toDataURL(document.createElement('canvas'), res).then(data => {
                      setqrcode(data)
                      toggleModalV()
                    })
                  })
                }
              }}
              className={ClassName.selectButton(6, '8px 12px')}
            >
              {canBuy ? t('settings.Select plan') : t('settings.Subscribe to buy AI credits')}
            </div>
          )}
        </Content>
      </Content>
      <WeixinPay
        visible={modalV}
        onClose={toggleModalV}
        code={qrcode}
        onSubmit={() => {
          toggleModalV(false)
          UserService.getUserDetails().then(res => {
            toast.success('You have ' + (res.availableAICredit ?? 0) + ' credits now!')
          })
        }}
      />
    </Content>
  )
})
