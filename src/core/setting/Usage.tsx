import ClassName from '@/styles/classNames'
import SettingItem from './SettingItem'
import { useTranslation } from 'react-i18next'
import { useUser } from '@/api/services/login.service'
import { Content } from '@/components'
import { Line } from 'rc-progress'

const UsageSetting = () => {
  const { t } = useTranslation()
  const [user] = useUser()
  const isPro = user?.premiumEndDate && user.premiumEndDate > Date.now()
  const usageItems: SettingItem[] = [
    // {
    //   title: t('settings.translation usage'),
    //   column: true,
    //   children: (
    //     <Content fullWidth flex column gap={5}>
    //       <div className={ClassName.description()}>
    //         {`${user?.monthlyTranslateUsed || 0} / ${isPro ? 10000 : 50}`} {`(${t('settings.reset every month')})`}
    //       </div>
    //       <Line
    //         trailColor={'var(--border-background)'}
    //         strokeColor="var(--select-color)"
    //         style={{ flex: '1' }}
    //         percent={((user?.monthlyTranslateUsed || 0) / (isPro ? 10000 : 50)) * 100}
    //       />
    //     </Content>
    //   )
    // },
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
      <div className={ClassName.title('18px')}>{t('settings.resource usage')}</div>
      {usageItems.map(i => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
    </>
  )
}

export default UsageSetting
