import { ClassName } from 'rendevoz'
import { ISettingItem } from './SettingItem'
import { useTranslation } from 'react-i18next'
import { useUser } from '@/api/services/login.service'
import { Content, Modal } from '@/components'
import { Line } from 'rc-progress'
import SettingGroup from '@/core/setting/SettingGroup'
import { useToggle } from '@/hooks'
import BuyCredit from '@/components/BuyCredit'

const UsageSetting = () => {
  const { t } = useTranslation()
  const [user] = useUser()

  const isPro = user?.premiumEndDate && user.premiumEndDate > Date.now()
  const usageItems: ISettingItem[] = [
    {
      title: t('settings.ocr usage'),
      column: true,
      children: (
        <Content fullWidth flex gap={5} column>
          <div className={ClassName.description()}>
            {`${user?.monthlyOcrUsed || 0} / ${isPro ? 200 : 0}`} {`(${t('settings.reset every month')})`}
          </div>
          <Line
            trailColor={'var(--border-background)'}
            strokeColor="var(--select-color)"
            style={{ flex: 1 }}
            percent={((user?.monthlyOcrUsed || 0) / (isPro ? 200 : 0)) * 100}
          ></Line>
        </Content>
      )
    }
  ]
  return (
    <>
      <SettingGroup title={t('settings.resource usage')} layout={usageItems} />
    </>
  )
}

export default UsageSetting
