import { ISettingItem } from '@/core/setting/SettingItem'
import { GlobalSetting } from '@/core'
import produce from 'immer'
import { ButtonChooser, Content, Modal, Switch } from '@/components'
import { useTranslation } from 'react-i18next'
import SettingGroup from '@/core/setting/SettingGroup'
import Select from '@/components/base/select'
import { ClassName, Utils } from 'rendevoz'
import langs from '@/consts/langs'
import { Line } from 'rc-progress'
import { useUser } from '@/api/services/login.service'
import { useToggle } from '@/hooks'
import BuyCredit from '@/components/BuyCredit'
import { memo } from 'react'

export default memo(() => {
  const [setting, setSetting] = GlobalSetting.useSetting()
  const { t } = useTranslation()
  const [user] = useUser()

  const [buyCreditVisible, toggleBuyCreditVisible] = useToggle(false)
  const updateSetting = (updater: (s: typeof setting) => void) => {
    setSetting(s =>
      produce(s, draft => {
        updater(draft)
      })
    )
  }
  const isPro = user?.premiumEndDate && user.premiumEndDate > Date.now()
  const usageSettings: ISettingItem[] = [
    {
      title: t('settings.Monthly free AI credits'),
      column: true,
      children: (
        <Content fullWidth flex gap={5} column>
          <div className={ClassName.description()}>
            {`${user?.monthlyFreeAICreditUsed ?? 0} / ${isPro ? 2000 : 0}`} {`(${t('settings.reset every month')})`}
          </div>
          <Line
            trailColor={'var(--border-background)'}
            strokeColor="var(--select-color)"
            style={{ flex: 1 }}
            percent={((user?.monthlyFreeAICreditUsed ?? 0) / (isPro ? 2000 : 0)) * 100}
          ></Line>
        </Content>
      )
    },
    {
      title: t('settings.Available AI credits'),
      description: `${user?.availableAICredit ?? 0}`,
      children: (
        <div
          className={ClassName.selectButton()}
          onClick={() => {
            toggleBuyCreditVisible(true)
          }}
        >
          {t('settings.Buy credits')}
        </div>
      )
    }
  ]
  const questionsSettings: ISettingItem[] = [
    {
      title: t('settings.Always generate questions when summarizing'),
      children: (
        <Switch
          onChange={v => {
            updateSetting(s => {
              s.AI.autoGenerateQuestionAfterSummarizing = v
            })
          }}
          value={setting.AI.autoGenerateQuestionAfterSummarizing}
        />
      )
    },
    setting.AI.autoGenerateQuestionAfterSummarizing
      ? {
          title: t('settings.Output language'),
          children: (
            <Select
              closeOnSelect={true}
              value={setting.AI.outputLanguage}
              options={Object.entries(langs).map(i => ({
                value: i[0],
                children: i[1]
              }))}
              onSelect={v => {
                updateSetting(s => {
                  s.AI.outputLanguage = v[0]
                })
              }}
            />
          )
        }
      : undefined,
    setting.AI.autoGenerateQuestionAfterSummarizing
      ? {
          title: t('settings.Generated questions number'),
          children: (
            <ButtonChooser
              value={String(setting.AI.questionGenerateNum)}
              gap={12}
              options={Utils.range(0, 5).map(i => String(i))}
              onChange={v => {
                updateSetting(s => {
                  s.AI.questionGenerateNum = Number(v)
                })
              }}
            />
          )
        }
      : undefined,
    setting.AI.autoGenerateQuestionAfterSummarizing
      ? {
          title: t('settings.Generated questions type'),
          children: (
            <Select
              closeOnSelect={true}
              value={setting.AI.questionGenerateType || 'text'}
              options={['text', 'singleSelect', 'multiSelect', 'trueOrFalse'].map(i => ({
                value: i,
                children: t(`general.${i} question`)
              }))}
              onSelect={v => {
                updateSetting(s => {
                  s.AI.questionGenerateType = v[0]
                })
              }}
            />
          )
        }
      : undefined
  ].filter(i => i) as ISettingItem[]

  return (
    <>
      <Modal visible={buyCreditVisible} onClose={toggleBuyCreditVisible}>
        <BuyCredit />
      </Modal>
      <SettingGroup title={t('settings.AI')} layout={usageSettings} />
      <SettingGroup title={t('settings.Question settings')} layout={questionsSettings} />
    </>
  )
})
